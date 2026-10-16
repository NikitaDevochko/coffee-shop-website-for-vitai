"""Рендер карточки заявки (этап B3).

Бриф: «Красивые ссылки в сообщениях: картинка, заголовок и описание».
"""

from __future__ import annotations

from dataclasses import dataclass

from app.utils.formatting import (
    describe_source,
    escape_html,
    format_created_at,
    intent_label,
    phone_for_display,
    position_label,
    truncate,
)


@dataclass(frozen=True)
class LeadCard:
    title: str
    caption: str


def render_lead_card(lead: dict, position: int | None = None) -> LeadCard:
    """Собрать заголовок и описание карточки заявки (HTML-разметка Telegram)."""
    intent = lead.get("intent", "")
    number = f"#{lead.get('id')}" if lead.get("id") is not None else ""
    prefix = f" · заявка {position}" if position else ""

    title = f"Новая заявка · {intent_label(intent)}"

    lines: list[str] = []
    lines.append(f"<b>{escape_html(title)}</b> {escape_html(number)}{escape_html(prefix)}")
    lines.append("")
    lines.append(f"<b>Имя:</b> {escape_html(truncate(lead.get('name', ''), 120))}")

    phone_raw = lead.get("phone", "")
    phone_text = escape_html(phone_for_display(phone_raw))
    lines.append(f'<b>Телефон:</b> <a href="tel:{escape_html(phone_raw)}">{phone_text}</a>')

    position_text = position_label(lead.get("position"))
    if position_text:
        lines.append(f"<b>Позиция:</b> {escape_html(position_text)}")

    comment = truncate(lead.get("comment") or "", 400)
    if comment:
        lines.append(f"<b>Комментарий:</b> {escape_html(comment)}")

    source_text = describe_source(lead.get("source"))
    if source_text:
        lines.append(f"<b>Источник:</b> {escape_html(truncate(source_text, 300))}")

    if lead.get("created_at"):
        lines.append(f"<i>{escape_html(format_created_at(lead['created_at']))}</i>")

    return LeadCard(title=title, caption="\n".join(lines))
