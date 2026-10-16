"""Асинхронная сессия SQLAlchemy для SQLite (этап 3.1)."""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path

from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.db.base import Base

_settings = get_settings()

if _settings.sqlite_path is not None:
    Path(_settings.sqlite_path).parent.mkdir(parents=True, exist_ok=True)

engine = create_async_engine(_settings.database_url, echo=False, future=True)

if _settings.database_url.startswith("sqlite"):

    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragma(dbapi_connection, _record) -> None:  # pragma: no cover
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()


SessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def init_db() -> None:
    """Создать схему. На этапе 3.1 заменяется на `alembic upgrade head`."""
    from app.models import lead as _lead  # noqa: F401  (регистрация модели)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session
