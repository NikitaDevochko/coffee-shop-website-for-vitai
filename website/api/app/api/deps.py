"""Зависимости FastAPI (этап 3.5)."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.db.session import get_session
from app.schemas.common import ApiError
from app.services.lead_service import LeadService

SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


def client_ip(request: Request, settings: SettingsDep) -> str | None:
    if settings.trust_proxy_headers:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_lead_service(session: SessionDep) -> LeadService:
    return LeadService(session)


LeadServiceDep = Annotated[LeadService, Depends(get_lead_service)]


async def require_admin_token(
    settings: SettingsDep,
    x_admin_token: Annotated[str | None, Header(alias="X-Admin-Token")] = None,
) -> None:
    """Доступ к выдаче заявок только по токену (этап 4.1)."""
    import secrets

    if not x_admin_token or not secrets.compare_digest(x_admin_token, settings.admin_api_token):
        raise ApiError(
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="unauthorized",
            message_ru="Неверный или отсутствующий X-Admin-Token.",
        )
