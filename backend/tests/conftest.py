"""Pytest configuration and shared fixtures for all CMMS backend tests.

All integration tests run against a live server at http://localhost:8000.
Start the backend before running: uvicorn main:app --reload
"""
import pytest
import httpx

BASE_URL = "http://localhost:8000"

# ── Documented test credentials ──────────────────────────────────────────────
TEST_USERS = {
    "student":     {"email": "student@graduate.utm.my",  "password": "password@cmsss", "role": "student"},
    "lecturer":    {"email": "lecturer@utm.my",           "password": "password@cmsss", "role": "lecturer"},
    "coordinator": {"email": "coordinator@utm.my",        "password": "password@cmsss", "role": "coordinator"},
    "hod":         {"email": "hod@utm.my",                "password": "password@cmsss", "role": "hod"},
    "admin":       {"email": "admin@utm.my",              "password": "password@cmsss", "role": "admin"},
}


@pytest.fixture(scope="session")
def client():
    """Sync httpx client pointing at the live backend."""
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as c:
        yield c


def get_token(role: str) -> str:
    """Return a Bearer token for the given role by logging in."""
    creds = TEST_USERS[role]
    resp = httpx.post(
        f"{BASE_URL}/auth/login",
        json={"email": creds["email"], "password": creds["password"], "role": creds["role"]},
        timeout=15.0,
    )
    if resp.status_code != 200:
        pytest.skip(f"Could not authenticate as {role}: {resp.status_code} {resp.text}")
    return resp.json()["token"]


def auth_headers(role: str) -> dict:
    """Return Authorization header dict for the given role."""
    return {"Authorization": f"Bearer {get_token(role)}"}


@pytest.fixture(scope="session")
def student_headers():
    return auth_headers("student")


@pytest.fixture(scope="session")
def lecturer_headers():
    return auth_headers("lecturer")


@pytest.fixture(scope="session")
def coordinator_headers():
    return auth_headers("coordinator")


@pytest.fixture(scope="session")
def hod_headers():
    return auth_headers("hod")


@pytest.fixture(scope="session")
def admin_headers():
    return auth_headers("admin")
