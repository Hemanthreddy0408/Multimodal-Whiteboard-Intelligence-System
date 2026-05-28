"""
LLM Reasoning Service

This is the "brain" layer that synthesizes everything:
- OCR text from TrOCR
- Segmented elements from SAM
- Similar diagrams from Qdrant vector search
- User questions

...into rich, intelligent responses: explanations, code, summaries.

WHY NOT JUST SEND THE IMAGE TO GPT-4o DIRECTLY?
You could. But there are strong reasons NOT to:

1. COST: GPT-4o vision costs ~$0.01 per image. With 100 users/day = $1/day.
   With our pipeline: only OCR results + structured data → 10-50x cheaper.

2. RELIABILITY: LLMs hallucinate when given raw images.
   Structured input (JSON with detected elements) grounds the model.

3. SPEED: Vision inference is slower than text inference.

4. CONTEXT: We can inject similar diagram context from Qdrant (RAG-style).
   This dramatically improves code generation quality.

STRATEGY:
1. Run CV pipeline to extract structured data (elements, text, relationships)
2. Format as structured prompt with all extracted information
3. Call LLM with text-only or multimodal prompt depending on mode
4. Cache results in Redis to avoid repeat API calls

SUPPORTED MODELS:
- GPT-4o (OpenAI) — Best quality, multimodal capable
- Gemini 1.5 Pro (Google) — Great multimodal, lower cost
- Llama 3 via Ollama — 100% free, private, local inference
  (Fallback when OpenAI/Gemini APIs are unavailable/expensive)
"""
import json
import asyncio
import logging
from typing import Optional, List, Dict, Any
from enum import Enum

log = logging.getLogger(__name__)


class LLMProvider(str, Enum):
    OPENAI = "openai"
    GEMINI = "gemini"
    OLLAMA = "ollama"


