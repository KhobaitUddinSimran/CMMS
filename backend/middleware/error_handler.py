"""Global exception handlers"""
import logging
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from ..core.exceptions import CMSSException

logger = logging.getLogger(__name__)

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(CMSSException)
    async def cmms_exception_handler(request, exc):
        code = getattr(exc, "status_code", status.HTTP_400_BAD_REQUEST)
        logger.warning(f"CMSSException on {request.method} {request.url.path}: {exc}")
        return JSONResponse(
            status_code=code,
            content={"detail": str(exc)},
        )
