"""Authentication endpoint tests — live server required."""
import httpx
import pytest

BASE_URL = "http://localhost:8000"


def test_login_student_success():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "student@graduate.utm.my", "password": "password@cmsss", "role": "student"
    }, timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["user"]["role"] == "student"
    assert data["approval_status"] == "approved"


def test_login_lecturer_success():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "lecturer@utm.my", "password": "password@cmsss", "role": "lecturer"
    }, timeout=10)
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "lecturer"


def test_login_coordinator_success():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "coordinator@utm.my", "password": "password@cmsss", "role": "coordinator"
    }, timeout=10)
    assert resp.status_code == 200


def test_login_hod_success():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "hod@utm.my", "password": "password@cmsss", "role": "hod"
    }, timeout=10)
    assert resp.status_code == 200


def test_login_admin_success():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "admin@utm.my", "password": "password@cmsss", "role": "admin"
    }, timeout=10)
    assert resp.status_code == 200
    assert resp.json()["user"]["role"] == "admin"


def test_login_wrong_password_401():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "student@graduate.utm.my", "password": "BadPassword99!", "role": "student"
    }, timeout=10)
    assert resp.status_code == 401


def test_login_nonexistent_user_401():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "nobody@graduate.utm.my", "password": "AnyPassword1!", "role": "student"
    }, timeout=10)
    assert resp.status_code == 401


def test_login_missing_all_fields_422():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={}, timeout=10)
    assert resp.status_code == 422


def test_login_missing_password_422():
    resp = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "student@graduate.utm.my", "role": "student"
    }, timeout=10)
    assert resp.status_code == 422


def test_auth_me_with_valid_token():
    login = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "student@graduate.utm.my", "password": "password@cmsss", "role": "student"
    }, timeout=10)
    assert login.status_code == 200
    token = login.json()["token"]
    resp = httpx.get(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "student@graduate.utm.my"


def test_auth_me_without_token_401():
    resp = httpx.get(f"{BASE_URL}/auth/me", timeout=10)
    assert resp.status_code == 401


def test_signup_invalid_domain_400():
    resp = httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": "user@yahoo.com",
        "full_name": "Test User",
        "role": "student",
        "password": "Test1234!",
        "matric_number": "A99999",
    }, timeout=10)
    assert resp.status_code == 400


def test_signup_lecturer_must_use_utm_domain():
    resp = httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": "lecturer@graduate.utm.my",
        "full_name": "Wrong Lecturer",
        "role": "lecturer",
        "password": "Test1234!",
    }, timeout=10)
    assert resp.status_code == 400


def test_signup_admin_role_rejected_400():
    resp = httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": "hacker@utm.my",
        "full_name": "Hacker",
        "role": "admin",
        "password": "Test1234!",
    }, timeout=10)
    assert resp.status_code == 400


def test_signup_student_without_matric_400():
    resp = httpx.post(f"{BASE_URL}/auth/signup", json={
        "email": "newstudent@graduate.utm.my",
        "full_name": "New Student",
        "role": "student",
        "password": "Test1234!",
    }, timeout=10)
    assert resp.status_code == 400


def test_password_reset_unknown_email():
    resp = httpx.post(f"{BASE_URL}/auth/password-reset", json={
        "email": "nobody@graduate.utm.my"
    }, timeout=10)
    assert resp.status_code in (200, 404)


def test_logout_with_valid_token():
    login = httpx.post(f"{BASE_URL}/auth/login", json={
        "email": "student@graduate.utm.my", "password": "password@cmsss", "role": "student"
    }, timeout=10)
    assert login.status_code == 200
    token = login.json()["token"]
    resp = httpx.post(f"{BASE_URL}/auth/logout", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert resp.status_code == 200