class LLMService:
    """
    Unified LLM interface supporting multiple providers.
    
    Falls back gracefully: OpenAI → Gemini → Ollama → Error
    """
    
    def __init__(self):
        self._openai_client = None
        self._gemini_model = None

    # ─── Provider Setup ────────────────────────────────────────────────────────

    def _get_openai(self):
        """Lazy-load OpenAI client."""
        if self._openai_client:
            return self._openai_client
        try:
            from openai import AsyncOpenAI
            from core.config import settings
            if settings.OPENAI_API_KEY:
                self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        except Exception as e:
            log.warning(f"OpenAI not available: {e}")
        return self._openai_client

    def _get_gemini(self):
        """Lazy-load Gemini client."""
        if self._gemini_model:
            return self._gemini_model
        try:
            import google.generativeai as genai
            from core.config import settings
            if settings.GOOGLE_API_KEY:
                genai.configure(api_key=settings.GOOGLE_API_KEY)
                self._gemini_model = genai.GenerativeModel("gemini-1.5-pro")
        except Exception as e:
            log.warning(f"Gemini not available: {e}")
        return self._gemini_model

    # ─── Core Analysis Method ──────────────────────────────────────────────────

    async def analyze_diagram(
        self,
        diagram_type: str,
        elements: List[Dict],
        ocr_text: str,
        similar_diagrams: List[Dict],
        user_question: Optional[str] = None,
        target_language: str = "python",
        provider: LLMProvider = LLMProvider.OPENAI,
        pil_image_bytes: Optional[bytes] = None,
    ) -> Dict[str, Any]:
        """
        Main analysis method — orchestrates the LLM call.
        
        PROMPT ENGINEERING STRATEGY:
        
        We use a STRUCTURED PROMPT that:
        1. Sets the role: "You are an expert software architect"
        2. Provides all extracted data as structured JSON
        3. Includes RAG context (similar diagrams found in Qdrant)
        4. Gives clear task instructions
        5. Requires JSON output (prevents hallucinations, easier parsing)
        
        The model sees:
        - diagram_type: "flowchart" / "dsa" / "architecture" / "er_diagram"
        - elements: [{type: "box", text: "Start", bbox: [10, 20, 100, 50]}, ...]
        - ocr_text: "Start → Process Data → Validate → End"
        - similar_diagrams: [{"type": "flowchart", "summary": "...similar diagram..."}]
        - user_question: "Generate Python code for this sorting algorithm"
        
        Returns:
            dict with: explanation, code, summary, relationships, diagram_type_confirmed
        """
        
        # Build the structured prompt
        prompt = self._build_analysis_prompt(
            diagram_type, elements, ocr_text, 
            similar_diagrams, user_question, target_language
        )
        
        log.info(f"🤖 Calling {provider} LLM for diagram analysis...")
        
        # Try providers in order of preference
        response = None
        
        if provider == LLMProvider.OPENAI or response is None:
            response = await self._call_openai(prompt, pil_image_bytes)
        
        if response is None and (provider == LLMProvider.GEMINI or True):
            response = await self._call_gemini(prompt, pil_image_bytes)
        
        if response is None:
            response = await self._call_ollama(prompt)
        
        if response is None:
            response = self._get_error_response(user_question)
        
        return response

    def _build_analysis_prompt(
        self,
        diagram_type: str,
        elements: List[Dict],
        ocr_text: str,
        similar_diagrams: List[Dict],
        user_question: Optional[str],
        target_language: str,
    ) -> str:
        """
        Craft the expert prompt for diagram analysis.
        
        PROMPT ENGINEERING PRINCIPLES USED:
        1. Role prompting: "You are an expert..."
        2. Structured input: JSON format prevents ambiguity
        3. Few-shot context: similar_diagrams from RAG provides examples
        4. Clear output format: JSON with specific keys
        5. Chain-of-thought hint: "Think step by step before answering"
        """
        
        # Serialize elements, limit to top 20 to avoid token overflow
        elements_json = json.dumps(elements[:20], indent=2, default=str)
        
        # Summarize similar diagrams for RAG context
        rag_context = ""
        if similar_diagrams:
            rag_context = f"""
SIMILAR DIAGRAMS FROM KNOWLEDGE BASE (for context):
{json.dumps(similar_diagrams[:3], indent=2, default=str)}
"""
        
        question_section = ""
        if user_question:
            question_section = f"\nUSER QUESTION: {user_question}"
        
        return f"""You are an expert software architect and computer science professor.
You have been given analyzed data from a diagram image. Your job is to:
1. Understand the diagram structure
2. Explain it clearly for both beginners and experts
3. Generate working, well-commented {target_language} code
4. Identify relationships and patterns

DIAGRAM INFORMATION:
- Detected Type: {diagram_type}
- OCR Text Extracted: "{ocr_text}"

DETECTED DIAGRAM ELEMENTS:
{elements_json}
{rag_context}
{question_section}

Think step by step. Then respond with EXACTLY this JSON structure (no extra text):
{{
    "diagram_type_confirmed": "flowchart|dsa|architecture|er_diagram|class_diagram|unknown",
    "explanation": "Clear, detailed explanation of what this diagram shows. Mention every element and relationship.",
    "summary": "One-paragraph executive summary of this diagram",
    "relationships": [
        {{"from": "element_name", "to": "element_name", "relationship": "description"}}
    ],
    "algorithm_or_pattern": "Name of the algorithm or design pattern if applicable",
    "code": "Complete working {target_language} code implementing or representing this diagram",
    "code_explanation": "Line-by-line explanation of the generated code",
    "complexity": {{"time": "O(n)", "space": "O(1)"}},
    "multi_language_suggestions": ["python", "javascript", "java"],
    "confidence": 0.0
}}"""

    # ─── Provider Implementations ──────────────────────────────────────────────

    async def _call_openai(self, prompt: str, image_bytes: Optional[bytes]) -> Optional[Dict]:
        """
        Call GPT-4o (or gpt-4o-mini for cost savings).
        
        If image_bytes is provided, uses vision mode (multimodal).
        Otherwise text-only (cheaper, faster).
        """
        client = self._get_openai()
        if not client:
            return None
        
        try:
            messages = []
            
            if image_bytes:
                # Multimodal: send both text and image
                import base64
                b64 = base64.b64encode(image_bytes).decode("utf-8")
                messages = [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {
                            "url": f"data:image/png;base64,{b64}",
                            "detail": "high"  # high detail = more tokens, better analysis
                        }}
                    ]
                }]
            else:
                messages = [{"role": "user", "content": prompt}]
            
            response = await client.chat.completions.create(
                model="gpt-4o",           # Best model for multimodal
                messages=messages,
                temperature=0.1,          # Low temperature = more deterministic output
                max_tokens=2000,
                response_format={"type": "json_object"},  # Force JSON output
            )
            
            content = response.choices[0].message.content
            result = json.loads(content)
            result["_model_used"] = "gpt-4o"
            log.info("✅ GPT-4o response received")
            return result
            
        except Exception as e:
            log.error(f"OpenAI error: {e}")
            return None

    async def _call_gemini(self, prompt: str, image_bytes: Optional[bytes]) -> Optional[Dict]:
        """
        Call Google Gemini 1.5 Pro.
        
        Gemini is particularly good at:
        - Long context (1M tokens)  
        - Multimodal understanding
        - Lower cost than GPT-4o
        """
        model = self._get_gemini()
        if not model:
            return None
        
        try:
            import google.generativeai as genai
            
            parts = [prompt]
            
            if image_bytes:
                from PIL import Image
                import io
                pil_image = Image.open(io.BytesIO(image_bytes))
                parts = [pil_image, prompt]
            
            # Gemini runs synchronously, run in thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: model.generate_content(
                    parts,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,
                        max_output_tokens=2000,
                    )
                )
            )
            
            # Extract JSON from response
            text = response.text
            # Find JSON block if model added extra text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start != -1 and end > start:
                result = json.loads(text[start:end])
                result["_model_used"] = "gemini-1.5-pro"
                log.info("✅ Gemini response received")
                return result
                
        except Exception as e:
            log.error(f"Gemini error: {e}")
        return None

    async def _call_ollama(self, prompt: str) -> Optional[Dict]:
        """
        Call Llama 3 via Ollama (100% local, free, private).
        
        Ollama runs models locally — no API key, no cost, no data leaving your machine.
        Performance depends on hardware:
        - CPU: ~1-5 tokens/sec (slow but works)
        - GPU (RTX 3080): ~30-50 tokens/sec
        - M2 MacBook: ~20-30 tokens/sec
        
        Models available via Ollama:
        - llama3:8b   — Fast, decent quality
        - llama3:70b  — Slower, much better quality
        - mistral:7b  — Alternative, efficient
        - codellama   — Specialized for code generation
        """
        try:
            import httpx
            from core.config import settings
            
            payload = {
                "model": "llama3",
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "format": "json",           # Force JSON output
                "options": {"temperature": 0.1}
            }
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    f"{settings.OLLAMA_BASE_URL}/api/chat",
                    json=payload
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data["message"]["content"]
                    
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    if start != -1:
                        result = json.loads(content[start:end])
                        result["_model_used"] = "llama3-local"
                        log.info("✅ Ollama/Llama3 response received")
                        return result
                        
        except Exception as e:
            log.error(f"Ollama error: {e}")
        return None

    def _get_error_response(self, question: Optional[str]) -> Dict:
        """Return a structured error response when all LLM providers fail."""
        return {
            "diagram_type_confirmed": "unknown",
            "explanation": "AI analysis temporarily unavailable. The diagram was preprocessed and OCR was extracted successfully.",
            "summary": "Analysis pending — configure OpenAI, Gemini, or Ollama credentials.",
            "relationships": [],
            "algorithm_or_pattern": None,
            "code": "# AI code generation requires a configured LLM provider\n# Set OPENAI_API_KEY or GOOGLE_API_KEY in .env",
            "code_explanation": "Please configure an LLM provider.",
            "complexity": {"time": "N/A", "space": "N/A"},
            "multi_language_suggestions": ["python"],
            "confidence": 0.0,
            "_model_used": "none"
        }

    async def answer_question(
        self,
        question: str,
        context: Dict,
        provider: LLMProvider = LLMProvider.OPENAI,
    ) -> str:
        """
        Answer a user question about a previously analyzed diagram.
        
        Uses the stored analysis result as context — no need to re-run the full
        CV pipeline. Just pass the structured data to the LLM.
        """
        prompt = f"""You are an AI assistant helping explain a software diagram.

DIAGRAM CONTEXT:
{json.dumps(context, indent=2, default=str)}

USER QUESTION: {question}

Answer concisely and accurately. If generating code, make it complete and runnable."""
        
        result = await self._call_openai(prompt, None)
        if result:
            return result.get("explanation", str(result))
        
        result = await self._call_gemini(prompt, None)
        if result:
            return result.get("explanation", str(result))
        
        result = await self._call_ollama(prompt)
        if result:
            return result.get("explanation", str(result))
        
        return "I couldn't connect to any AI provider. Please check your API keys."

    async def generate_code_for_language(
        self,
        base_code: str,
        target_language: str,
        context: str,
    ) -> str:
        """
        Convert code from one language to another.
        
        Example: Python bubble sort → JavaScript bubble sort
        """
        prompt = f"""Convert the following code to {target_language}.
Make it idiomatic for {target_language}. Add comments explaining key parts.

Context about the diagram: {context}

Original code:
```
{base_code}
```

Return ONLY the {target_language} code with comments. No extra text."""
        
        for call_fn in [self._call_openai, self._call_gemini]:
            try:
                result = await call_fn(prompt, None)
                if result and "code" in result:
                    return result["code"]
            except Exception:
                continue
        
        return f"# Code translation to {target_language} requires LLM configuration"


# Singleton
llm_service = LLMService()
