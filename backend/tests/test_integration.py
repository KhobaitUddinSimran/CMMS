"""Integration tests for CMMS API endpoints"""
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Test database URL (use test database)
TEST_DATABASE_URL = os.getenv("DATABASE_URL", "").replace("postgres://", "postgresql+asyncpg://")

@pytest.fixture
async def async_client():
    """Create async test client"""
    from backend.main import app
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture
async def db_session():
    """Create test database session"""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        yield session
    
    await engine.dispose()

class TestAuthentication:
    """Test authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_health_check(self, async_client):
        """Test health check endpoint"""
        response = await async_client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    @pytest.mark.asyncio
    async def test_signup_validation(self, async_client):
        """Test signup validation"""
        # Missing required fields
        response = await async_client.post("/api/auth/signup", json={})
        assert response.status_code == 422  # Validation error
    
    @pytest.mark.asyncio
    async def test_login_validation(self, async_client):
        """Test login validation"""
        response = await async_client.post("/api/auth/login", json={})
        assert response.status_code == 422  # Validation error

class TestCourses:
    """Test course endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_courses_requires_auth(self, async_client):
        """Test that courses endpoint requires authentication"""
        response = await async_client.get("/api/courses")
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403]

class TestMarks:
    """Test marks endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_marks_requires_auth(self, async_client):
        """Test that marks endpoint requires authentication"""
        response = await async_client.get("/api/marks")
        assert response.status_code in [401, 403]

class TestQueries:
    """Test query endpoints"""
    
    @pytest.mark.asyncio
    async def test_get_queries_requires_auth(self, async_client):
        """Test that queries endpoint requires authentication"""
        response = await async_client.get("/api/queries")
        assert response.status_code in [401, 403]

class TestEmailService:
    """Test email service"""
    
    def test_email_config_loaded(self):
        """Test that email configuration is properly loaded"""
        from backend.services.email_service import email_config
        # Should have SMTP configuration
        assert email_config.smtp_host == "smtp.gmail.com"
        assert email_config.smtp_port == 587
        # Login and password should be set in environment
        if email_config.smtp_login:
            assert "@" in email_config.smtp_login
    
    @pytest.mark.asyncio
    async def test_email_send_function_exists(self):
        """Test that email send function exists"""
        from backend.services.email_service import _send
        assert callable(_send)

class TestDatabaseSchema:
    """Test database schema integrity"""
    
    @pytest.mark.asyncio
    async def test_users_table_exists(self, db_session):
        """Test that users table exists"""
        result = await db_session.execute(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='users')"
        )
        assert result.scalar() is True
    
    @pytest.mark.asyncio
    async def test_courses_table_exists(self, db_session):
        """Test that courses table exists"""
        result = await db_session.execute(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='courses')"
        )
        assert result.scalar() is True
    
    @pytest.mark.asyncio
    async def test_marks_table_exists(self, db_session):
        """Test that marks table exists"""
        result = await db_session.execute(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='marks')"
        )
        assert result.scalar() is True

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
