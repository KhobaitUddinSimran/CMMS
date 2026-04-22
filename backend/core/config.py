"""Configuration settings from environment variables - Supabase Edition"""
import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = "https://dvrvotajdelswvdxkuyt.supabase.co"
    SUPABASE_KEY: str = "sb_publishable_o0QSAC136pbITUn2R_dPwQ_TWxYfePY"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:khubaibcmms@db.dvrvotajdelswvdxkuyt.supabase.co:5432/postgres"
    
    # JWT Configuration
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Application Configuration
    ORIGINS: list = ["http://localhost:3000", "http://localhost:3001", "http://localhost"]
    ENVIRONMENT: str = "development"
    
    # Email Configuration
    RESEND_API_KEY: str = ""
    EMAIL_FROM_ADDRESS: str = "noreply@cmms.utm.my"
    EMAIL_FROM_NAME: str = "CMMS"
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from .env

settings = Settings()

# Initialize Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
