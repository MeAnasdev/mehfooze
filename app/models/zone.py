"""
ORM model for AQI monitoring zones / stations.
"""

from sqlalchemy import Column, String, Float, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class Zone(Base):
    __tablename__ = "zones"

    id = Column(String, primary_key=True)          # e.g. "gulberg", "shahdara"
    name = Column(String, nullable=False)           # display name
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    station_source = Column(String, default="aqicn")  # "aqicn" | "openaq"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
