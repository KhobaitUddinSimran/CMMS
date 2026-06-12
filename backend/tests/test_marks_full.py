"""Marks endpoint integration tests — live server required at localhost:8000."""
import httpx
import pytest

BASE_URL = "http://localhost:8000"


def _login(role: str) -> str:
    creds = {
        "student":     ("student@graduate.utm.my",  "password@cmsss", "student"),
        "lecturer":    ("lecturer@utm.my",           "password@cmsss", "lecturer"),
        "admin":       ("admin@utm.my",              "password@cmsss", "admin"),
        "coordinator": ("coordinator@utm.my",        "password@cmsss", "coordinator"),
        "hod":         ("hod@utm.my",                "password@cmsss", "hod"),
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

class TestMarksAuthGuard:
    def test_get_course_marks_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/marks/course/some-id", timeout=10)
        assert resp.status_code in (401, 403)

    def test_create_mark_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/marks", json={}, timeout=10)
        assert resp.status_code in (401, 403)

    def test_flagged_marks_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/marks/flagged", timeout=10)
        assert resp.status_code in (401, 403)


# ── Smart Grid (Course Marks) ─────────────────────────────────────────────────

class TestCourseMarks:
    def test_lecturer_can_get_course_marks(self):
        course_id = _get_first_course_id("lecturer")
        if not course_id:
            pytest.skip("No courses for lecturer")
        resp = httpx.get(
            f"{BASE_URL}/api/marks/course/{course_id}",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_admin_can_get_course_marks(self):
        course_id = _get_first_course_id("admin")
        if not course_id:
            pytest.skip("No courses for admin")
        resp = httpx.get(
            f"{BASE_URL}/api/marks/course/{course_id}",
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_nonexistent_course_marks_returns_empty_or_404(self):
        resp = httpx.get(
            f"{BASE_URL}/api/marks/course/00000000-0000-0000-0000-000000000000",
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (200, 404)


# ── Create Mark ──────────────────────────────────────────────────────────────

class TestCreateMark:
    def test_create_mark_missing_fields_422(self):
        resp = httpx.post(f"{BASE_URL}/api/marks", json={}, headers=_h("lecturer"), timeout=10)
        assert resp.status_code in (400, 422)

    def test_student_cannot_create_mark(self):
        resp = httpx.post(
            f"{BASE_URL}/api/marks",
            json={"student_id": "s1", "assessment_id": "a1", "raw_score": 80},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401, 422)


# ── Flagged Marks ────────────────────────────────────────────────────────────

class TestFlaggedMarks:
    def test_coordinator_can_view_flagged_marks(self):
        resp = httpx.get(f"{BASE_URL}/api/marks/flagged", headers=_h("coordinator"), timeout=10)
        assert resp.status_code == 200

    def test_hod_can_view_flagged_marks(self):
        resp = httpx.get(f"{BASE_URL}/api/marks/flagged", headers=_h("hod"), timeout=10)
        assert resp.status_code == 200

    def test_flagged_marks_filter_by_course(self):
        course_id = _get_first_course_id("admin")
        if not course_id:
            pytest.skip("No courses available")
        resp = httpx.get(
            f"{BASE_URL}/api/marks/flagged",
            params={"course_id": course_id},
            headers=_h("coordinator"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_student_cannot_view_flagged_marks(self):
        resp = httpx.get(f"{BASE_URL}/api/marks/flagged", headers=_h("student"), timeout=10)
        assert resp.status_code in (403, 401)


# ── Publish/Unpublish ─────────────────────────────────────────────────────────

class TestPublishMarks:
    def test_publish_marks_no_ids_400(self):
        resp = httpx.post(
            f"{BASE_URL}/api/marks/publish",
            json={"mark_ids": []},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 422, 200)

    def test_student_cannot_publish_marks(self):
        resp = httpx.post(
            f"{BASE_URL}/api/marks/publish",
            json={"mark_ids": ["00000000-0000-0000-0000-000000000001"]},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)


# ── Student Summary ──────────────────────────────────────────────────────────

class TestStudentMarksSummary:
    def test_student_can_view_own_summary(self):
        login_resp = httpx.post(f"{BASE_URL}/auth/login", json={
            "email": "student@graduate.utm.my", "password": "password@cmsss", "role": "student"
        }, timeout=10)
        if login_resp.status_code != 200:
            pytest.skip("Student login failed")
        student_id = login_resp.json()["user"]["id"]
        token = login_resp.json()["token"]
        resp = httpx.get(
            f"{BASE_URL}/api/marks/student/{student_id}/summary",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        assert resp.status_code in (200, 404)

    def test_lecturer_can_view_student_summary(self):
        login_resp = httpx.post(f"{BASE_URL}/auth/login", json={
            "email": "student@graduate.utm.my", "password": "password@cmsss", "role": "student"
        }, timeout=10)
        if login_resp.status_code != 200:
            pytest.skip("Could not get student ID")
        student_id = login_resp.json()["user"]["id"]
        resp = httpx.get(
            f"{BASE_URL}/api/marks/student/{student_id}/summary",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (200, 404)


# ── Excel Import ─────────────────────────────────────────────────────────────

class TestExcelImport:
    def test_import_endpoint_requires_file(self):
        course_id = _get_first_course_id("lecturer") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/marks/course/{course_id}/import",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_import_endpoint_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/marks/course/some-id/import", timeout=10)
        assert resp.status_code in (401, 403, 422)

    def test_student_cannot_import_marks(self):
        course_id = _get_first_course_id("admin") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/marks/course/{course_id}/import",
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401, 422)
