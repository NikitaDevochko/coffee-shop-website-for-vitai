"""Сборка Dispatcher aiogram (этап B0)."""

from __future__ import annotations

from aiogram import Dispatcher

from app.bot.handlers import commands
from app.services.state_store import StateStore


def create_dispatcher(store: StateStore) -> Dispatcher:
    """Dispatcher с обработчиками команд и доступом к стейту бота.

    Стейт передаём как зависимость: обработчики получают его параметром `store`.
    """
    dispatcher = Dispatcher()
    dispatcher.include_router(commands.router)
    # aiogram подставит этот объект в хендлеры, у которых есть аргумент store.
    dispatcher["store"] = store
    return dispatcher
