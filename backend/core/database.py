"""
Database setup — all heavy imports are optional so the server starts
even without PostgreSQL, Qdrant, or SQLAlchemy installed.

WHY OPTIONAL IMPORTS?
During development you may want to run JUST the FastAPI server + LLM
without spinning up PostgreSQL and Qdrant. The try/except guards here
let the server boot gracefully and skip DB features if not available.
"""
import logging

log = logging.getLogger(__name__)

# ─── SQLAlchemy (PostgreSQL) — optional ────────────────────────────────────────
try:
    from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
    from sqlalchemy.orm import DeclarativeBase
    from core.config import settings

    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=10,
        max_overflow=20,
    )

    AsyncSessionLocal = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    class Base(DeclarativeBase):
        pass

    async def get_db():
        """FastAPI dependency — yields DB session per request."""
        async with AsyncSessionLocal() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def init_db():
        """Create all tables on startup."""
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

except ImportError:
    log.warning("SQLAlchemy/asyncpg not installed — running without PostgreSQL.")
    Base = None  # type: ignore
    engine = None  # type: ignore

    async def get_db():  # type: ignore
        yield None

    async def init_db():  # type: ignore
        pass


# ─── Qdrant Vector DB — optional ──────────────────────────────────────────────
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams
    from core.config import settings

    qdrant_client = QdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
    )

    def init_qdrant():
        """Create collection if it doesn't exist."""
        try:
            collections = [c.name for c in qdrant_client.get_collections().collections]
            if settings.QDRANT_COLLECTION not in collections:
                qdrant_client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION,
                    vectors_config=VectorParams(
                        size=1024,           # DINOv2-large embedding dimension
                        distance=Distance.COSINE,
                    ),
                )
                log.info(f"Created Qdrant collection: {settings.QDRANT_COLLECTION}")
        except Exception as e:
            log.warning(f"Qdrant not reachable: {e}")

except ImportError:
    log.warning("qdrant-client not installed — running without vector DB.")
    qdrant_client = None  # type: ignore

    def init_qdrant():  # type: ignore
        pass
