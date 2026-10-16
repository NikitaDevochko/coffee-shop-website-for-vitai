"""Доступ к данным заявок (этап 3.1)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.lead import Lead


class LeadRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(self, **fields) -> Lead:
        lead = Lead(**fields)
        self.session.add(lead)
        await self.session.commit()
        await self.session.refresh(lead)
        return lead

    async def find_recent_by_phone(self, phone_normalized: str, within_minutes: int) -> Lead | None:
        """Последняя заявка с этим номером за окно дедупликации (этап 3.3)."""
        since = datetime.now(timezone.utc) - timedelta(minutes=within_minutes)
        stmt = (
            select(Lead)
            .where(Lead.phone_normalized == phone_normalized, Lead.created_at >= since)
            .order_by(Lead.created_at.desc())
            .limit(1)
        )
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def find_by_client_request_id(self, client_request_id: str) -> Lead | None:
        stmt = select(Lead).where(Lead.client_request_id == client_request_id).limit(1)
        return (await self.session.execute(stmt)).scalar_one_or_none()

    async def list_after(self, after_id: int, limit: int) -> tuple[Sequence[Lead], bool]:
        """Курсорная выдача для телеграм-бота (этап 4.1). Возвращает (заявки, есть_ли_ещё)."""
        stmt = (
            select(Lead)
            .where(Lead.id > after_id)
            .order_by(Lead.id.asc())
            .limit(limit + 1)
        )
        rows = list((await self.session.execute(stmt)).scalars().all())
        has_more = len(rows) > limit
        return rows[:limit], has_more

    async def count(self) -> int:
        return int((await self.session.execute(select(func.count(Lead.id)))).scalar_one())
