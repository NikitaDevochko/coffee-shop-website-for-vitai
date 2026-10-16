"""Бизнес-логика приёма заявок (этапы 3.2–3.4).

Здесь собраны три требования брифа:
* принимаем только белорусские номера и объясняем причину отказа;
* повторная отправка того же номера в течение 10 минут (в т.ч. двойной клик)
  не создаёт вторую заявку;
* сохраняем источник заявки: страницу, объявление, форму.
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.lead import Lead
from app.repositories.lead_repository import LeadRepository
from app.schemas.common import ApiError
from app.schemas.lead import LeadCreate
from app.utils.phone import format_phone, parse_phone

DUPLICATE_MESSAGE = "Заявка уже принята — мы вам перезвоним."
CREATED_MESSAGE = "Заявка принята. Перезвоним в рабочее время."


@dataclass(frozen=True)
class LeadResult:
    lead: Lead
    duplicate: bool
    message_ru: str


def hash_ip(ip: str | None) -> str | None:
    if not ip:
        return None
    return hashlib.sha256(ip.encode("utf-8")).hexdigest()[:32]


class LeadService:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = LeadRepository(session)
        self.settings = get_settings()

    async def submit(
        self,
        payload: LeadCreate,
        *,
        ip: str | None = None,
        user_agent: str | None = None,
    ) -> LeadResult:
        # 1. Телефон: только Беларусь, с понятной подсказкой (этап 3.2).
        parsed = parse_phone(payload.phone)
        if parsed.normalized is None:
            raise ApiError(
                status_code=422,
                code=parsed.error_code or "invalid_phone",
                message_ru=parsed.message_ru or "Проверьте номер телефона.",
                fields={"phone": parsed.error_code or "invalid"},
            )
        phone = parsed.normalized

        # 2. Идемпотентность по client_request_id: двойной клик и повтор после сетевой ошибки.
        if payload.client_request_id:
            existing = await self.repo.find_by_client_request_id(payload.client_request_id)
            if existing is not None:
                return LeadResult(existing, True, DUPLICATE_MESSAGE)

        # 3. Окно дедупликации: тот же номер в течение N минут (этап 3.3).
        recent = await self.repo.find_recent_by_phone(
            phone, self.settings.lead_dedup_window_minutes
        )
        if recent is not None:
            return LeadResult(recent, True, DUPLICATE_MESSAGE)

        source = payload.source
        lead = await self.repo.create(
            name=payload.name.strip(),
            phone=format_phone(phone),
            phone_normalized=phone,
            intent=payload.intent,
            comment=(payload.comment or "").strip() or None,
            position=payload.position,
            page_url=source.page_url,
            referrer=source.referrer,
            utm_json=source.utm_dict() or None,
            form_id=source.form_id,
            cta_variant=source.cta_variant,
            client_request_id=payload.client_request_id,
            ip_hash=hash_ip(ip),
            user_agent=user_agent,
        )
        return LeadResult(lead, False, CREATED_MESSAGE)
