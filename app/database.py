"""
SQLAlchemy engine and session factory.
Supports SQLite (dev) and PostgreSQL (production) via DATABASE_URL in .env.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.base import Base  # noqa: F401 — re-exported so other modules can do: from app.database import Base

# SQLite needs check_same_thread=False; PostgreSQL uses a connection pool
if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and closes it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
