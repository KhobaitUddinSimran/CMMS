"""Database engine and session factory"""
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from ..core.config import settings

logger = logging.getLogger(__name__)

def _build_db_url(url: str) -> str:
    """Ensure the URL uses the postgresql+asyncpg:// scheme required by asyncpg."""
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

_db_url = _build_db_url(settings.DATABASE_URL or "")

if _db_url and _db_url.startswith("postgresql+asyncpg://"):
    engine = create_async_engine(
        _db_url,
        echo=False,
        future=True,
        pool_pre_ping=True,
    )
    async_session = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
else:
    logger.error(
        "DATABASE_URL is not set or has an invalid format. "
        "Expected: postgresql://user:password@host:5432/dbname"
    )
    engine = None
    async_session = None

async def get_db() -> AsyncSession:
    if async_session is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL environment variable.")
    async with async_session() as session:
        yield session
