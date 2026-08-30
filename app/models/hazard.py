"""ORM model for hazard alerts triggered by high AQI readings."""

from sqlalchemy import Column, String, Float, DateTime, Boolean
from sqlalchemy.sql import func
from app.base import Base


class HazardAlert(Base):
    __tablename__ = "hazard_alerts"

    id         = Column(String, primary_key=True)
    zone_id    = Column(String, nullable=False, index=True)
    severity   = Column(String, nullable=False)   # warning, danger, emergency
    aqi        = Column(Float, nullable=False)
    message    = Column(String, nullable=False)
    sent       = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=func.now())
