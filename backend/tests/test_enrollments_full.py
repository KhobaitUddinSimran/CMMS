"""Enrollment endpoint integration tests — live server required at localhost:8000."""
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


def _get_first_course_id(role: str) -> str | None:
    resp = httpx.get(f"{BASE_URL}/api/courses", headers=_h(role), timeout=10)
    if resp.status_code != 200:
        return None
    data = resp.json()
    items = data.get("data", data) if isinstance(data, dict) else data
    if items and isinstance(items, list):
        return items[0].get("id")
    return None


# ── Auth Guard ──────────────────────────────────────────────────────────────

class TestEnrollmentsAuthGuard:
    def test_list_students_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/courses/some-id/students", timeout=10)
        assert resp.status_code in (401, 403)

    def test_add_student_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/courses/some-id/enrollments", json={}, timeout=10)
        assert resp.status_code in (401, 403)


# ── List Enrolled Students ───────────────────────────────────────────────────

class TestListStudents:
    def test_lecturer_can_list_students(self):
        course_id = _get_first_course_id("lecturer")
        if not course_id:
            pytest.skip("No courses for lecturer")
        resp = httpx.get(
            f"{BASE_URL}/api/courses/{course_id}/students",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_admin_can_list_students(self):
        course_id = _get_first_course_id("admin")
        if not course_id:
            pytest.skip("No courses for admin")
        resp = httpx.get(
            f"{BASE_URL}/api/courses/{course_id}/students",
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_list_enrollments_paginated(self):
        course_id = _get_first_course_id("admin")
        if not course_id:
            pytest.skip("No courses for admin")
        resp = httpx.get(
            f"{BASE_URL}/api/courses/{course_id}/enrollments",
            params={"skip": 0, "limit": 10},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code == 200


# ── Add/Drop Student ─────────────────────────────────────────────────────────

class TestAddDropStudent:
    def test_add_student_missing_fields_422(self):
        course_id = _get_first_course_id("lecturer") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/enrollments",
            json={},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_student_cannot_add_student(self):
        course_id = _get_first_course_id("admin") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/enrollments",
            json={"email": "student@graduate.utm.my"},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)

    def test_add_nonexistent_student_returns_error(self):
        course_id = _get_first_course_id("lecturer")
        if not course_id:
            pytest.skip("No courses for lecturer")
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/enrollments",
            json={"email": "ghost@graduate.utm.my"},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 404, 409)

    def test_drop_nonexistent_student_returns_error(self):
        course_id = _get_first_course_id("lecturer")
        if not course_id:
            pytest.skip("No courses for lecturer")
        resp = httpx.delete(
            f"{BASE_URL}/api/courses/{course_id}/enrollments/00000000-0000-0000-0000-000000000000",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 404)


# ── Roster Preview ───────────────────────────────────────────────────────────

class TestRosterPreview:
    def test_roster_preview_requires_file(self):
        course_id = _get_first_course_id("lecturer") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/roster/preview",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_roster_preview_no_auth_401(self):
        resp = httpx.post(f"{BASE_URL}/api/courses/some-id/roster/preview", timeout=10)
        assert resp.status_code in (401, 403, 422)
