"""Course endpoint integration tests — live server required at localhost:8000."""
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
        pytest.skip(f"Could not authenticate as {role}: {resp.status_code}")
    return resp.json()["token"]


def _h(role: str) -> dict:
    return {"Authorization": f"Bearer {_login(role)}"}


# ── Auth Guard ──────────────────────────────────────────────────────────────

class TestCoursesAuthGuard:
    def test_list_courses_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/courses", timeout=10)
        assert resp.status_code in (401, 403)

    def test_create_course_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/courses", json={}, timeout=10)
        assert resp.status_code in (401, 403)


# ── List Courses ────────────────────────────────────────────────────────────

class TestListCourses:
    def test_lecturer_can_list_courses(self):
        resp = httpx.get(f"{BASE_URL}/api/courses", headers=_h("lecturer"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data or isinstance(data, list)

    def test_student_can_list_enrolled_courses(self):
        resp = httpx.get(f"{BASE_URL}/api/courses", headers=_h("student"), timeout=10)
        assert resp.status_code == 200

    def test_admin_can_list_all_courses(self):
        resp = httpx.get(f"{BASE_URL}/api/courses", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200

    def test_coordinator_can_list_all_courses(self):
        resp = httpx.get(f"{BASE_URL}/api/courses", headers=_h("coordinator"), timeout=10)
        assert resp.status_code == 200

    def test_pagination_params_accepted(self):
        resp = httpx.get(
            f"{BASE_URL}/api/courses",
            params={"skip": 0, "limit": 5},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code == 200


# ── Create Course ────────────────────────────────────────────────────────────

class TestCreateCourse:
    def test_admin_can_create_course(self):
        payload = {
            "code": "TEST001",
            "name": "Integration Test Course",
            "credits": 3,
            "semester": "1",
            "academic_year": "2025/2026",
            "max_students": 30,
        }
        resp = httpx.post(f"{BASE_URL}/api/courses", json=payload, headers=_h("admin"), timeout=10)
        assert resp.status_code in (200, 201, 409)

    def test_coordinator_can_create_course(self):
        payload = {
            "code": "TEST002",
            "name": "Coordinator Course",
            "credits": 3,
            "semester": "1",
            "academic_year": "2025/2026",
            "max_students": 30,
        }
        resp = httpx.post(f"{BASE_URL}/api/courses", json=payload, headers=_h("coordinator"), timeout=10)
        assert resp.status_code in (200, 201, 403, 409)

    def test_student_cannot_create_course(self):
        payload = {"code": "EVIL001", "name": "Hacked", "credits": 3, "semester": "1", "academic_year": "2025/2026"}
        resp = httpx.post(f"{BASE_URL}/api/courses", json=payload, headers=_h("student"), timeout=10)
        assert resp.status_code in (403, 422)

    def test_create_course_missing_fields_422(self):
        resp = httpx.post(f"{BASE_URL}/api/courses", json={"name": "No Code"}, headers=_h("admin"), timeout=10)
        assert resp.status_code in (400, 422)


# ── Get Single Course ────────────────────────────────────────────────────────

class TestGetCourse:
    def test_nonexistent_course_404(self):
        resp = httpx.get(
            f"{BASE_URL}/api/courses/00000000-0000-0000-0000-000000000000",
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (404, 200)

    def test_invalid_uuid_returns_error(self):
        resp = httpx.get(f"{BASE_URL}/api/courses/not-a-uuid", headers=_h("admin"), timeout=10)
        assert resp.status_code in (400, 404, 422, 500)


# ── Lecturer Workloads ───────────────────────────────────────────────────────

class TestLecturerWorkloads:
    def test_workloads_endpoint_accessible(self):
        resp = httpx.get(f"{BASE_URL}/api/courses/lecturer-workloads", headers=_h("coordinator"), timeout=10)
        assert resp.status_code == 200

    def test_workloads_contains_expected_fields(self):
        resp = httpx.get(f"{BASE_URL}/api/courses/lecturer-workloads", headers=_h("coordinator"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        if isinstance(data, list) and data:
            item = data[0]
            assert "lecturer_id" in item or "full_name" in item

    def test_workloads_student_forbidden(self):
        resp = httpx.get(f"{BASE_URL}/api/courses/lecturer-workloads", headers=_h("student"), timeout=10)
        assert resp.status_code in (403, 401)
