from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Format DATABASE_URL for async drivers
db_url = settings.DATABASE_URL
if db_url:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
else:
    # Use SQLite async driver fallback
    db_url = "sqlite+aiosqlite:///./edupulse.db"

# Async engine creation
async_engine = create_async_engine(
    db_url,
    echo=settings.DEBUG,
    future=True,
    pool_pre_ping=True
)

# Async session maker
async_session_maker = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False
)

from sqlalchemy import MetaData

# Global naming conventions for constraints, indexes, keys
naming_convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

# Bind metadata to 'edupulse' schema and naming conventions
metadata_obj = MetaData(schema="edupulse", naming_convention=naming_convention)

class Base(DeclarativeBase):
    """
    SQLAlchemy Base class for all database models.
    """
    metadata = metadata_obj

async def get_db():
    """
    FastAPI dependency that yields an async database session.
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
