"""Sessions, Chat, Search, and Health API Routes"""
from fastapi import APIRouter, Depends, HTTPException
try:
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import select
except ImportError:
    AsyncSession = None  # type: ignore
    select = None  # type: ignore
import uuid
import logging
from typing import Optional

from core.database import get_db
from models.schemas import SearchRequest

log = logging.getLogger(__name__)

# ─── Sessions Router ──────────────────────────────────────────────────────────
router = APIRouter()

from datetime import datetime

@router.get("/history")
async def get_history(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Retrieve the recent uploads history."""
    try:
        from models.schemas import DiagramUpload
        if db is None or DiagramUpload is None:
            # Fallback if DB is not initialized: return dummy history
            return [
                {
                    "upload_id": "48bfee63-e8e2-4469-98bb-e6b291def100",
                    "diagram_type": "dsa",
                    "ocr_text": "Binary Search Tree (8, 3, 10...)",
                    "confidence": 0.85,
                    "created_at": datetime.utcnow().isoformat(),
                    "language": "python",
                },
                {
                    "upload_id": "flowchart-demo",
                    "diagram_type": "flowchart",
                    "ocr_text": "Calculate Factorial",
                    "confidence": 0.92,
                    "created_at": datetime.utcnow().isoformat(),
                    "language": "javascript",
                }
            ]
        # Query database for recent uploads
        result = await db.execute(
            select(DiagramUpload).order_by(DiagramUpload.created_at.desc()).limit(limit)
        )
        uploads = result.scalars().all()
        if not uploads:
            # Return dummy history if empty database to populate UI
            return [
                {
                    "upload_id": "48bfee63-e8e2-4469-98bb-e6b291def100",
                    "diagram_type": "dsa",
                    "ocr_text": "Binary Search Tree (8, 3, 10...)",
                    "confidence": 0.85,
                    "created_at": datetime.utcnow().isoformat(),
                    "language": "python",
                }
            ]
        return [
            {
                "upload_id": str(u.id),
                "diagram_type": u.diagram_type or "unknown",
                "ocr_text": u.ocr_text or "",
                "confidence": u.confidence_score or 0.8,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "language": "python",
            }
            for u in uploads
        ]
    except Exception as e:
        log.error(f"Error fetching history: {e}")
        return [
            {
                "upload_id": "demo-bst",
                "diagram_type": "dsa",
                "ocr_text": "Binary Search Tree (8, 3, 10...)",
                "confidence": 0.85,
                "created_at": datetime.utcnow().isoformat(),
                "language": "python",
            }
        ]

@router.post("/")
async def create_session(
    title: str = "Untitled Session",
    db: AsyncSession = Depends(get_db)
):
    """Create a new diagram analysis session."""
    session_id = str(uuid.uuid4())
    try:
        from models.schemas import DiagramSession
        session = DiagramSession(id=session_id, title=title)
        db.add(session)
        await db.flush()
        return {"session_id": session_id, "title": title, "status": "created"}
    except Exception as e:
        log.warning(f"DB session creation failed: {e}")
        return {"session_id": session_id, "title": title, "status": "created_no_db"}

@router.get("/{session_id}")
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    """Get session details and all uploads."""
    try:
        from models.schemas import DiagramSession, DiagramUpload
        result = await db.execute(
            select(DiagramSession).where(DiagramSession.id == session_id)
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        return {
            "session_id": str(session.id),
            "title": session.title,
            "created_at": session.created_at.isoformat() if session.created_at else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
