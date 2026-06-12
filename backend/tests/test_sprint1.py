"""Sprint 1 Integration Tests — live server required at localhost:8000."""
import pytest
import httpx

BASE_URL = "http://localhost:8000"


def test_health_check():
    """API health check."""
    resp = httpx.get(f"{BASE_URL}/health", timeout=10)
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"


def test_login_student():
    """Student can log in successfully."""
    resp = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "student@graduate.utm.my", "password": "password@cmsss", "role": "student"},
        timeout=10,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["role"] == "student"


def test_login_admin():
    """Admin can log in successfully."""
    resp = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "admin@utm.my", "password": "password@cmsss", "role": "admin"},
        timeout=10,
    )
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_wrong_password():
    """Wrong password returns 401."""
    resp = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": "student@graduate.utm.my", "password": "wrong!", "role": "student"},
        timeout=10,
    )
    assert resp.status_code == 401


def test_login_missing_fields():
    """Missing fields return 422."""
    resp = httpx.post(f"{BASE_URL}/auth/login", json={}, timeout=10)
    assert resp.status_code == 422
