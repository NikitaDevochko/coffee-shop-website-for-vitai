"""Конфигурация приложения (этап 3.5)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(API_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    env: str = "local"
    debug: bool = True
    api_host: str = "127.0.0.1"
    api_port: int = 8000

    database_url: str = "sqlite+aiosqlite:///./data/leads.db"

    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])

    lead_dedup_window_minutes: int = 10
    admin_api_token: str = "change-me"
    trust_proxy_headers: bool = True

    @property
    def sqlite_path(self) -> Path | None:
        """Путь к файлу SQLite (нужен, чтобы создать папку до старта)."""
        prefix = "sqlite+aiosqlite:///"
        if not self.database_url.startswith(prefix):
            return None
        raw = self.database_url[len(prefix):]
        path = Path(raw)
        return path if path.is_absolute() else (API_DIR / path).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
