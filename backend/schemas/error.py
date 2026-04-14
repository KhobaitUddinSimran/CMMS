"""Error schemas"""
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    detail: str
    status_code: int

class ValidationError(BaseModel):
    field: str
    message: str
