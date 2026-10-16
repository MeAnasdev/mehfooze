"""
Application configuration loaded from environment variables / .env file.

Quickstart (no Docker needed):
  1. Copy .env.example to .env
  2. Leave DATABASE_URL as sqlite:///./mehfooze_dev.db for local dev
  3. uvicorn main:app --reload --app-dir .
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # SQLite by default so the app runs locally with zero external dependencies
    database_url: str = "sqlite:///./mehfooze_dev.db"

    # AQICN token — get free at https://aqicn.org/data-platform/token/
    # Leave blank to use Open-Meteo as the sole AQI source (still 100% real data)
    aqicn_token: str = ""

    # OpenAQ v3 key — free at https://explore.openaq.org/register
    openaq_api_key: str = ""

    # Google Maps — optional, used for Travel Mode routing
    # Leave blank to use OSRM (free, open source)
    google_maps_api_key: str = ""

    # Sentinel Hub (Copernicus) — optional, for Sentinel-5P satellite pollution
    # data (NO2, SO2, CO). Free account at https://www.sentinel-hub.com/
    # Leave blank to disable the satellite layer gracefully.
    sentinel_client_id: str = ""
    sentinel_client_secret: str = ""

    app_env:   str = "development"
    log_level: str = "info"

    # Railway auto-generates a URL like:
    # https://mehfooze-api-production.up.railway.app
    # Backed by the RAILWAY_BACKEND_URL env var (overrides this default).
    railway_backend_url: str = "https://mehfooze-api-production.up.railway.app"

    @property
    def allowed_origins(self) -> List[str]:
        origins = [
            # All known Vercel deployment URLs
            "https://mehfooze-70snxg6mn-aperion4.vercel.app",
            "https://web-brown-kappa-643kj0w95b.vercel.app",
            "https://web-95jq38tja-aperion4.vercel.app",
            "https://mehfooze.vercel.app",
            "https://web-henna-nine-64.vercel.app",
            "https://web-ten-phi-c7jw8ptxrq.vercel.app",
            "https://web-hpkxpgqgo-aperion4.vercel.app",
            "https://mehfooze.app",
        ]
        # Add Railway backend URL itself (for health checks etc.)
        if self.railway_backend_url:
            origins.append(self.railway_backend_url)
        if self.app_env != "production":
            origins += [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:3000",
                "http://localhost:8080",
            ]
        return origins


settings = Settings()
