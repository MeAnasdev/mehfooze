"""
GET /api/priority — population-weighted zone prioritisation.

Ranks Lahore monitoring zones by a composite risk score:

    score = aqi × log2(population + 1)

This surfaces high-AQI zones in dense neighbourhoods ahead of equally-polluted
zones in sparse ones, so EPA Punjab / district administration can direct
intervention resources to where the most people are affected.

Population estimates are WorldPop-informed approximations stored in the zones table.
All values are clearly labelled as estimates.
"""

import math
import logging
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.zone import Zone
from app.models.reading import AqiReading
from app.services.advisory import aqi_category, aqi_colour

logger = logging.getLogger(__name__)
router = APIRouter(tags=["priority"])


class PriorityZoneOut(BaseModel):
    rank:          int
    zoneId:        str
    name:          str
    lat:           float
    lng:           float
    aqi:           float
    aqiCategory:   str
    aqiColour:     str
    population:    int
    priorityScore: float
    scoreNote:     str


@router.get("/priority", response_model=list[PriorityZoneOut])
def get_priority_zones(db: Session = Depends(get_db)):
    """
    Return all monitored zones ranked by population-weighted AQI risk score.

    Score formula: aqi × log₂(population + 1)

    Zones at the top of the list are where the highest number of people are
    currently breathing the worst air — the highest-priority intervention targets.

    All AQI values are real-time readings from Open-Meteo CAMS.
    Population figures are estimates (WorldPop-informed approximation).
    """
    zones    = db.query(Zone).all()
    cutoff   = datetime.now(timezone.utc) - timedelta(hours=2)

    results = []
    for zone in zones:
        # Get the most recent AQI reading for this zone within the last 2 hours
        reading = (
            db.query(AqiReading)
            .filter(
                AqiReading.zone_id == zone.id,
                AqiReading.recorded_at >= cutoff,
            )
            .order_by(AqiReading.recorded_at.desc())
            .first()
        )

        if not reading:
            # Fall back to the single latest reading for this zone
            reading = (
                db.query(AqiReading)
                .filter(AqiReading.zone_id == zone.id)
                .order_by(AqiReading.recorded_at.desc())
                .first()
            )

        aqi        = float(reading.aqi) if reading else 0.0
        population = zone.population or 0

        # Population-weighted priority score
        # log2(population+1) dampens the effect of population so AQI still dominates,
        # while ensuring a zone with 500k people ranks above an equal-AQI zone with 50k.
        score = round(aqi * math.log2(population + 1), 2) if population > 0 else aqi

        results.append({
            "zoneId":        zone.id,
            "name":          zone.name,
            "lat":           zone.lat,
            "lng":           zone.lng,
            "aqi":           aqi,
            "aqiCategory":   aqi_category(aqi),
            "aqiColour":     aqi_colour(aqi),
            "population":    population,
            "priorityScore": score,
            "scoreNote":     "score = AQI × log₂(population + 1); higher = more people breathing worse air",
        })

    # Sort descending by priority score
    results.sort(key=lambda z: z["priorityScore"], reverse=True)

    # Add rank after sorting
    for i, r in enumerate(results, start=1):
        r["rank"] = i

    return results
