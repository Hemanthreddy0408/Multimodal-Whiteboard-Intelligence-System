"""
Multimodal Whiteboard Intelligence System — FastAPI Main Entry Point

This is the heart of the backend. It:
1. Creates the FastAPI app with CORS, lifespan events
2. Registers all API routers
3. Initializes DB, Qdrant, and Redis on startup
4. Mounts the WebSocket endpoint
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from core.config import settings
from core.database import init_db, init_qdrant
from api.routes import analyze, sessions, chat, search, health, websocket_router

import logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger(__name__)



# ─── Lifespan (startup / shutdown events) ─────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs before the server accepts requests (startup) and after it shuts down.
    This is the modern FastAPI way (replaces @app.on_event).
    """
    log.info("🚀 Starting Multimodal Whiteboard AI Backend...")

    # 1. Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    log.info(f"📁 Upload directory ready: {settings.UPLOAD_DIR}")

    # 2. Initialize PostgreSQL tables
    try:
        await init_db()
        log.info("✅ PostgreSQL connected and tables created")
    except Exception as e:
        log.warning(f"⚠️  PostgreSQL not available (running without DB): {e}")

    # 3. Initialize Qdrant collection
    try:
        init_qdrant()
        log.info("✅ Qdrant vector DB ready")
    except Exception as e:
        log.warning(f"⚠️  Qdrant not available (running without vector DB): {e}")

    # 4. Pre-warm AI models (optional — speeds up first request)
    # We load models lazily in services to avoid blocking startup

    log.info("🎯 Server is ready to accept requests!")
    yield  # ← Server runs here

    log.info("🛑 Shutting down gracefully...")


# ─── FastAPI App ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Multimodal Whiteboard Intelligence System",
    description="""
    ## AI-Powered Diagram Understanding API
    
    Upload diagrams, whiteboard drawings, webcam feeds, or screenshots.
    Get back:
    - 📝 OCR text extraction (TrOCR)
    - 🧩 Diagram segmentation (SAM)  
    - 🔍 Semantic embeddings (DINOv2)
    - 💻 Code generation (GPT-4o/Gemini/Llama3)
    - 💬 AI chat about your diagrams
    - 🔎 Semantic similarity search (Qdrant)
    """,
    version="1.0.0",
    lifespan=lifespan,
)


# ─── CORS Middleware ───────────────────────────────────────────────────────────
# Allows frontend (Next.js on port 3000) to call our backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Static Files (for serving attention maps / processed images) ──────────────
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")


# ─── API Routes ───────────────────────────────────────────────────────────────
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["Sessions"])
app.include_router(analyze.router, prefix="/api", tags=["Analysis"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(websocket_router.router, tags=["WebSocket"])


# ─── Root ─────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "Multimodal Whiteboard Intelligence System API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }
