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
import time
import numpy as np
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

        latencies = {
            "preprocessing": 0.0,
            "segmentation": 0.0,
            "ocr": 0.0,
            "embedding": 0.0,
            "classification": 0.0,
            "llm": 0.0
        }

        try:
            # ─── Stage 1: OpenCV Preprocessing ────────────────────────────────
            t_preprocessing = time.time()
            await report("preprocessing", 10, "Cleaning and preprocessing image...")
            
            preprocessed = preprocessor.preprocess(image_bytes)
            pil_image = preprocessed["pil_image"]
            contours = preprocessed["contours"]
            binary = preprocessed["binary"]
            
            log.info(f"Preprocessing complete: {len(contours)} raw contours found")
            latencies["preprocessing"] = time.time() - t_preprocessing

            # ─── Stage 2: SAM Segmentation ─────────────────────────────────────
            t_segmentation = time.time()
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
            latencies["segmentation"] = time.time() - t_segmentation

            # ─── Stage 3: TrOCR Text Extraction ───────────────────────────────
            t_ocr = time.time()
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
            latencies["ocr"] = time.time() - t_ocr

            # ─── Stage 4: DINOv2 Embedding Generation ─────────────────────────
            t_embedding = time.time()
            await report("embedding", 55, "Generating semantic embedding with DINOv2...")
            
            embedding = dinov2_service.generate_embedding(pil_image)
            latencies["embedding"] = time.time() - t_embedding

            # ─── Stage 5: Diagram Type Classification (PyTorch Model) ─────────
            t_classification = time.time()
            await report("classification", 65, "Classifying diagram type with ML Classifier Head...")
            
            diagram_type, class_confidence, low_confidence = self._classify_diagram_type(
                embedding, elements, ocr_text, len(arrows), len(boxes)
            )
            result["diagram_type"] = diagram_type
            result["confidence"] = class_confidence
            result["low_confidence"] = low_confidence
            
            await report("classification", 70, f"Diagram type: {diagram_type} (conf: {class_confidence:.2f}, low_conf: {low_confidence})")
            latencies["classification"] = time.time() - t_classification

            # ─── Stage 6: Vector Similarity Search ────────────────────────────
            await report("vector_search", 73, "Searching for similar diagrams in vector database...")
            
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
            await report("attention", 78, "Generating attention heatmap...")
            
            try:
                attn_map = dinov2_service.generate_attention_map(pil_image)
                if attn_map is not None:
                    attn_path = f"{settings.UPLOAD_DIR}/{upload_id}_attention.png"
                    dinov2_service.save_attention_visualization(pil_image, attn_map, attn_path)
                    result["attention_map_url"] = f"/uploads/{upload_id}_attention.png"
            except Exception as e:
                log.warning(f"Attention map generation failed: {e}")

            # ─── Stage 9: LLM Reasoning ───────────────────────────────────────
            t_llm = time.time()
            await report("llm_analysis", 82, "Analyzing with AI (LLM reasoning)...")
            
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
                    timeout=60.0
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
                "confidence": llm_result.get("confidence", class_confidence),
                "algorithm_pattern": llm_result.get("algorithm_or_pattern"),
                "complexity": llm_result.get("complexity", {}),
            })
            
            # Update vector database metadata with enriched results
            vector_service.store_embedding(
                upload_id=upload_id,
                embedding=embedding,
                metadata={
                    "diagram_type": llm_result.get("diagram_type_confirmed", diagram_type),
                    "ocr_text": ocr_text,
                    "explanation": result["explanation"][:500],
                    "session_id": session_id,
                    "file_path": f"{settings.UPLOAD_DIR}/{upload_id}.png",
                }
            )
            
            latencies["llm"] = time.time() - t_llm
            
            # Calculate cost (GPT-4o standard pricing: $5.00/M input, $15.00/M output tokens)
            prompt_est = len(str(elements) + ocr_text + str(similar_diagrams)) // 4
            completion_est = len(str(llm_result)) // 4
            estimated_cost = (prompt_est * 0.000005) + (completion_est * 0.000015)
            
            result["latencies"] = latencies
            result["estimated_cost"] = estimated_cost
            
            await report("complete", 100, "Analysis complete! ✅")
            
        except Exception as e:
            log.error(f"Pipeline error: {e}", exc_info=True)
            result["error"] = str(e)
            await report("error", -1, f"Pipeline error: {str(e)[:100]}")
        
        return result

    def _classify_diagram_type(
        self,
        embedding: np.ndarray,
        elements: list,
        ocr_text: str,
        arrow_count: int,
        box_count: int,
    ) -> tuple[str, float, bool]:
        """
        Classify diagram using the trained DiagramClassifierHead model on top of DINOv2 embeddings.
        Includes confidence calibration against class prototype centroids.
        """
        import os
        import torch
        
        try:
            from models.classifier_head import diagram_classifier
            
            # Predict category and softmax confidence
            category, confidence = diagram_classifier.predict(embedding)
            
            # Confidence Calibration using average centroid similarity
            low_confidence = False
            prototypes_path = "/Users/hemanthreddy/Desktop/Multimodal Whiteboard Intelligence System/backend/models/class_prototypes.pt"
            
            if os.path.exists(prototypes_path):
                class_prototypes = torch.load(prototypes_path, map_location="cpu", weights_only=False)
                if category in class_prototypes:
                    centroid = class_prototypes[category]
                    sim = float(np.dot(embedding, centroid))
                    log.info(f"Calibration sim for {category}: {sim:.3f} (confidence: {confidence:.3f})")
                    
                    # Flag low confidence if similarity to class prototype is low or prediction is weak
                    if sim < 0.70 or confidence < 0.60:
                        low_confidence = True
            else:
                log.warning("Class prototypes not found; using prediction confidence only.")
                if confidence < 0.60:
                    low_confidence = True
                    
            return category, confidence, low_confidence
            
        except Exception as e:
            log.error(f"Failed to run ML classification: {e}. Falling back to rules.")
            category = self._classify_diagram_type_rules(elements, ocr_text, arrow_count, box_count)
            return category, 0.75, False

    def _classify_diagram_type_rules(
        self,
        elements: list,
        ocr_text: str,
        arrow_count: int,
        box_count: int,
    ) -> str:
        """Rule-based diagram type classification fallback."""
        ocr_lower = ocr_text.lower()
        dsa_keywords = ["tree", "node", "left", "right", "root", "leaf", 
                        "array", "stack", "queue", "heap", "graph", "sort",
                        "search", "binary", "linked", "null", "pointer"]
        flow_keywords = ["start", "end", "begin", "stop", "yes", "no",
                         "decision", "process", "input", "output", "loop"]
        arch_keywords = ["server", "client", "database", "api", "service",
                         "microservice", "load balancer", "cache", "cdn",
                         "frontend", "backend", "gateway", "queue"]
        er_keywords = ["entity", "attribute", "relationship", "primary",
                       "foreign", "key", "table", "schema", "record"]
        uml_keywords = ["class", "method", "interface", "extends", "implements",
                        "abstract", "public", "private", "constructor"]
        
        scores = {
            "dsa": sum(1 for k in dsa_keywords if k in ocr_lower),
            "flowchart": sum(1 for k in flow_keywords if k in ocr_lower),
            "architecture": sum(1 for k in arch_keywords if k in ocr_lower),
            "er_diagram": sum(1 for k in er_keywords if k in ocr_lower),
            "class_diagram": sum(1 for k in uml_keywords if k in ocr_lower),
        }
        if arrow_count > 5 and box_count > 3:
            scores["flowchart"] += 3
        if arrow_count == 0 and box_count > 5:
            scores["er_diagram"] += 2
            
        best_type = max(scores, key=scores.get)
        if scores[best_type] >= 2:
            return best_type
            
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
