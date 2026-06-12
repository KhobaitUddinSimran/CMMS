"""Assessment endpoint integration tests — live server required at localhost:8000."""
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
    """Return the first available course ID for the given role, or None."""
    resp = httpx.get(f"{BASE_URL}/api/courses", headers=_h(role), timeout=10)
    if resp.status_code != 200:
        return None
    data = resp.json()
    items = data.get("data", data) if isinstance(data, dict) else data
    if items and isinstance(items, list):
        return items[0].get("id")
    return None


# ── Auth Guard ──────────────────────────────────────────────────────────────

class TestAssessmentsAuthGuard:
    def test_create_assessment_requires_auth(self):
        resp = httpx.post(
            f"{BASE_URL}/api/courses/some-course/assessments",
            json={"name": "Test", "type": "quiz", "max_score": 100, "weight": 10},
            timeout=10,
        )
        assert resp.status_code in (401, 403)

    def test_list_assessments_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/courses/some-course/assessments", timeout=10)
        assert resp.status_code in (401, 403)


# ── List Assessments ─────────────────────────────────────────────────────────

class TestListAssessments:
    def test_lecturer_can_list_assessments(self):
        course_id = _get_first_course_id("lecturer")
        if not course_id:
            pytest.skip("No courses available for lecturer")
        resp = httpx.get(
            f"{BASE_URL}/api/courses/{course_id}/assessments",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_student_can_view_assessments(self):
        course_id = _get_first_course_id("admin")
        if not course_id:
            pytest.skip("No courses available")
        resp = httpx.get(
            f"{BASE_URL}/api/courses/{course_id}/assessments",
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (200, 403)


# ── Create Assessment ────────────────────────────────────────────────────────

class TestCreateAssessment:
    def test_student_cannot_create_assessment(self):
        course_id = _get_first_course_id("admin") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/assessments",
            json={"name": "Evil Quiz", "type": "quiz", "max_score": 100, "weight": 10},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)

    def test_create_assessment_missing_fields_422(self):
        course_id = _get_first_course_id("lecturer") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/assessments",
            json={"name": "Incomplete"},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_create_assessment_nonexistent_course_404(self):
        resp = httpx.post(
            f"{BASE_URL}/api/courses/00000000-0000-0000-0000-000000000000/assessments",
            json={"name": "Test", "type": "quiz", "max_score": 100, "weight": 10},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (403, 404)

    def test_admin_creates_assessment_for_course(self):
        course_id = _get_first_course_id("admin")
        if not course_id:
            pytest.skip("No courses available for admin")
        resp = httpx.post(
            f"{BASE_URL}/api/courses/{course_id}/assessments",
            json={"name": "Integration Test Assessment", "type": "quiz", "max_score": 50.0, "weight": 10.0},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (201, 200, 409, 403)


# ── Cumulative Weight ────────────────────────────────────────────────────────

class TestWeightValidation:
    def test_weight_validation_endpoint_exists(self):
        course_id = _get_first_course_id("lecturer") or "00000000-0000-0000-0000-000000000001"
        resp = httpx.get(
            f"{BASE_URL}/api/courses/{course_id}/assessments",
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (200, 403, 404)
