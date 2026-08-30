"""ORM model for FCM push notification tokens."""

from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from app.base import Base


class FcmToken(Base):
    __tablename__ = "fcm_tokens"

    id         = Column(String, primary_key=True)
    user_id    = Column(String, nullable=False, index=True)
    token      = Column(String, nullable=False, unique=True)
    profile    = Column(String, nullable=False, default="citizen")
    platform   = Column(String, nullable=False, default="web")
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
