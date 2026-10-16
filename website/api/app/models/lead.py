"""Модель заявки (этап 3.1)."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    phone_normalized: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    intent: Mapped[str] = mapped_column(String(20), nullable=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[str | None] = mapped_column(String(60), nullable=True)

    # Источник заявки (этап 3.4): страница, объявление, форма.
    page_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    referrer: Mapped[str | None] = mapped_column(Text, nullable=True)
    utm_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    form_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    cta_variant: Mapped[str | None] = mapped_column(String(60), nullable=True)

    # Защита от двойного клика/повтора сабмита.
    client_request_id: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)

    ip_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="new", nullable=False)
    notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        # Под дедупликацию: «тот же номер за последние N минут».
        Index("ix_leads_phone_created", "phone_normalized", "created_at"),
        Index("ix_leads_status_id", "status", "id"),
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Lead id={self.id} intent={self.intent} intent_phone={self.phone_normalized[-4:]}>"
