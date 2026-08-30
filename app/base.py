"""
Single source of truth for SQLAlchemy's DeclarativeBase.
All models must import Base from here to avoid duplicate table registration.
"""
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass
