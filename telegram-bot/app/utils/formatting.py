"""Форматирование текста карточки (этап B3)."""

from __future__ import annotations

from datetime import datetime

from app.utils.phone import format_phone

INTENT_LABELS: dict[str, str] = {
    "subscription": "подписка",
    "one_time": "разовый заказ",
    "question": "вопрос",
}

POSITION_LABELS: dict[str, str] = {
    "ethiopia-yirgacheffe": "Эфиопия Иргачеффе",
    "colombia-huila": "Колумбия Уила",
    "brazil-cerrado": "Бразилия Серрадо",
    "drip-pack": "Дрип-пакеты, ассорти",
    "subscription": "Подписка",
}

UTM_LABELS: dict[str, str] = {
    "instagram": "Instagram",
    "yandex": "Яндекс",
    "direct": "прямой заход",
    "telegram": "Telegram",
}


def escape_html(value: str | None) -> str:
    if not value:
        return ""
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def truncate(value: str, limit: int = 400) -> str:
    value = value.strip()
    return value if len(value) <= limit else value[: limit - 1].rstrip() + "…"


def intent_label(intent: str) -> str:
    return INTENT_LABELS.get(intent, intent)


def position_label(position: str | None) -> str | None:
    if not position:
        return None
    return POSITION_LABELS.get(position, position)


def format_created_at(value: datetime | str) -> str:
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value)
        except ValueError:
            return value
    return value.astimezone().strftime("%d.%m.%Y %H:%M")


def describe_source(source: dict | None) -> str | None:
    """Человекочитаемый источник заявки (требование брифа)."""
    if not source:
        return None

    parts: list[str] = []
    utm_source = source.get("utm_source")
    if utm_source:
        parts.append(UTM_LABELS.get(utm_source, str(utm_source)))
    if source.get("utm_campaign"):
        parts.append(f"кампания «{source['utm_campaign']}»")
    if source.get("form_id"):
        parts.append(f"форма {source['form_id']}")
    if source.get("cta_variant"):
        parts.append(f"CTA {source['cta_variant']}")
    if not parts and source.get("referrer"):
        parts.append(str(source["referrer"]))
    if source.get("page_url"):
        parts.append(str(source["page_url"]))
    return " · ".join(parts) if parts else None


def phone_for_display(phone: str) -> str:
    return format_phone(phone)
