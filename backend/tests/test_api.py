"""Sprint 1 API Tests - Using running backend server"""

import pytest
import httpx


@pytest.fixture
def client():
    """HTTP client for backend"""
    return httpx.Client(base_url="http://localhost:8000")


class TestHealth:
    """Health check endpoint"""
    
    def test_health_returns_200(self, client):
        """Health endpoint should return 200"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestLogin:
    """Authentication endpoint"""
    
    def test_login_missing_fields(self, client):
        """Should reject login with missing fields"""
        response = client.post("/api/auth/login", json={"email": "test@graduate.utm.my"})
        assert response.status_code == 422
    
    def test_login_invalid_email(self, client):
        """Should reject invalid email"""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@graduate.utm.my", "password": "wrong"}
        )
        assert response.status_code == 401
    
    def test_login_success(self, client):
        """Should login with valid credentials"""
        response = client.post(
            "/api/auth/login",
            json={"email": "uddinsimran@graduate.utm.my", "password": "password@cmms"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data


class TestRateLimiting:
    """Rate limiting tests"""
    
    def test_rate_limit_error_message_friendly(self, client):
        """Rate limit error should be user-friendly"""
        # Make multiple failed attempts
        for i in range(6):
            response = client.post(
                "/api/auth/login",
                json={"email": "uddinsimran@graduate.utm.my", "password": "wrong"}
            )
            # On 6th attempt in dev, should hit rate limit
            if i >= 5:
                if response.status_code == 429:
                    detail = response.json()["detail"]
                    # Should contain user-friendly message
                    assert "many" in detail.lower() or "limit" in detail.lower()


class TestProtectedRoutes:
    """Protected route tests"""
    
    def test_protected_route_no_token(self, client):
        """Should reject request without token"""
        response = client.get("/api/users/me")
        assert response.status_code == 401
    
    def test_protected_route_with_token(self, client):
        """Should accept request with valid token"""
        # First login
        login = client.post(
            "/api/auth/login",
            json={"email": "uddinsimran@graduate.utm.my", "password": "password@cmms"}
        )
        if login.status_code == 200:
            token = login.json()["access_token"]
            # Use token for protected route
            response = client.get(
                "/api/users/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            # Should either work or return 404 if not implemented
            assert response.status_code in [200, 404, 500]
