"""
Diagram Analysis Pipeline

This is the MASTER ORCHESTRATOR that ties together ALL AI services:
1. OpenCV Preprocessing
2. SAM Segmentation
3. TrOCR Text Extraction
4. DINOv2 Embedding Generation
5. Qdrant Vector Search
6. LLM Reasoning

Think of this as the "conductor" of the AI orchestra.

PIPELINE FLOW:
Raw image bytes
    ↓
[OpenCV] Preprocessing (deskew, denoise, binarize)
    ↓
[SAM] Segmentation (separate diagram elements)
    ↓
[TrOCR] Text extraction (batch process each element crop)
    ↓
[Rule Engine] Classify diagram type (flowchart/DSA/arch)
    ↓
[DINOv2] Generate semantic embedding (1024-dim vector)
    ↓
[Qdrant] Store embedding + Search for similar diagrams
    ↓
[Attention] Generate visual attention heatmap (optional)
    ↓
[LLM] Analyze, explain, generate code
    ↓
Structured result dict
    ↓
Save to PostgreSQL

DESIGN DECISION: Why run CV before LLM?
- CV is local, fast, cheap (microseconds)
- LLM is remote, slow, expensive (seconds + API cost)
- CV extracts structured data that makes LLM prompts much better
- LLM can focus on reasoning, not basic perception
"""
import asyncio
import os
import uuid
import json
import logging
from typing import Optional, Dict, Any, Callable

log = logging.getLogger(__name__)


