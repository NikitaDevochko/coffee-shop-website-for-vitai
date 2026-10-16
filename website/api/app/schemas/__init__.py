"""Pydantic-схемы API."""

from app.schemas.common import ApiError, ErrorBody, ErrorResponse
from app.schemas.lead import LeadCreate, LeadCreated, LeadOut, LeadPage, LeadSource

__all__ = [
    "ApiError",
    "ErrorBody",
    "ErrorResponse",
    "LeadCreate",
    "LeadCreated",
    "LeadOut",
    "LeadPage",
    "LeadSource",
]
