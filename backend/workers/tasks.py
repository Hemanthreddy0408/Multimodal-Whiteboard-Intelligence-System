"""
Celery Task Definitions

Each function decorated with @celery_app.task becomes a Celery task
that can be run in a background worker process.

Tasks communicate results back to FastAPI via Redis pub/sub:
1. FastAPI creates job, saves job_id
2. Task runs in worker, publishes progress to Redis channel
3. FastAPI WebSocket manager subscribes to Redis channel
4. WebSocket pushes updates to browser

This decouples the web server from the AI computation.
"""
import asyncio
import redis
import json
from workers.celery_app import celery_app
from core.config import settings

# Redis client for pub/sub (sync version for Celery tasks)
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)


@celery_app.task(bind=True, name="workers.tasks.analyze_diagram")
def analyze_diagram_task(
    self,
    image_path: str,
    upload_id: str,
    session_id: str,
    question: str = None,
    target_language: str = "python",
):
    """
    Heavy AI analysis task — runs in Celery worker process.
    
    bind=True: gives access to `self` (the task instance)
    self.update_state(): updates Celery task state
    
    PROGRESS REPORTING:
    We publish progress to Redis channel: "progress:{upload_id}"
    The FastAPI WebSocket manager subscribes to this channel
    and forwards messages to the browser WebSocket.
    """
    
    def publish_progress(stage: str, progress: int, message: str):
        """Publish progress update to Redis pub/sub channel."""
        payload = json.dumps({
            "event": "progress",
            "job_id": upload_id,
            "stage": stage,
            "progress": progress,
            "message": message,
        })
        redis_client.publish(f"job:{upload_id}", payload)
        
        # Also update Celery task state (for Flower monitoring)
        self.update_state(
            state="PROGRESS",
            meta={"stage": stage, "progress": progress}
        )
    
    try:
        publish_progress("starting", 5, "Loading image...")
        
        # Read image from disk
        with open(image_path, "rb") as f:
            image_bytes = f.read()
        
        publish_progress("preprocessing", 10, "OpenCV preprocessing...")
        
        # Import here to avoid circular imports and load models lazily
        from services.opencv_service import preprocessor
        from services.sam_service import sam_service
        from services.trocr_service import trocr_service
        from services.dinov2_service import dinov2_service
        from services.vector_service import vector_service
        
        # Run synchronous parts of pipeline
        preprocessed = preprocessor.preprocess(image_bytes)
        publish_progress("segmentation", 30, "SAM segmentation...")
        
        segments = sam_service.segment(preprocessed["preprocessed"])
        publish_progress("ocr", 50, "TrOCR text extraction...")
        
        pil_crops = [s["pil_crop"] for s in segments if s.get("pil_crop")]
        texts = trocr_service.extract_batch(pil_crops)
        publish_progress("embedding", 70, "DINOv2 embedding...")
        
        embedding = dinov2_service.generate_embedding(preprocessed["pil_image"])
        
        # Store in Qdrant
        vector_service.store_embedding(
            upload_id=upload_id,
            embedding=embedding,
            metadata={
                "diagram_type": "unknown",
                "session_id": session_id,
                "ocr_text": " ".join(t for t in texts if t),
            }
        )
        
        publish_progress("complete", 100, "Analysis complete!")
        
        # Publish final result
        result_payload = json.dumps({
            "event": "result",
            "job_id": upload_id,
            "data": {
                "upload_id": upload_id,
                "session_id": session_id,
                "ocr_text": " ".join(t for t in texts if t),
                "diagram_type": "unknown",
                "elements": [],
                "explanation": "Analysis complete via Celery worker.",
                "summary": "",
                "relationships": [],
                "similar_diagrams": [],
                "generated_code": None,
                "confidence": 0.8,
                "model_used": "celery-pipeline",
            }
        })
        redis_client.publish(f"job:{upload_id}", result_payload)
        
        return {"status": "complete", "upload_id": upload_id}
        
    except Exception as e:
        error_payload = json.dumps({
            "event": "error",
            "job_id": upload_id,
            "message": str(e),
        })
        redis_client.publish(f"job:{upload_id}", error_payload)
        raise


@celery_app.task(name="workers.tasks.quick_ocr")
def quick_ocr_task(image_path: str) -> str:
    """Simple OCR task — runs on fast queue."""
    from services.trocr_service import trocr_service
    from PIL import Image
    return trocr_service.extract_full_image_text(Image.open(image_path))
