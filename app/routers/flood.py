"""
GET /api/flood — live river-discharge flood monitoring for Punjab's rivers.

Powered by GloFAS via Open-Meteo Flood API. Official bulletins: PMD FFD.
"""

from fastapi import APIRouter
from app.services.flood import get_flood_overview

router = APIRouter(tags=["flood"])


@router.get("/flood")
def get_flood():
    """
    River discharge status for Ravi, Chenab, Sutlej, Jhelum, Indus.

    Returns current status, 24h-ahead status, 7-day peak, and a discharge
    series per river, plus attribution to the official PMD FFD authority.
    Flood status bands are model-based (labelled), not official FFD categories.
    """
    return get_flood_overview()
