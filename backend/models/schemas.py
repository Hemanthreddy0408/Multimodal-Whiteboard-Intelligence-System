"""
SQLAlchemy ORM models + Pydantic schemas.

SQLAlchemy models are only defined if SQLAlchemy is installed.
Pydantic schemas (API validation) always work — they have no heavy deps.
"""
import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

# ─── SQLAlchemy ORM Models (optional — need PostgreSQL + sqlalchemy) ───────────
try:
    from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, JSON
    from sqlalchemy.dialects.postgresql import UUID as PG_UUID
    from sqlalchemy.orm import relationship
    from core.database import Base

    if Base is not None:
        class User(Base):
            __tablename__ = "users"
            id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            email = Column(String, unique=True, nullable=False)
            hashed_password = Column(String, nullable=False)
            created_at = Column(DateTime, default=datetime.utcnow)
            sessions = relationship("DiagramSession", back_populates="user")

        class DiagramSession(Base):
            __tablename__ = "diagram_sessions"
            id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
            title = Column(String, default="Untitled Session")
            created_at = Column(DateTime, default=datetime.utcnow)
            user = relationship("User", back_populates="sessions")
            uploads = relationship("DiagramUpload", back_populates="session")
            chats = relationship("ChatMessage", back_populates="session")

        class DiagramUpload(Base):
            __tablename__ = "diagram_uploads"
            id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            session_id = Column(PG_UUID(as_uuid=True), ForeignKey("diagram_sessions.id"), nullable=True)
            file_path = Column(String, nullable=False)
            file_type = Column(String)
            ocr_text = Column(Text)
            diagram_type = Column(String)
            elements_json = Column(JSON)
            embedding_id = Column(String)
            confidence_score = Column(Float)
            created_at = Column(DateTime, default=datetime.utcnow)
            session = relationship("DiagramSession", back_populates="uploads")
            generated_codes = relationship("GeneratedCode", back_populates="upload")

        class GeneratedCode(Base):
            __tablename__ = "generated_codes"
            id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            upload_id = Column(PG_UUID(as_uuid=True), ForeignKey("diagram_uploads.id"))
            language = Column(String)
            code_content = Column(Text)
            explanation = Column(Text)
            llm_model_used = Column(String)
            created_at = Column(DateTime, default=datetime.utcnow)
            upload = relationship("DiagramUpload", back_populates="generated_codes")

        class ChatMessage(Base):
            __tablename__ = "chat_messages"
            id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            session_id = Column(PG_UUID(as_uuid=True), ForeignKey("diagram_sessions.id"))
            role = Column(String)
            content = Column(Text)
            upload_id = Column(PG_UUID(as_uuid=True), nullable=True)
            created_at = Column(DateTime, default=datetime.utcnow)
            session = relationship("DiagramSession", back_populates="chats")
    else:
        # Stub classes when DB unavailable
        User = None  # type: ignore
        DiagramSession = None  # type: ignore
        DiagramUpload = None  # type: ignore
        GeneratedCode = None  # type: ignore
        ChatMessage = None  # type: ignore

except (ImportError, Exception):
    User = None  # type: ignore
    DiagramSession = None  # type: ignore
    DiagramUpload = None  # type: ignore
    GeneratedCode = None  # type: ignore
    ChatMessage = None  # type: ignore


# ─── Pydantic Schemas (always available) ──────────────────────────────────────

class AnalyzeRequest(BaseModel):
    session_id: str
    question: Optional[str] = None
    target_language: str = "python"

class AnalyzeResponse(BaseModel):
    job_id: str
    status: str = "queued"
    message: str = "Analysis started. Connect to WebSocket for live updates."

class DiagramElement(BaseModel):
    id: int = 0
    type: str = "unknown"
    text: str = ""
    bbox: List[int] = [0, 0, 0, 0]
    confidence: float = 0.0

class AnalysisResult(BaseModel):
    upload_id: str
    session_id: str = ""
    diagram_type: str = "unknown"
    elements: List[DiagramElement] = []
    ocr_text: str = ""
    explanation: str = ""
    summary: str = ""
    generated_code: Optional[str] = None
    code_explanation: str = ""
    language: Optional[str] = None
    similar_diagrams: List[dict] = []
    relationships: List[dict] = []
    attention_map_url: Optional[str] = None
    confidence: float = 0.8
    model_used: str = "unknown"
    embedding_id: Optional[str] = None
    algorithm_pattern: Optional[str] = None
    complexity: Optional[dict] = None
    error: Optional[str] = None

class SearchRequest(BaseModel):
    query: str
    limit: int = 5

class WebSocketMessage(BaseModel):
    event: str
    job_id: str
    data: dict
    progress: Optional[int] = None
