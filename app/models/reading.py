"""ORM model for historical + live AQI readings. One row = one hourly snapshot per zone."""

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from app.base import Base


class AqiReading(Base):
    __tablename__ = "aqi_readings"

    id          = Column(Integer,  primary_key=True, autoincrement=True)
    zone_id     = Column(String,   ForeignKey("zones.id"), nullable=False, index=True)
    aqi         = Column(Float,    nullable=False)
    pm25        = Column(Float,    nullable=True)
    pm10        = Column(Float,    nullable=True)
    o3          = Column(Float,    nullable=True)   # Ozone µg/m³
    no2         = Column(Float,    nullable=True)   # Nitrogen dioxide µg/m³
    co          = Column(Float,    nullable=True)   # Carbon monoxide mg/m³
    so2         = Column(Float,    nullable=True)   # Sulfur dioxide µg/m³
    temperature = Column(Float,    nullable=True)   # °C
    humidity    = Column(Float,    nullable=True)   # %
    wind_speed  = Column(Float,    nullable=True)   # km/h
    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        default=func.now(),
    )