class AnalysisPipeline:
    """
    Complete diagram analysis pipeline.
    
    The pipeline is designed to:
    1. Run CV stages synchronously (fast, sequential, must complete in order)
    2. Run LLM call asynchronously (can be cancelled, has timeout)
    3. Report progress via callback for WebSocket updates
    4. Handle partial failures gracefully (if SAM fails, continue without it)
    """

    async def run(
        self,
        image_bytes: bytes,
        upload_id: str,
        session_id: str,
        user_question: Optional[str] = None,
        target_language: str = "python",
        progress_callback: Optional[Callable] = None,
    ) -> Dict[str, Any]:
        """
        Execute the full analysis pipeline.
        
        Args:
            image_bytes: Raw image file content
            upload_id: PostgreSQL upload record ID
            session_id: Current user session
            user_question: Optional question about the diagram
            target_language: Programming language for code generation
            progress_callback: async function(stage, progress, message) for WebSocket
            
        Returns:
            Complete analysis result dict
        """
        
        async def report(stage: str, progress: int, message: str):
            if progress_callback:
                await progress_callback(stage, progress, message)
            log.info(f"[{progress}%] {stage}: {message}")

        # Lazy imports — only loaded when analysis actually runs
        try:
            from PIL import Image
            import numpy as np
            from core.config import settings
            from services.opencv_service import preprocessor
            from services.sam_service import sam_service
            from services.trocr_service import trocr_service
            from services.dinov2_service import dinov2_service
            from services.vector_service import vector_service
            from services.llm_service import llm_service, LLMProvider
        except ImportError as e:
            missing = str(e)
            log.warning(f"Some AI packages not installed: {missing}")
            # Return a minimal result if core packages are missing
            if "PIL" in missing or "numpy" in missing:
                await report("error", -1, f"Missing package: {missing}. Run: pip3 install Pillow numpy")
                result["error"] = str(missing)
                result["explanation"] = f"Package not installed: {missing}"
                return result

        result = {
            "upload_id": upload_id,
            "session_id": session_id,
            "diagram_type": "unknown",
            "elements": [],
            "ocr_text": "",
            "explanation": "",
            "generated_code": None,
            "code_explanation": "",
            "summary": "",
            "relationships": [],
            "similar_diagrams": [],
            "attention_map_url": None,
            "confidence": 0.0,
            "model_used": "none",
            "embedding_id": None,
        }

        try:
            # ─── Stage 1: OpenCV Preprocessing ────────────────────────────────
            await report("preprocessing", 10, "Cleaning and preprocessing image...")
            
            preprocessed = preprocessor.preprocess(image_bytes)
            pil_image = preprocessed["pil_image"]
            contours = preprocessed["contours"]
            binary = preprocessed["binary"]
            
            log.info(f"Preprocessing complete: {len(contours)} raw contours found")

            # ─── Stage 2: SAM Segmentation ─────────────────────────────────────
            await report("segmentation", 25, f"Segmenting diagram elements...")
            
            img_np = preprocessed["preprocessed"]
            segments = sam_service.segment(img_np)
            
            # Classify elements into diagram structure
            boxes = [s for s in segments if s["element_type"] == "box"]
            arrows = [s for s in segments if s["element_type"] == "arrow"]
            text_regions = [s for s in segments if s["element_type"] == "text"]
            
            log.info(f"Segmentation: {len(boxes)} boxes, {len(arrows)} arrows, {len(text_regions)} text regions")
            
            await report("segmentation", 35, 
                        f"Found {len(boxes)} nodes, {len(arrows)} arrows, {len(text_regions)} text regions")

            # ─── Stage 3: TrOCR Text Extraction ───────────────────────────────
            await report("ocr", 40, "Extracting text with TrOCR...")
            
            # Batch process: collect all PIL image crops
            pil_crops = []
            crop_meta = []
            
            for seg in segments:
                if seg.get("pil_crop"):
                    pil_crops.append(seg["pil_crop"])
                    crop_meta.append({
                        "type": seg["element_type"],
                        "bbox": seg["bbox"],
                        "confidence": seg["confidence"],
                    })
            
            # Also run full-image OCR for overall text
            full_image_text = trocr_service.extract_full_image_text(pil_image)
            
            # Batch OCR on all crops
            if pil_crops:
                crop_texts = trocr_service.extract_batch(pil_crops)
            else:
                crop_texts = []
            
            # Build structured elements list
            elements = []
            for i, (meta, text) in enumerate(zip(crop_meta, crop_texts)):
                if text:  # Only include elements with extracted text
                    elements.append({
                        "id": i,
                        "type": meta["type"],
                        "text": text,
                        "bbox": meta["bbox"],
                        "confidence": meta["confidence"],
                    })
            
            # Combine all OCR text
            all_texts = [e["text"] for e in elements if e["text"]]
            if full_image_text:
                all_texts.insert(0, full_image_text)
            ocr_text = " → ".join(filter(None, all_texts)) if all_texts else "No text detected"
            
            result["elements"] = elements
            result["ocr_text"] = ocr_text
            
            await report("ocr", 50, f"OCR complete: '{ocr_text[:80]}...' " if len(ocr_text) > 80 else f"OCR: '{ocr_text}'")

            # ─── Stage 4: Diagram Type Classification ─────────────────────────
            await report("classification", 55, "Classifying diagram type...")
            
            diagram_type = self._classify_diagram_type(elements, ocr_text, 
                                                         len(arrows), len(boxes))
            result["diagram_type"] = diagram_type
            
            await report("classification", 60, f"Diagram type: {diagram_type}")

            # ─── Stage 5: DINOv2 Embedding Generation ─────────────────────────
            await report("embedding", 65, "Generating semantic embedding with DINOv2...")
            
            embedding = dinov2_service.generate_embedding(pil_image)
            
            # ─── Stage 6: Qdrant — Search Similar Diagrams ────────────────────
            await report("vector_search", 70, "Searching for similar diagrams...")
            
            similar_diagrams = vector_service.search_similar(
                query_embedding=embedding,
                limit=3,
                score_threshold=0.3,
            )
            result["similar_diagrams"] = similar_diagrams
            
            # ─── Stage 7: Store New Embedding ─────────────────────────────────
            embedding_id = vector_service.store_embedding(
                upload_id=upload_id,
                embedding=embedding,
                metadata={
                    "diagram_type": diagram_type,
                    "ocr_text": ocr_text,
                    "session_id": session_id,
                    "file_path": f"{settings.UPLOAD_DIR}/{upload_id}.png",
                }
            )
            result["embedding_id"] = embedding_id
            
            # ─── Stage 8: Attention Heatmap (async, non-blocking) ─────────────
            await report("attention", 75, "Generating attention heatmap...")
            
            try:
                attn_map = dinov2_service.generate_attention_map(pil_image)
                if attn_map is not None:
                    attn_path = f"{settings.UPLOAD_DIR}/{upload_id}_attention.png"
                    dinov2_service.save_attention_visualization(pil_image, attn_map, attn_path)
                    result["attention_map_url"] = f"/uploads/{upload_id}_attention.png"
            except Exception as e:
                log.warning(f"Attention map generation failed: {e}")

            # ─── Stage 9: LLM Reasoning ───────────────────────────────────────
            await report("llm_analysis", 80, "Analyzing with AI (LLM reasoning)...")
            
            # Run LLM call with timeout (don't wait forever for external API)
            try:
                llm_result = await asyncio.wait_for(
                    llm_service.analyze_diagram(
                        diagram_type=diagram_type,
                        elements=elements,
                        ocr_text=ocr_text,
                        similar_diagrams=similar_diagrams,
                        user_question=user_question,
                        target_language=target_language,
                    ),
                    timeout=60.0  # 60 second timeout for LLM
                )
            except asyncio.TimeoutError:
                log.warning("LLM call timed out — using placeholder")
                llm_result = llm_service._get_error_response(user_question)
            
            # Merge LLM results into main result
            result.update({
                "explanation": llm_result.get("explanation", ""),
                "generated_code": llm_result.get("code"),
                "code_explanation": llm_result.get("code_explanation", ""),
                "summary": llm_result.get("summary", ""),
                "relationships": llm_result.get("relationships", []),
                "model_used": llm_result.get("_model_used", "unknown"),
                "confidence": llm_result.get("confidence", 0.8),
                "algorithm_pattern": llm_result.get("algorithm_or_pattern"),
                "complexity": llm_result.get("complexity", {}),
            })
            
            # Update Qdrant with LLM-enriched metadata
            vector_service.store_embedding(
                upload_id=upload_id,
                embedding=embedding,
                metadata={
                    "diagram_type": llm_result.get("diagram_type_confirmed", diagram_type),
                    "ocr_text": ocr_text,
                    "explanation": result["explanation"][:500],  # Truncate for storage
                    "session_id": session_id,
                    "file_path": f"{settings.UPLOAD_DIR}/{upload_id}.png",
                }
            )
            
            await report("complete", 100, "Analysis complete! ✅")
            
        except Exception as e:
            log.error(f"Pipeline error: {e}", exc_info=True)
            result["error"] = str(e)
            await report("error", -1, f"Pipeline error: {str(e)[:100]}")
        
        return result

    def _classify_diagram_type(
        self,
        elements: list,
        ocr_text: str,
        arrow_count: int,
        box_count: int,
    ) -> str:
        """
        Rule-based diagram type classification.
        
        In a production system, you'd train a classifier.
        Here we use simple heuristics + keyword matching.
        
        RULES:
        - Flowchart: has arrows + boxes + keywords like Start/End/Decision
        - DSA: keywords like array/tree/node/left/right/sorted
        - Architecture: keywords like server/client/database/API/microservice
        - ER Diagram: keywords like entity/attribute/relationship/primary key
        - Class Diagram: keywords like class/method/interface/extends/implements
        - Math/Formula: lots of numbers and symbols, few arrows
        """
        ocr_lower = ocr_text.lower()
        
        # DSA keywords
        dsa_keywords = ["tree", "node", "left", "right", "root", "leaf", 
                        "array", "stack", "queue", "heap", "graph", "sort",
                        "search", "binary", "linked", "null", "pointer"]
        
        # Flowchart keywords  
        flow_keywords = ["start", "end", "begin", "stop", "yes", "no",
                         "decision", "process", "input", "output", "loop"]
        
        # Architecture keywords
        arch_keywords = ["server", "client", "database", "api", "service",
                         "microservice", "load balancer", "cache", "cdn",
                         "frontend", "backend", "gateway", "queue"]
        
        # ER diagram keywords
        er_keywords = ["entity", "attribute", "relationship", "primary",
                       "foreign", "key", "table", "schema", "record"]
        
        # UML keywords
        uml_keywords = ["class", "method", "interface", "extends", "implements",
                        "abstract", "public", "private", "constructor"]
        
        # Count keyword matches
        scores = {
            "dsa": sum(1 for k in dsa_keywords if k in ocr_lower),
            "flowchart": sum(1 for k in flow_keywords if k in ocr_lower),
            "architecture": sum(1 for k in arch_keywords if k in ocr_lower),
            "er_diagram": sum(1 for k in er_keywords if k in ocr_lower),
            "class_diagram": sum(1 for k in uml_keywords if k in ocr_lower),
        }
        
        # Structural rules (override keyword scores in some cases)
        if arrow_count > 5 and box_count > 3:
            scores["flowchart"] += 3  # High arrow+box count → likely flowchart
        
        if arrow_count == 0 and box_count > 5:
            scores["er_diagram"] += 2  # Many boxes, no arrows → ER diagram
        
        # Find winner
        best_type = max(scores, key=scores.get)
        
        # Only use classification if there's clear evidence
        if scores[best_type] >= 2:
            return best_type
        
        # Fall back to structural inference
        if arrow_count > 3:
            return "flowchart"
        if box_count > 5:
            return "architecture"
        
        return "general_diagram"

    def save_upload_image(self, image_bytes: bytes, upload_id: str) -> str:
        """Save the uploaded image to disk and return the file path."""
        from core.config import settings
        from PIL import Image
        from io import BytesIO
        
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_path = f"{settings.UPLOAD_DIR}/{upload_id}.png"
        
        # Convert to PIL and save as PNG for consistency
        img = Image.open(BytesIO(image_bytes))
        img.save(file_path, "PNG")
        
        log.info(f"💾 Saved image to {file_path}")
        return file_path


# Singleton
pipeline = AnalysisPipeline()
