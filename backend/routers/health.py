"""Health check endpoint"""
import os
from fastapi import APIRouter
from services.email_service import _get_smtp_config, _send

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@router.get("/health/email-config")
async def email_config_check():
    cfg = _get_smtp_config()
    return {
        "smtp_host": cfg.host,
        "smtp_port": cfg.port,
        "smtp_login": cfg.login,
        "email_from": cfg.from_address,
        "is_configured": cfg.is_configured,
    }

@router.post("/health/test-email")
async def test_email(to: str):
    import asyncio
    from services.email_service import _send_smtp, _get_smtp_config
    cfg = _get_smtp_config()
    try:
        await asyncio.to_thread(_send_smtp, to, "MarksDesk Email Test", "<p>Email system is working.</p>")
        return {"sent": True}
    except Exception as exc:
        return {"sent": False, "error": type(exc).__name__, "detail": str(exc)}
