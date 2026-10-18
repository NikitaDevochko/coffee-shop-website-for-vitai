"""Конфигурация бота (этап B0)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BOT_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    api_base_url: str = "http://127.0.0.1:8000"
    admin_api_token: str = "change-me"

    poll_interval_seconds: float = 5.0
    page_size: int = 50

    state_db_url: str = "sqlite+aiosqlite:///./data/bot_state.db"

    max_send_attempts: int = 5
    retry_backoff_seconds: float = 10.0

    lead_card_image: str = "app/static/lead-card.jpg"

    @property
    def api_leads_url(self) -> str:
        return self.api_base_url.rstrip("/") + "/api/leads"

    @property
    def chat_ids(self) -> list[str]:
        return [part.strip() for part in self.telegram_chat_id.split(",") if part.strip()]

    @property
    def missing_required(self) -> list[str]:
        """Чего не хватает для работы.

        TELEGRAM_CHAT_ID не обязателен: подписчиков набирает сам бот —
        любой, кто напишет ему /start, начинает получать заявки.
        """
        missing: list[str] = []
        if not self.telegram_bot_token or "replace-me" in self.telegram_bot_token:
            missing.append("TELEGRAM_BOT_TOKEN")
        return missing


@lru_cache
def get_settings() -> Settings:
    return Settings()
