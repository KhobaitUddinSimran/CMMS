"""Sprint 1 Integration Tests"""

import pytest
from httpx import AsyncClient
from backend.main import app


@pytest.mark.asyncio
async def test_health_check():
    """API health check"""
    async with AsyncClient(app=app, base_url="http://localhost") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


@pytest.mark.asyncio  
async def test_login_endpoint():
    """Login endpoint"""
    async with AsyncClient(app=app, base_url="http://localhost") as client:
        response = await client.post(
            "/auth/login",
            json={
                "email": "uddinsimran@graduate.utm.my",
                "password": "password@cmms"
            }
        )
        # Should not error out
        assert response.status_code in [200, 401, 422]
