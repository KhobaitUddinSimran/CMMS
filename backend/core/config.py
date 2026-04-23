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
    EMAIL_FROM_NAME: str = os.getenv("EMAIL_FROM_NAME", "CMMS")
    
    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"

settings = Settings()

# Initialize Supabase client.
# Prefer service_role key (bypasses RLS) for backend operations; fall back to anon key.
_effective_key = settings.SUPABASE_SERVICE_KEY or settings.SUPABASE_KEY
if settings.SUPABASE_URL and _effective_key:
    supabase = create_client(settings.SUPABASE_URL, _effective_key)
    if not settings.SUPABASE_SERVICE_KEY:
        import logging as _logging
        _logging.getLogger(__name__).warning(
            "SUPABASE_SERVICE_KEY not set — using anon key. "
            "Writes may fail due to RLS. Set SUPABASE_SERVICE_KEY in backend/.env from "
            "Supabase Dashboard → Project Settings → API → service_role key."
        )
else:
    supabase = None
