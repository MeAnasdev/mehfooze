"""ORM model for AQI monitoring zones / stations."""

from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
from app.base import Base


class Zone(Base):
    __tablename__ = "zones"

    id             = Column(String,  primary_key=True)   # e.g. "gulberg"
    name           = Column(String,  nullable=False)      # display name
    lat            = Column(Float,   nullable=False)
    lng            = Column(Float,   nullable=False)
    population     = Column(Integer, default=0)           # estimated residential population
    station_source = Column(String,  default="open-meteo")
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
