"""Health Check Route"""
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
    """Detailed health with all service statuses."""
    from services.vector_service import vector_service
    
    qdrant_stats = vector_service.get_collection_stats()
    
    return {
        "status": "healthy",
        "services": {
            "api": "up",
            "qdrant": "up" if qdrant_stats.get("available") else "down",
            "qdrant_vectors": qdrant_stats.get("total_vectors", 0),
        }
    }
