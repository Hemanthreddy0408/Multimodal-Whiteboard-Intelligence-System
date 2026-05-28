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
