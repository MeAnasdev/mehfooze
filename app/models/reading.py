"""
ORM model for historical + live AQI readings.
One row = one hourly snapshot per zone.
"""

from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from app.database import Base


class AqiReading(Base):
    __tablename__ = "aqi_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_id = Column(String, ForeignKey("zones.id"), nullable=False, index=True)
    aqi = Column(Float, nullable=False)
    pm25 = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)    # °C
    humidity = Column(Float, nullable=True)       # %
    wind_speed = Column(Float, nullable=True)     # m/s
    recorded_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        default=func.now(),
    )
