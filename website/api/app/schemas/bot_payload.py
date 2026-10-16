"""Pydantic-модель заявки для телеграм-бота (этап 4.1)."""

from __future__ import annotations

from app.schemas.lead import LeadOut, LeadPage

__all__ = ["LeadOut", "LeadPage", "to_lead_out"]


def to_lead_out(lead) -> LeadOut:
    """Собрать тело ответа для бота из ORM-объекта."""
    source: dict[str, object] = {}
    for key, value in {
        "page_url": lead.page_url,
        "referrer": lead.referrer,
        "form_id": lead.form_id,
        "cta_variant": lead.cta_variant,
        **(lead.utm_json or {}),
    }.items():
        if value:
            source[key] = value

    return LeadOut(
        id=lead.id,
        created_at=lead.created_at,
        name=lead.name,
        phone=lead.phone,
        intent=lead.intent,
        comment=lead.comment,
        position=lead.position,
        source=source,
    )
