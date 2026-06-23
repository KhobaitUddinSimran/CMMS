"""Configuration settings from environment variables - Supabase Edition"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env file (check backend dir and project root)
from pathlib import Path
_backend_dir = Path(__file__).resolve().parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv()  # also try cwd

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    # Service role key (bypasses RLS). If set, takes precedence over SUPABASE_KEY for writes.
    SUPABASE_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "") or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # JWT Configuration
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dev-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Application Configuration
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # Email Configuration
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
    EMAIL_FROM_ADDRESS: str = os.getenv("EMAIL_FROM_ADDRESS", "noreply@cmms.utm.my")
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "MarksDesk")
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()

# Initialize Supabase client.
# Prefer service_role key (bypasses RLS) for backend operations; fall back to anon key.
import threading as _threading
import logging as _logging

_effective_key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY

def _init_supabase():
    """Run create_client() in a background thread so a hanging WebSocket/
    Realtime connection cannot block uvicorn from binding the port."""
    global supabase
    try:
        _client = create_client(settings.SUPABASE_URL, _effective_key)
        supabase = _client
        if not settings.SUPABASE_SERVICE_KEY:
            _logging.getLogger(__name__).warning(
                "SUPABASE_SERVICE_KEY not set — using anon key. "
                "Writes may fail due to RLS."
            )
        else:
            _logging.getLogger(__name__).info("Supabase client initialised (service role).")
    except Exception as _e:
        _logging.getLogger(__name__).error(
            f"Failed to initialise Supabase client: {_e}. "
            "Check SUPABASE_URL and SUPABASE_KEY environment variables."
        )

supabase = None
if settings.SUPABASE_URL and _effective_key:
    _t = _threading.Thread(target=_init_supabase, daemon=True)
    _t.start()
    _t.join(timeout=20)  # 20 s max — prevents Realtime WebSocket hang blocking port bind
    if _t.is_alive():
        _logging.getLogger(__name__).error(
            "Supabase client init timed out after 20 s — starting without DB. "
            "Endpoints will return 503 until the client is ready."
        )
