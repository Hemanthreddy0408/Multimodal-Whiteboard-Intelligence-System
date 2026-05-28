"""Semantic Search API Route"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging

from services.vector_service import vector_service
from services.dinov2_service import dinov2_service

log = logging.getLogger(__name__)
router = APIRouter()


class TextSearchRequest(BaseModel):
    query: str
    limit: int = 5
    diagram_type: Optional[str] = None


@router.post("/text")
async def semantic_text_search(request: TextSearchRequest):
    """
    Search diagrams by text query (keyword-based on OCR content).
    
    Example: query="binary search tree" 
    Returns: all diagrams that contain those words in their OCR text
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    filters = {}
    if request.diagram_type:
        filters["diagram_type"] = request.diagram_type
    
    results = vector_service.search_by_text(
        text_query=request.query,
        limit=request.limit,
    )
    
    return {
        "query": request.query,
        "results": results,
        "count": len(results),
    }


@router.get("/stats")
async def get_vector_stats():
    """Get Qdrant collection statistics."""
    stats = vector_service.get_collection_stats()
    return stats
