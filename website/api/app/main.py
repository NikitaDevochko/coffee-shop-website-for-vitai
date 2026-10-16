"""Точка входа FastAPI (этап 3.5)."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import health, leads
from app.config import get_settings
from app.db.session import engine, init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.request_id import RequestIdMiddleware
from app.schemas.common import ApiError

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("kvarta.api")

settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await init_db()
    logger.info("БД готова: %s", settings.database_url)
    yield
    await engine.dispose()


app = FastAPI(
    title="Кварта — приём заявок",
    version="0.1.0",
    description="API лендинга обжарки «Кварта»: приём заявок, дедупликация, выдача для телеграм-бота.",
    lifespan=lifespan,
)

app.add_middleware(RequestIdMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Content-Type", "X-Request-Id", "X-Admin-Token"],
    expose_headers=["X-Request-Id"],
)


@app.exception_handler(ApiError)
async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_response())


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Приводим ошибки Pydantic к тому же формату, что и остальные ошибки."""
    fields: dict[str, str] = {}
    for err in exc.errors():
        location = [str(part) for part in err.get("loc", ()) if part not in ("body", "query")]
        key = ".".join(location) or "body"
        if key == "phone":
            fields[key] = "invalid_phone"
        elif err.get("type") == "missing":
            fields[key] = "required"
        else:
            fields[key] = "invalid"

    if "phone" in fields:
        message = "Укажите телефон в формате +375 (29) 123-45-67."
    elif "name" in fields:
        message = "Как к вам обращаться? Заполните имя."
    elif "intent" in fields:
        message = "Выберите, что вас интересует: подписка, разовый заказ или вопрос."
    else:
        message = "Проверьте заполненные поля."

    error = ApiError(422, "validation_error", message, fields)
    return JSONResponse(status_code=422, content=error.to_response())


app.include_router(health.router)
app.include_router(leads.router)
