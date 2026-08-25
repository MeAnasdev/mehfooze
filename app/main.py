"""
Mehfooze — FastAPI backend entry point.

Routes exposed:
  GET  /api/current              — live AQI for all monitored zones
  GET  /api/forecast/{zone}      — 24–72h forecast per zone
  GET  /api/advisory/{profile}   — plain-language advisory per user profile
  POST /api/route                — route AQI overlay + flood-risk flags
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import current, forecast, advisory, route as route_router
from app.config import settings

app = FastAPI(
    title="Mehfooze API",
    description="AI-powered city safety & advisory backend for Lahore.",
    version="0.1.0",
)

# Allow the Vite dev server (port 5173) and the production origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────
app.include_router(current.router,  prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(advisory.router, prefix="/api")
app.include_router(route_router.router, prefix="/api")


@app.get("/health", tags=["ops"])
def health_check():
    """Basic liveness probe."""
    return {"status": "ok"}
