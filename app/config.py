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

    app_env:   str = "development"
    log_level: str = "info"

    @property
    def allowed_origins(self) -> List[str]:
        if self.app_env == "production":
            # Replace with your actual Vercel deployment URL
            return ["https://mehfooze.vercel.app", "https://mehfooze.app"]
        return [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
        ]


settings = Settings()
