"""Нормализация белорусских телефонных номеров (этап 3.2).

Правило брифа: принимаются только белорусские номера, остальным — понятная подсказка.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

COUNTRY_CODE = "375"

# Коды операторов и диапазоны, действующие в Беларуси: 17/21/22 (городские, Минск и области),
# 25/29 (A1), 33/44 (МТС, life:), 25 (life:).
OPERATOR_CODES: dict[str, str] = {
    "17": "городской (Минск)",
    "21": "городской (Витебск/Орша)",
    "22": "городской (Могилёв)",
    "23": "городской (Гомель)",
    "25": "life:) / A1",
    "29": "A1",
    "33": "МТС",
    "44": "МТС",
}

OPERATOR_PREFIXES = tuple(OPERATOR_CODES)

_NON_DIGITS = re.compile(r"\D")


@dataclass(frozen=True)
class PhoneParseResult:
    normalized: str | None
    error_code: str | None = None
    message_ru: str | None = None


def _digits(value: str) -> str:
    return _NON_DIGITS.sub("", value or "")


def parse_phone(raw: str) -> PhoneParseResult:
    """Разобрать введённый номер.

    Поддерживаются формы ``+375291234567``, ``375291234567``, ``80291234567``,
    ``8 029 123-45-67``. Возвращает нормализованный ``+375XXXXXXXXX`` либо причину отказа.
    """
    digits = _digits(raw)

    if not digits:
        return PhoneParseResult(
            None,
            "phone_required",
            "Укажите телефон — мы перезвоним, чтобы подтвердить заказ.",
        )

    if digits.startswith("00"):
        digits = digits[2:]

    if digits.startswith("80"):  # 8 029 123-45-67
        digits = digits[1:]

    if not digits.startswith(COUNTRY_CODE):
        if digits.startswith("0"):  # 029 123-45-67
            digits = COUNTRY_CODE + digits[1:]
        else:
            # Похоже на номер другой страны: подсказываем белорусский формат.
            return PhoneParseResult(
                None,
                "not_belarusian",
                "Это не белорусский номер. Принимаем только номера Беларуси: "
                "+375 (29) 123-45-67.",
            )

    rest = digits[len(COUNTRY_CODE):]

    if len(rest) < 7:
        return PhoneParseResult(
            None,
            "too_short",
            "В номере не хватает цифр. Полный формат: +375 (29) 123-45-67.",
        )
    if len(rest) > 9:
        return PhoneParseResult(
            None,
            "too_long",
            "В номере слишком много цифр. Полный формат: +375 (29) 123-45-67.",
        )

    operator = rest[:2]
    if operator not in OPERATOR_CODES:
        return PhoneParseResult(
            None,
            "unknown_operator",
            f"Код {operator} не похож на белорусский. Проверьте номер: +375 (29) 123-45-67.",
        )

    return PhoneParseResult("+" + COUNTRY_CODE + rest.zfill(9))


def normalize_phone(raw: str) -> str | None:
    return parse_phone(raw).normalized


def format_phone(normalized: str) -> str:
    """``+375291234567`` -> ``+375 (29) 123-45-67``."""
    digits = _digits(normalized)
    if len(digits) != 12 or not digits.startswith(COUNTRY_CODE):
        return normalized
    rest = digits[len(COUNTRY_CODE):]
    return f"+{COUNTRY_CODE} ({rest[:2]}) {rest[2:5]}-{rest[5:7]}-{rest[7:]}"


def mask_phone(normalized: str) -> str:
    """Маска для логов: ``+375 (29) ***-**-67``."""
    digits = _digits(normalized)
    if len(digits) != 12:
        return "***"
    rest = digits[len(COUNTRY_CODE):]
    return f"+{COUNTRY_CODE} ({rest[:2]}) ***-**-{rest[-2:]}"
