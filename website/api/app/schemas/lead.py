"""Pydantic-схемы заявки (этап 3.1)."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

Intent = Literal["subscription", "one_time", "question"]


class LeadSource(BaseModel):
    """Откуда пришла заявка. Бриф: менеджеру важно знать источник."""

    model_config = ConfigDict(extra="ignore")

    page_url: str | None = Field(default=None, max_length=2000)
    referrer: str | None = Field(default=None, max_length=2000)
    utm_source: str | None = Field(default=None, max_length=120)
    utm_medium: str | None = Field(default=None, max_length=120)
    utm_campaign: str | None = Field(default=None, max_length=120)
    utm_content: str | None = Field(default=None, max_length=120)
    utm_term: str | None = Field(default=None, max_length=120)
    form_id: str | None = Field(default=None, max_length=60)
    cta_variant: str | None = Field(default=None, max_length=60)

    def utm_dict(self) -> dict[str, str]:
        data = self.model_dump()
        return {k: v for k, v in data.items() if k.startswith("utm_") and v}


class LeadCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=1, max_length=40)
    intent: Intent
    comment: str | None = Field(default=None, max_length=2000)
    position: str | None = Field(default=None, max_length=60)
    client_request_id: str | None = Field(default=None, max_length=64)
    source: LeadSource = Field(default_factory=LeadSource)


class LeadCreated(BaseModel):
    id: int
    duplicate: bool = False
    message_ru: str


class LeadOut(BaseModel):
    """Заявка в том виде, в котором её забирает телеграм-бот."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    name: str
    phone: str
    intent: Intent
    comment: str | None = None
    position: str | None = None
    source: dict[str, Any] = Field(default_factory=dict)


class LeadPage(BaseModel):
    items: list[LeadOut]
    next_after_id: int
    has_more: bool
