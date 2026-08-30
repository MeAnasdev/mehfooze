"""
Mehfooze — FastAPI backend entry point.

Endpoints:
  GET  /api/current              — live AQI + weather for all Lahore zones
  GET  /api/forecast/{zone}      — 24–72h AQI forecast
  GET  /api/advisory/{profile}   — role-specific plain-language advisory
  POST /api/route                — route AQI overlay + flood-risk flags (Travel Mode)
  GET  /api/exposure/{zone_id}   — 24h exposure summary for a zone
  GET  /api/rankings             — global city AQI rankings from AQICN
  GET  /api/pois                 — nearby fuel stations / parking (Overpass API)

Data sources:
  Primary:  Open-Meteo Air Quality API (CAMS global) — free, no key
  Secondary: AQICN live station (optional — set AQICN_TOKEN in .env)
  Weather:  Open-Meteo Forecast + Archive APIs — free, no key
  POIs:     OpenStreetMap Overpass API — free, no key
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import current, forecast, advisory, route as route_router, priority as priority_router, exposure as exposure_router, ranking as ranking_router, pois as pois_router, notifications as notifications_router, tips as tips_router, admin as admin_router
from app.config import settings
from app.database import engine
from app.models import zone as zone_model
from app.models import reading as reading_model
from app.models import notification as notification_model
from app.models import hazard as hazard_model

logging.basicConfig(level=settings.log_level.upper())
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create DB tables on startup (idempotent — safe to run multiple times)."""
    from app.database import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified / created.")

    # Seed zones into the DB
    from app.database import SessionLocal
    from app.services.ingest import ensure_zones_seeded
    db = SessionLocal()
    try:
        ensure_zones_seeded(db)
        logger.info("Zone seed complete.")
    finally:
        db.close()

    yield  # app runs here

    logger.info("Mehfooze API shutting down.")


app = FastAPI(
    title="Mehfooze API",
    description=(
        "AI-powered city safety & advisory backend for Lahore. "
        "Real-time AQI from Open-Meteo CAMS. No API key required for core functionality."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ───────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────
app.include_router(current.router,          prefix="/api")
app.include_router(forecast.router,        prefix="/api")
app.include_router(advisory.router,        prefix="/api")
app.include_router(route_router.router,    prefix="/api")
app.include_router(priority_router.router, prefix="/api")
app.include_router(exposure_router.router, prefix="/api")
app.include_router(ranking_router.router, prefix="/api")
app.include_router(pois_router.router,    prefix="/api")
app.include_router(notifications_router.router, prefix="/api")
app.include_router(tips_router.router,         prefix="/api")
app.include_router(admin_router.router,       prefix="/api")


@app.get("/health", tags=["ops"])
def health_check():
    """Liveness probe used by Render / Docker health checks."""
    return {"status": "ok", "version": "0.1.0"}
