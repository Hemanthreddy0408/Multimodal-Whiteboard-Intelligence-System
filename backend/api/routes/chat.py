"""Chat API Route — AI Q&A about analyzed diagrams"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging

from services.llm_service import llm_service

log = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    question: str
    upload_id: Optional[str] = None
    context: Optional[dict] = None
    language: str = "python"


class ChatResponse(BaseModel):
    answer: str
    model_used: str = "unknown"


@router.post("/", response_model=ChatResponse)
async def chat_with_diagram(request: ChatRequest):
    """
    Ask a question about a previously analyzed diagram.
    
    The context dict should contain the analysis result from the pipeline.
    This allows the LLM to answer questions without re-running CV inference.
    
    EXAMPLES:
    - "What does this flowchart do?"
    - "Can you generate this in Java instead?"
    - "What is the time complexity?"
    - "Explain the relationships in simpler terms"
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    context = request.context or {
        "note": "No diagram context provided. Answer based on general knowledge."
    }
    
    try:
        answer = await llm_service.answer_question(
            question=request.question,
            context=context,
        )
        return ChatResponse(answer=answer, model_used="gpt-4o")
    except Exception as e:
        log.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/translate-code")
async def translate_code(
    base_code: str,
    target_language: str,
    context: str = "",
):
    """Translate generated code to a different programming language."""
    try:
        translated = await llm_service.generate_code_for_language(
            base_code=base_code,
            target_language=target_language,
            context=context,
        )
        return {"code": translated, "language": target_language}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
