"""Обработчики команд бота.

Бот работает без заранее заданного чата: любой, кто написал ему /start
(или просто любое сообщение), попадает в список подписчиков и начинает
получать заявки с сайта.
"""

from __future__ import annotations

import logging

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.types import Message

from app.services.state_store import StateStore

logger = logging.getLogger(__name__)
router = Router(name="commands")

WELCOME = (
    "<b>Бот «Кварты» на связи.</b>\n\n"
    "Теперь сюда будут приходить заявки с сайта: имя, телефон, что интересует "
    "и откуда пришёл человек.\n\n"
    "Команды:\n"
    "/stop — отписаться от уведомлений\n"
    "/status — сколько заявок уже отправлено"
)

STOPPED = "Отписался. Чтобы вернуть уведомления, напишите /start."


def _chat_title(message: Message) -> str | None:
    chat = message.chat
    return chat.title or chat.full_name or (chat.username and f"@{chat.username}") or str(chat.id)


@router.message(Command("start"))
async def on_start(message: Message, store: StateStore) -> None:
    is_new = await store.add_chat(message.chat.id, _chat_title(message))
    logger.info(
        "Подписка: chat_id=%s (%s), новый=%s", message.chat.id, _chat_title(message), is_new
    )
    await message.answer(WELCOME)


@router.message(Command("stop"))
async def on_stop(message: Message, store: StateStore) -> None:
    removed = await store.remove_chat(message.chat.id)
    logger.info("Отписка: chat_id=%s, был подписан=%s", message.chat.id, removed)
    await message.answer(STOPPED)


@router.message(Command("status"))
async def on_status(message: Message, store: StateStore) -> None:
    stats = await store.stats()
    chats = await store.list_chats()
    await message.answer(
        "<b>Статус</b>\n"
        f"Подписчиков: {len(chats)}\n"
        f"Последняя обработанная заявка: {stats.last_id}\n"
        f"Отправлено: {stats.sent}, с ошибкой: {stats.failed}"
    )


@router.message(F.text)
async def on_any_text(message: Message, store: StateStore) -> None:
    """Любое сообщение тоже подписывает чат — чтобы не требовать /start."""
    is_new = await store.add_chat(message.chat.id, _chat_title(message))
    if is_new:
        logger.info("Подписка по сообщению: chat_id=%s", message.chat.id)
        await message.answer(WELCOME)
    else:
        await message.answer("Вы уже подписаны: заявки будут приходить сюда. /status — статистика.")
