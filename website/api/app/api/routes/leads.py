"""Маршруты приёма и выдачи заявок (этапы 3.5 и 4.1)."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status
from fastapi.responses import JSONResponse

from app.api.deps import LeadServiceDep, SettingsDep, client_ip, require_admin_token
from app.repositories.lead_repository import LeadRepository
from app.schemas.bot_payload import to_lead_out
from app.schemas.lead import LeadCreate, LeadCreated, LeadPage

router = APIRouter(tags=["leads"])


@router.post("/api/lead", response_model=LeadCreated, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: LeadCreate,
    request: Request,
    service: LeadServiceDep,
    settings: SettingsDep,
) -> JSONResponse:
    """Принять заявку с лендинга.

    Повтор того же номера в течение окна дедупликации возвращает ``200`` с ``duplicate: true``.
    """
    result = await service.submit(
        payload,
        ip=client_ip(request, settings),
        user_agent=request.headers.get("user-agent"),
    )
    body = LeadCreated(
        id=result.lead.id, duplicate=result.duplicate, message_ru=result.message_ru
    ).model_dump()
    code = status.HTTP_200_OK if result.duplicate else status.HTTP_201_CREATED
    return JSONResponse(status_code=code, content=body)


@router.get(
    "/api/leads",
    response_model=LeadPage,
    dependencies=[Depends(require_admin_token)],
)
async def list_leads(
    service: LeadServiceDep,
    after_id: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> LeadPage:
    """Курсорная выдача заявок для телеграм-бота."""
    rows, has_more = await LeadRepository(service.repo.session).list_after(after_id, limit)
    items = [to_lead_out(row) for row in rows]
    next_after_id = items[-1].id if items else after_id
    return LeadPage(items=items, next_after_id=next_after_id, has_more=has_more)
