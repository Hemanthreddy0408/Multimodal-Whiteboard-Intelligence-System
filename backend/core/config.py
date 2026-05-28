"""
Central configuration using Pydantic Settings.
All environment variables are validated at startup.
"""
from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # App
    APP_NAME: str = "Multimodal Whiteboard AI"
    APP_ENV: str = "development"
    SECRET_KEY: str = "changeme"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/whiteboard_ai"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Qdrant
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "diagrams"

    # AI APIs
    OPENAI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Models
    SAM_CHECKPOINT_PATH: str = "./models/sam_vit_h_4b8939.pth"
    SAM_MODEL_TYPE: str = "vit_h"
    TROCR_MODEL: str = "microsoft/trocr-large-handwritten"
    DINOV2_MODEL: str = "facebook/dinov2-large"

    # Storage
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
