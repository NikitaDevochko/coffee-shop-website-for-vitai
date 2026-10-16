"""Клиент API сайта (этап B1)."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class ApiError(RuntimeError):
    pass


class UnauthorizedError(ApiError):
    pass


class LeadApiClient:
    """Читает заявки из API сайта. К БД сайта не подключается (см. DECISIONS.md, B-D2)."""

    def __init__(self, base_url: str | None = None, token: str | None = None) -> None:
        settings = get_settings()
        self.base_url = (base_url or settings.api_base_url).rstrip("/")
        self.token = token or settings.admin_api_token
        self._client: httpx.AsyncClient | None = None

    async def __aenter__(self) -> "LeadApiClient":
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(15.0, connect=5.0))
        return self

    async def __aexit__(self, *_exc) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def fetch_leads(self, after_id: int, limit: int = 50) -> dict[str, Any]:
        if self._client is None:
            raise ApiError("клиент не инициализирован: используйте async with LeadApiClient()")

        url = f"{self.base_url}/api/leads"
        params = {"after_id": after_id, "limit": limit}
        headers = {"X-Admin-Token": self.token}
        last_error: Exception | None = None

        for attempt in range(1, 4):
            try:
                response = await self._client.get(url, params=params, headers=headers)
            except httpx.HTTPError as exc:  # сеть, таймаут, DNS
                last_error = exc
                logger.warning("Не удалось обратиться к API (попытка %s/3): %s", attempt, exc)
                await asyncio.sleep(min(2 ** attempt, 8))
                continue

            if response.status_code == 401:
                raise UnauthorizedError(
                    "API отклонил X-Admin-Token. Проверьте ADMIN_API_TOKEN в .env бота и API."
                )
            if response.status_code >= 500:
                last_error = ApiError(f"API вернул {response.status_code}")
                logger.warning("API ответил %s (попытка %s/3)", response.status_code, attempt)
                await asyncio.sleep(min(2 ** attempt, 8))
                continue
            if response.status_code >= 400:
                raise ApiError(f"API вернул {response.status_code}: {response.text[:200]}")

            return response.json()

        raise ApiError(f"API недоступен после 3 попыток: {last_error}")
