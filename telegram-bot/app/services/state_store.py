"""Локальный стейт доставки (этап B2).

Свой SQLite, а не БД сайта: журнал доставок нужен только боту и защищает от повторной
отправки одной и той же заявки после рестарта (см. DECISIONS.md, B-D3).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import aiosqlite

logger = logging.getLogger(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS deliveries (
    lead_id INTEGER PRIMARY KEY,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    error TEXT,
    sent_at TEXT
);
"""


@dataclass(frozen=True)
class Stats:
    last_id: int
    sent: int
    failed: int
    pending: int


def _resolve_path(state_db_url: str) -> Path:
    prefix = "sqlite+aiosqlite:///"
    raw = state_db_url[len(prefix):] if state_db_url.startswith(prefix) else state_db_url
    path = Path(raw)
    if not path.is_absolute():
        path = (Path(__file__).resolve().parent.parent.parent / path).resolve()
    return path


class StateStore:
    def __init__(self, state_db_url: str) -> None:
        self.path = _resolve_path(state_db_url)
        self._db: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._db = await aiosqlite.connect(self.path)
        self._db.row_factory = aiosqlite.Row
        await self._db.executescript(SCHEMA)
        await self._db.commit()
        logger.info("Стейт бота: %s", self.path)

    async def close(self) -> None:
        if self._db is not None:
            await self._db.close()
            self._db = None

    @property
    def db(self) -> aiosqlite.Connection:
        if self._db is None:
            raise RuntimeError("StateStore не подключён")
        return self._db

    # --- курсор -------------------------------------------------------------
    async def get_last_id(self) -> int:
        cursor = await self.db.execute("SELECT value FROM meta WHERE key = 'last_id'")
        row = await cursor.fetchone()
        return int(row["value"]) if row else 0

    async def set_last_id(self, lead_id: int) -> None:
        await self.db.execute(
            "INSERT INTO meta (key, value) VALUES ('last_id', ?) "
            "ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (str(lead_id),),
        )
        await self.db.commit()

    # --- журнал доставок ----------------------------------------------------
    async def was_sent(self, lead_id: int) -> bool:
        cursor = await self.db.execute(
            "SELECT status FROM deliveries WHERE lead_id = ?", (lead_id,)
        )
        row = await cursor.fetchone()
        return bool(row) and row["status"] == "sent"

    async def attempts(self, lead_id: int) -> int:
        cursor = await self.db.execute(
            "SELECT attempts FROM deliveries WHERE lead_id = ?", (lead_id,)
        )
        row = await cursor.fetchone()
        return int(row["attempts"]) if row else 0

    async def mark_sent(self, lead_id: int) -> None:
        await self.db.execute(
            "INSERT INTO deliveries (lead_id, status, attempts, error, sent_at) "
            "VALUES (?, 'sent', 1, NULL, ?) "
            "ON CONFLICT(lead_id) DO UPDATE SET status = 'sent', "
            "attempts = deliveries.attempts + 1, error = NULL, sent_at = excluded.sent_at",
            (lead_id, datetime.now(timezone.utc).isoformat()),
        )
        await self.db.commit()

    async def mark_failed(self, lead_id: int, error: str) -> None:
        await self.db.execute(
            "INSERT INTO deliveries (lead_id, status, attempts, error) "
            "VALUES (?, 'failed', 1, ?) "
            "ON CONFLICT(lead_id) DO UPDATE SET status = 'failed', "
            "attempts = deliveries.attempts + 1, error = excluded.error",
            (lead_id, error[:500]),
        )
        await self.db.commit()

    async def stats(self) -> Stats:
        last_id = await self.get_last_id()
        cursor = await self.db.execute(
            "SELECT status, COUNT(*) AS n FROM deliveries GROUP BY status"
        )
        counts = {row["status"]: row["n"] for row in await cursor.fetchall()}
        return Stats(
            last_id=last_id,
            sent=counts.get("sent", 0),
            failed=counts.get("failed", 0),
            pending=counts.get("pending", 0),
        )
