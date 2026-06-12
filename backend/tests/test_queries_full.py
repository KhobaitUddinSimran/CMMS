"""Queries endpoint integration tests — live server required at localhost:8000."""
import httpx
import pytest

BASE_URL = "http://localhost:8000"


def _login(role: str) -> str:
    creds = {
        "student":     ("student@graduate.utm.my",  "password@cmsss", "student"),
        "lecturer":    ("lecturer@utm.my",           "password@cmsss", "lecturer"),
        "admin":       ("admin@utm.my",              "password@cmsss", "admin"),
        "coordinator": ("coordinator@utm.my",        "password@cmsss", "coordinator"),
    }
    email, pwd, r = creds[role]
    resp = httpx.post(f"{BASE_URL}/auth/login", json={"email": email, "password": pwd, "role": r}, timeout=10)
    if resp.status_code != 200:
        pytest.skip(f"Login failed for {role}: {resp.status_code}")
    return resp.json()["token"]


def _h(role: str) -> dict:
    return {"Authorization": f"Bearer {_login(role)}"}


# ── Auth Guard ──────────────────────────────────────────────────────────────

class TestQueriesAuthGuard:
    def test_list_queries_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/queries", timeout=10)
        assert resp.status_code in (401, 403)

    def test_create_query_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/queries", json={}, timeout=10)
        assert resp.status_code in (401, 403)


# ── List Queries ─────────────────────────────────────────────────────────────

class TestListQueries:
    def test_student_can_list_own_queries(self):
        resp = httpx.get(f"{BASE_URL}/api/queries", headers=_h("student"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, (list, dict))

    def test_lecturer_can_list_queries(self):
        resp = httpx.get(f"{BASE_URL}/api/queries", headers=_h("lecturer"), timeout=10)
        assert resp.status_code == 200

    def test_list_queries_response_has_unread_count(self):
        resp = httpx.get(f"{BASE_URL}/api/queries", headers=_h("lecturer"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        if isinstance(data, dict):
            assert "unread_count" in data or "queries" in data

    def test_list_queries_filter_open(self):
        resp = httpx.get(
            f"{BASE_URL}/api/queries",
            params={"resolved": False},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_list_queries_filter_resolved(self):
        resp = httpx.get(
            f"{BASE_URL}/api/queries",
            params={"resolved": True},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code == 200


# ── Create Query ─────────────────────────────────────────────────────────────

class TestCreateQuery:
    def test_create_query_missing_fields_422(self):
        resp = httpx.post(f"{BASE_URL}/api/queries", json={}, headers=_h("student"), timeout=10)
        assert resp.status_code in (400, 422)

    def test_lecturer_cannot_create_query(self):
        resp = httpx.post(
            f"{BASE_URL}/api/queries",
            json={"mark_id": "00000000-0000-0000-0000-000000000001", "query_text": "Why so low?"},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (403, 400, 404)

    def test_create_query_invalid_mark_404(self):
        resp = httpx.post(
            f"{BASE_URL}/api/queries",
            json={"mark_id": "00000000-0000-0000-0000-000000000000", "query_text": "Test query"},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (400, 404, 403)


# ── Get Single Query ─────────────────────────────────────────────────────────

class TestGetQuery:
    def test_get_nonexistent_query_404(self):
        resp = httpx.get(
            f"{BASE_URL}/api/queries/00000000-0000-0000-0000-000000000000",
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (404, 403)


# ── Respond to Query ─────────────────────────────────────────────────────────

class TestRespondToQuery:
    def test_respond_missing_fields_422(self):
        resp = httpx.post(
            f"{BASE_URL}/api/queries/00000000-0000-0000-0000-000000000001/respond",
            json={},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_student_cannot_respond_to_query(self):
        resp = httpx.post(
            f"{BASE_URL}/api/queries/00000000-0000-0000-0000-000000000001/respond",
            json={"response": "This is fine."},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401, 404)

    def test_respond_nonexistent_query_404(self):
        resp = httpx.post(
            f"{BASE_URL}/api/queries/00000000-0000-0000-0000-000000000000/respond",
            json={"response": "Response text"},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (404, 403)


# ── Unread Count Behaviour ────────────────────────────────────────────────────

class TestUnreadCount:
    def test_list_queries_returns_unread_count_field(self):
        resp = httpx.get(f"{BASE_URL}/api/queries", headers=_h("lecturer"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        if isinstance(data, dict):
            assert "unread_count" in data
        elif isinstance(data, list) and data:
            pass
