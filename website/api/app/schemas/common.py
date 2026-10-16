"""Единый формат ошибок API (этап 3.5)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorBody(BaseModel):
    code: str
    message_ru: str
    fields: dict[str, Any] = Field(default_factory=dict)


class ErrorResponse(BaseModel):
    """``{"error": {"code": ..., "message_ru": ..., "fields": {...}}}``."""

    error: ErrorBody


class ApiError(Exception):
    """Ошибка с человекочитаемым сообщением для формы на сайте."""

    def __init__(
        self,
        status_code: int,
        code: str,
        message_ru: str,
        fields: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message_ru)
        self.status_code = status_code
        self.code = code
        self.message_ru = message_ru
        self.fields = fields or {}

    def to_response(self) -> dict[str, Any]:
        return ErrorResponse(
            error=ErrorBody(code=self.code, message_ru=self.message_ru, fields=self.fields)
        ).model_dump()
