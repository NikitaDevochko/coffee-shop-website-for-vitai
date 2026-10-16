"""Антиспам-лимит по IP (этап 3.5)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.schemas.common import ApiError

WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 20
PROTECTED_PATH = "/api/lead"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Простой лимит на отправку формы: не больше N запросов в минуту с одного IP."""

    def __init__(self, app) -> None:
        super().__init__(app)
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        if request.method == "POST" and request.url.path == PROTECTED_PATH:
            ip = self._client_ip(request)
            now = time.monotonic()
            hits = self._hits[ip]
            while hits and now - hits[0] > WINDOW_SECONDS:
                hits.popleft()
            if len(hits) >= MAX_REQUESTS_PER_WINDOW:
                error = ApiError(
                    status_code=429,
                    code="rate_limited",
                    message_ru="Слишком много отправок. Подождите минуту и попробуйте снова.",
                )
                return JSONResponse(status_code=429, content=error.to_response())
            hits.append(now)
        return await call_next(request)

    def _client_ip(self, request: Request) -> str:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"
