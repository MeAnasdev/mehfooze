"""ORM model for educational content managed by admins."""

from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.base import Base


class Content(Base):
    __tablename__ = "content"

    id         = Column(String, primary_key=True)
    title      = Column(String, nullable=False)
    category   = Column(String, nullable=False)
    body       = Column(String, nullable=False)
    active     = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
