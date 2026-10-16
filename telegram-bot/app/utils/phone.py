"""Формат белорусского номера для сообщений бота (этап B3)."""

from __future__ import annotations

import re

_NON_DIGITS = re.compile(r"\D")


def format_phone(value: str) -> str:
    digits = _NON_DIGITS.sub("", value or "")
    if not digits.startswith("375") or len(digits) != 12:
        return value
    rest = digits[3:]
    return f"+375 ({rest[:2]}) {rest[2:5]}-{rest[5:7]}-{rest[7:]}"


def mask_phone(value: str) -> str:
    digits = _NON_DIGITS.sub("", value or "")
    if len(digits) != 12 or not digits.startswith("375"):
        return "***"
    rest = digits[3:]
    return f"+375 ({rest[:2]}) ***-**-{rest[-2:]}"
