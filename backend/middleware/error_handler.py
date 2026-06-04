"""Global exception handlers"""
from fastapi import FastAPI, status
from fastapi.responses import JSONResponse
from ..core.exceptions import CMSSException

def setup_exception_handlers(app: FastAPI):
    @app.exception_handler(CMSSException)
    async def cmms_exception_handler(request, exc):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": str(exc)},
        )
