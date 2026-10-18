"""Цикл опроса API сайта (этапы B1–B4)."""

from __future__ import annotations

import asyncio
import logging

from aiogram import Bot

from app.config import Settings
from app.services.api_client import ApiError, LeadApiClient, UnauthorizedError
from app.services.sender import LeadSender
from app.services.state_store import StateStore

logger = logging.getLogger(__name__)


class Poller:
    def __init__(self, bot: Bot, settings: Settings, state: StateStore) -> None:
        self.bot = bot
        self.settings = settings
        self.state = state
        self.sender = LeadSender(bot, settings)
        self._stopped = asyncio.Event()

    def stop(self) -> None:
        self._stopped.set()

    async def run(self) -> None:
        async with LeadApiClient() as client:
            logger.info(
                "Опрос %s каждые %s c (курсор: %s)",
                self.settings.api_leads_url,
                self.settings.poll_interval_seconds,
                await self.state.get_last_id(),
            )
            while not self._stopped.is_set():
                try:
                    await self._tick(client)
                except UnauthorizedError as exc:
                    logger.error("%s", exc)
                    return
                except ApiError as exc:
                    logger.warning("Опрос не удался: %s", exc)
                except Exception:  # pragma: no cover - защита цикла
                    logger.exception("Непредвиденная ошибка в цикле опроса")

                try:
                    await asyncio.wait_for(
                        self._stopped.wait(), timeout=self.settings.poll_interval_seconds
                    )
                except asyncio.TimeoutError:
                    pass

    async def _tick(self, client: LeadApiClient) -> None:
        after_id = await self.state.get_last_id()
        page = await client.fetch_leads(after_id, limit=self.settings.page_size)
        items = page.get("items", [])
        if not items:
            return

        chats = await self.state.list_chats()
        if not chats:
            # Подписчиков ещё нет: ждём, пока кто-нибудь напишет боту /start.
            # Курсор не двигаем, чтобы заявки не потерялись.
            logger.info(
                "Заявок в очереди: %s, но подписчиков нет — напишите боту /start", len(items)
            )
            return

        logger.info("Получено заявок: %s (после id=%s), подписчиков: %s", len(items), after_id, len(chats))

        for lead in items:
            lead_id = int(lead["id"])

            if await self.state.was_sent(lead_id):
                await self.state.set_last_id(lead_id)
                continue

            if await self.state.attempts(lead_id) >= self.settings.max_send_attempts:
                logger.error(
                    "Заявка %s не отправлена после %s попыток — оставлена в журнале",
                    lead_id,
                    self.settings.max_send_attempts,
                )
                await self.state.set_last_id(lead_id)
                continue

            try:
                delivered = await self.sender.send(lead, chats)
            except Exception as exc:
                await self.state.mark_failed(lead_id, str(exc))
                raise ApiError(f"не удалось отправить заявку {lead_id}: {exc}") from exc

            await self.state.mark_sent(lead_id)
            await self.state.set_last_id(lead_id)
            logger.info("Заявка %s отправлена подписчикам: %s", lead_id, delivered)
