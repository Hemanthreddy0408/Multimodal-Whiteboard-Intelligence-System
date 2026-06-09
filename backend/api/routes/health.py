"""Health Check Route"""
import os
import time
from fastapi import APIRouter
from core.config import settings

router = APIRouter()


@router.get("/health")
async def health_check():
    """System health check for load balancers and monitoring."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "services": {
            "api": "up",
        }
    }


@router.get("/health/detailed")
async def detailed_health():
    """
    Detailed health check — reports actual model / DB / service availability.
    Used by the frontend status dashboard.
    """
    from services.vector_service import vector_service

    checks = {}

    # ── Qdrant ────────────────────────────────────────────────────────────────
    try:
        stats = vector_service.get_collection_stats()
        checks["qdrant"] = {
            "status": "up" if stats.get("available") else "degraded",
            "vectors": stats.get("total_vectors", 0),
            "note": stats.get("error", "OK"),
        }
    except Exception as e:
        checks["qdrant"] = {"status": "down", "note": str(e)}

    # ── PostgreSQL ────────────────────────────────────────────────────────────
    try:
        from sqlalchemy import create_engine, text
        sync_url = settings.DATABASE_URL.replace("postgresql+asyncpg://", "postgresql://")
        engine = create_engine(sync_url, connect_args={"connect_timeout": 3})
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        checks["postgresql"] = {"status": "up", "note": "OK"}
    except Exception as e:
        checks["postgresql"] = {"status": "down", "note": str(e)[:120]}

    # ── TrOCR ────────────────────────────────────────────────────────────────
    try:
        import importlib
        transformers_spec = importlib.util.find_spec("transformers")
        if transformers_spec:
            hf_cache = os.path.expanduser("~/.cache/huggingface/hub")
            trocr_cached = os.path.isdir(os.path.join(hf_cache, "models--microsoft--trocr-base-handwritten"))
            checks["trocr"] = {
                "status": "available" if trocr_cached else "not_cached",
                "model": settings.TROCR_MODEL,
                "cached": trocr_cached,
            }
        else:
            checks["trocr"] = {"status": "down", "note": "transformers not installed"}
    except Exception as e:
        checks["trocr"] = {"status": "error", "note": str(e)[:80]}

    # ── DINOv2 ───────────────────────────────────────────────────────────────
    try:
        import importlib
        transformers_spec = importlib.util.find_spec("transformers")
        if transformers_spec:
            hf_cache = os.path.expanduser("~/.cache/huggingface/hub")
            model_dir = "models--facebook--" + settings.DINOV2_MODEL.replace("facebook/", "").replace("-", "--")
            dino_cached = os.path.isdir(os.path.join(hf_cache, model_dir.replace("--", "-").replace("facebook-", "models--facebook--")))
            # Simpler check
            dino_any = any(
                "dinov2" in d for d in os.listdir(hf_cache) if os.path.isdir(os.path.join(hf_cache, d))
            )
            checks["dinov2"] = {
                "status": "available" if dino_any else "not_cached",
                "model": settings.DINOV2_MODEL,
            }
        else:
            checks["dinov2"] = {"status": "down", "note": "transformers not installed"}
    except Exception as e:
        checks["dinov2"] = {"status": "error", "note": str(e)[:80]}

    # ── SAM ───────────────────────────────────────────────────────────────────
    sam_path = settings.SAM_CHECKPOINT_PATH
    checks["sam"] = {
        "status": "available" if os.path.exists(sam_path) else "not_downloaded",
        "checkpoint": sam_path,
        "note": "OK" if os.path.exists(sam_path) else "2.5GB checkpoint not downloaded (optional)",
    }

    # ── OpenAI LLM ───────────────────────────────────────────────────────────
    checks["llm_openai"] = {
        "status": "configured" if settings.OPENAI_API_KEY else "no_key",
        "note": "API key set" if settings.OPENAI_API_KEY else "Set OPENAI_API_KEY in .env",
    }

    # ── Google Gemini ─────────────────────────────────────────────────────────
    checks["llm_gemini"] = {
        "status": "configured" if settings.GOOGLE_API_KEY else "no_key",
        "note": "API key set" if settings.GOOGLE_API_KEY else "Set GOOGLE_API_KEY in .env",
    }

    # ── Ollama (local LLM) ────────────────────────────────────────────────────
    try:
        import httpx
        async with httpx.AsyncClient(timeout=2.0) as client:
            resp = await client.get(settings.OLLAMA_BASE_URL + "/api/tags")
        checks["ollama"] = {
            "status": "up" if resp.status_code == 200 else "error",
            "url": settings.OLLAMA_BASE_URL,
        }
    except Exception:
        checks["ollama"] = {"status": "down", "url": settings.OLLAMA_BASE_URL}

    # ── Overall status ────────────────────────────────────────────────────────
    # "healthy" = API up + at least one LLM + at least one CV model
    cv_ok = checks.get("trocr", {}).get("status") == "available"
    llm_ok = (
        checks.get("llm_openai", {}).get("status") == "configured" or
        checks.get("llm_gemini", {}).get("status") == "configured" or
        checks.get("ollama", {}).get("status") == "up"
    )
    overall = "healthy" if (cv_ok and llm_ok) else "degraded"

    return {
        "status": overall,
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "environment": settings.APP_ENV,
        "timestamp": time.time(),
        "services": checks,
    }
