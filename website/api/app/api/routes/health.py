"""Healthcheck (этап 3.5)."""

from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import text

from app.api.deps import SessionDep

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz(session: SessionDep) -> dict[str, object]:
    try:
        await session.execute(text("SELECT 1"))
        database = "ok"
    except Exception as exc:  # pragma: no cover - диагностика
        database = f"error: {exc.__class__.__name__}"
    return {"status": "ok", "database": database}
