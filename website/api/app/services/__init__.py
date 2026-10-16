"""Сервисы приложения."""

from app.services.lead_service import DUPLICATE_MESSAGE, CREATED_MESSAGE, LeadResult, LeadService

__all__ = ["LeadService", "LeadResult", "DUPLICATE_MESSAGE", "CREATED_MESSAGE"]
