"""
Celery Background Worker Setup

Celery is a distributed task queue that handles heavy AI processing
in the background, freeing up the FastAPI server to accept new requests.

WHY CELERY?
FastAPI's BackgroundTasks work for small tasks, but for:
- Model inference (10-30 seconds)
- Large image processing
- Multiple concurrent users
...you need Celery with dedicated worker processes.

CELERY ARCHITECTURE:
1. Producer (FastAPI): pushes task to Redis queue
2. Broker (Redis): stores task queue
3. Worker (Celery): picks up tasks, runs AI pipeline
4. Result Backend (Redis): stores task results
5. Flower: web UI to monitor tasks

SCALING:
- Run more workers: celery -A workers.celery_app worker --concurrency=4
- GPU workers: one worker per GPU
- Priority queues: fast_queue (small tasks) vs gpu_queue (heavy inference)
"""
from celery import Celery
from core.config import settings

# Create Celery app
celery_app = Celery(
    "whiteboard_ai",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["workers.tasks"],
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,           # Ack AFTER task completes (safer)
    worker_prefetch_multiplier=1,  # One task per worker at a time (for heavy ML)
    task_routes={
        "workers.tasks.analyze_diagram": {"queue": "gpu_queue"},
        "workers.tasks.quick_ocr": {"queue": "fast_queue"},
    },
    task_time_limit=300,     # Kill tasks after 5 minutes
    task_soft_time_limit=240,  # Warn at 4 minutes
)
