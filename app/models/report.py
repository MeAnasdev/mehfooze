"""ORM model for citizen pollution source reports.

This is the core of the accountability layer:
Citizen submits geotagged photo evidence → backend corroborates against
nearby sensors + wind + documented industrial zones → routes to authority
→ tracks status through to resolution.
"""

from sqlalchemy import Column, String, Float, DateTime, Boolean, Text
from sqlalchemy.sql import func
from app.base import Base


class PollutionReport(Base):
    __tablename__ = "pollution_reports"

    id             = Column(String, primary_key=True)
    user_id        = Column(String, nullable=False, index=True)   # Firebase UID
    report_type    = Column(String, nullable=False)               # waste_burning | industrial_smoke | construction_dust | dirty_vehicle | other
    lat            = Column(Float, nullable=False)
    lng            = Column(Float, nullable=False)
    photo_url      = Column(String, nullable=True)                # Firebase Storage URL
    note           = Column(Text, nullable=True)

    # Corroboration results (computed at submission)
    nearest_zone   = Column(String, nullable=True)                # zone id of nearest sensor
    nearest_aqi    = Column(Float, nullable=True)                 # AQI at nearest sensor
    sensor_corroborated = Column(Boolean, nullable=False, default=False)  # nearby AQI elevated?
    likely_source  = Column(String, nullable=True)               # documented industrial zone upwind, if any
    corroboration_note = Column(String, nullable=True)           # human-readable summary

    # Case workflow
    status         = Column(String, nullable=False, default="submitted")  # submitted | under_review | verified | routed | resolved | dismissed
    routed_to      = Column(String, nullable=True)               # authority the case was routed to
    resolution_note = Column(String, nullable=True)

    created_at     = Column(DateTime(timezone=True), nullable=False, default=func.now())
    updated_at     = Column(DateTime(timezone=True), nullable=False, default=func.now(), onupdate=func.now())
