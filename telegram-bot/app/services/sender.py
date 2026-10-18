"""Отправка карточки заявки (этапы B3–B4).

Чат больше не задаётся в настройках: список подписчиков живёт в стейте,
его пополняет любой, кто написал боту.
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from aiogram import Bot
from aiogram.exceptions import TelegramAPIError, TelegramForbiddenError, TelegramRetryAfter

from app.config import Settings
from app.templates.lead_card import render_lead_card

logger = logging.getLogger(__name__)


class LeadSender:
    def __init__(self, bot: Bot, settings: Settings) -> None:
        self.bot = bot
        self.settings = settings
        self.image = self._resolve_image(settings.lead_card_image)

    @staticmethod
    def _resolve_image(value: str) -> Path | None:
        if value.startswith(("http://", "https://")):
            return None
        path = Path(value)
        if not path.is_absolute():
            path = (Path(__file__).resolve().parent.parent.parent / path).resolve()
        return path if path.is_file() else None

    async def send(self, lead: dict, chats: list[str], position: int | None = None) -> int:
        """Отправить заявку всем подписчикам. Возвращает число доставок."""
        if not chats:
            return 0

        card = render_lead_card(lead, position=position)
        image_url = self.settings.lead_card_image if self.image is None else None
        delivered = 0

        for chat_id in chats:
            for attempt in range(1, self.settings.max_send_attempts + 1):
                try:
                    if self.image is not None:
                        from aiogram.types import FSInputFile

                        await self.bot.send_photo(
                            chat_id=chat_id,
                            photo=FSInputFile(self.image),
                            caption=card.caption,
                            parse_mode="HTML",
                        )
                    elif image_url:
                        await self.bot.send_photo(
                            chat_id=chat_id,
                            photo=image_url,
                            caption=card.caption,
                            parse_mode="HTML",
                        )
                    else:
                        await self.bot.send_message(
                            chat_id=chat_id, text=card.caption, parse_mode="HTML"
                        )
                    delivered += 1
                    break
                except TelegramRetryAfter as exc:
                    logger.warning("Telegram просит подождать %s c", exc.retry_after)
                    await asyncio.sleep(exc.retry_after)
                except TelegramForbiddenError as exc:
                    # Человек заблокировал бота — это не повод ронять цикл.
                    logger.warning("Чат %s недоступен (бот заблокирован): %s", chat_id, exc)
                    break
                except TelegramAPIError as exc:
                    logger.warning(
                        "Ошибка Telegram (попытка %s/%s) для чата %s: %s",
                        attempt,
                        self.settings.max_send_attempts,
                        chat_id,
                        exc,
                    )
                    if attempt < self.settings.max_send_attempts:
                        await asyncio.sleep(self.settings.retry_backoff_seconds * attempt)
                    else:
                        raise

        return delivered
