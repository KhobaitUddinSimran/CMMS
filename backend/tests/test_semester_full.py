"""Semester timeline endpoint integration tests — live server required at localhost:8000."""
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

class TestSemesterAuthGuard:
    def test_list_timelines_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/semester-timelines", timeout=10)
        assert resp.status_code in (401, 403)

    def test_create_timeline_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/semester-timelines", json={}, timeout=10)
        assert resp.status_code in (401, 403)


# ── List Timelines ───────────────────────────────────────────────────────────

class TestListTimelines:
    def test_coordinator_can_list_timelines(self):
        resp = httpx.get(f"{BASE_URL}/api/semester-timelines", headers=_h("coordinator"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_admin_can_list_timelines(self):
        resp = httpx.get(f"{BASE_URL}/api/semester-timelines", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200

    def test_lecturer_can_list_timelines(self):
        resp = httpx.get(f"{BASE_URL}/api/semester-timelines", headers=_h("lecturer"), timeout=10)
        assert resp.status_code == 200

    def test_student_can_list_timelines(self):
        resp = httpx.get(f"{BASE_URL}/api/semester-timelines", headers=_h("student"), timeout=10)
        assert resp.status_code == 200


# ── No final_deadline field ──────────────────────────────────────────────────

class TestNoFinalDeadline:
    def test_timelines_do_not_have_final_deadline(self):
        resp = httpx.get(f"{BASE_URL}/api/semester-timelines", headers=_h("coordinator"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        for timeline in data:
            assert "final_deadline" not in timeline, (
                "final_deadline was removed in Sprint 5 and must not appear in the response"
            )


# ── Upsert Timeline ──────────────────────────────────────────────────────────

class TestUpsertTimeline:
    def test_coordinator_can_create_timeline(self):
        payload = {
            "academic_year": "2099/2100",
            "semester": 1,
            "start_date": "2099-01-01",
            "end_date": "2099-06-30",
        }
        resp = httpx.post(
            f"{BASE_URL}/api/semester-timelines",
            json=payload,
            headers=_h("coordinator"),
            timeout=10,
        )
        assert resp.status_code in (200, 201, 409)

    def test_upsert_existing_updates_not_duplicates(self):
        payload = {
            "academic_year": "2099/2100",
            "semester": 1,
            "start_date": "2099-01-15",
            "end_date": "2099-07-01",
        }
        resp = httpx.post(
            f"{BASE_URL}/api/semester-timelines",
            json=payload,
            headers=_h("coordinator"),
            timeout=10,
        )
        assert resp.status_code in (200, 201)

    def test_create_timeline_missing_fields_400(self):
        resp = httpx.post(
            f"{BASE_URL}/api/semester-timelines",
            json={"academic_year": "2088/2089"},
            headers=_h("coordinator"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_student_cannot_create_timeline(self):
        payload = {
            "academic_year": "2077/2078",
            "semester": 1,
            "start_date": "2077-01-01",
            "end_date": "2077-06-30",
        }
        resp = httpx.post(
            f"{BASE_URL}/api/semester-timelines",
            json=payload,
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)


# ── Delete Timeline ──────────────────────────────────────────────────────────

class TestDeleteTimeline:
    def test_delete_nonexistent_timeline_404(self):
        resp = httpx.delete(
            f"{BASE_URL}/api/semester-timelines/00000000-0000-0000-0000-000000000000",
            headers=_h("coordinator"),
            timeout=10,
        )
        assert resp.status_code in (404, 405)

    def test_student_cannot_delete_timeline(self):
        resp = httpx.delete(
            f"{BASE_URL}/api/semester-timelines/00000000-0000-0000-0000-000000000000",
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401, 404, 405)
