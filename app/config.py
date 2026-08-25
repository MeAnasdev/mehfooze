"""
Application configuration loaded from environment variables / .env file.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "postgresql://mehfooze:password@localhost:5432/mehfooze_db"
    aqicn_token: str = ""
    openaq_api_key: str = ""
    google_maps_api_key: str = ""
    app_env: str = "development"
    log_level: str = "info"

    # Origins that can call the API
    @property
    def allowed_origins(self) -> List[str]:
        if self.app_env == "production":
            return ["https://mehfooze.app"]  # replace with real production domain
        return ["http://localhost:5173", "http://127.0.0.1:5173"]


settings = Settings()
