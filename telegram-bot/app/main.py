"""Точка входа telegram-бота (этапы B0, B4)."""

from __future__ import annotations

import asyncio
import logging
import sys

from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.exceptions import TelegramUnauthorizedError

from app.config import get_settings
from app.services.poller import Poller
from app.services.state_store import StateStore


def setup_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
        stream=sys.stdout,
    )


async def main() -> int:
    setup_logging()
    logger = logging.getLogger("kvarta.bot")
    settings = get_settings()

    missing = settings.missing_required
    if missing:
        logger.error(
            "Не хватает настроек: %s. Заполните telegram-bot/.env (образец — .env.example) "
            "и запустите снова.",
            ", ".join(missing),
        )
        return 2

    state = StateStore(settings.state_db_url)
    await state.connect()

    bot = Bot(
        token=settings.telegram_bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    poller = Poller(bot, settings, state)

    try:
        me = await bot.get_me()
        logger.info("Бот @%s запущен, чаты: %s", me.username, ", ".join(settings.chat_ids))
        task = asyncio.create_task(poller.run())
        await task
    except TelegramUnauthorizedError:
        logger.error("Telegram отклонил токен. Проверьте TELEGRAM_BOT_TOKEN в .env.")
        return 2
    except (KeyboardInterrupt, asyncio.CancelledError):  # pragma: no cover
        poller.stop()
        logger.info("Остановка по сигналу")
    finally:
        await bot.session.close()
        await state.close()

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(asyncio.run(main()))
    except KeyboardInterrupt:  # pragma: no cover
        print("Прервано пользователем")
