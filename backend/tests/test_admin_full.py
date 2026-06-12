"""Admin endpoint integration tests — live server required at localhost:8000."""
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

class TestAdminAuthGuard:
    def test_pending_users_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/pending-users", timeout=10)
        assert resp.status_code in (401, 403)

    def test_approve_user_requires_auth(self):
        resp = httpx.post(f"{BASE_URL}/api/admin/approve-user", json={}, timeout=10)
        assert resp.status_code in (401, 403)

    def test_admin_stats_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/stats", timeout=10)
        assert resp.status_code in (401, 403)

    def test_audit_logs_requires_auth(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/audit-logs", timeout=10)
        assert resp.status_code in (401, 403)


# ── Role Enforcement (non-admin forbidden) ───────────────────────────────────

class TestAdminRoleEnforcement:
    def test_student_cannot_access_pending_users(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/pending-users", headers=_h("student"), timeout=10)
        assert resp.status_code in (403, 401)

    def test_lecturer_cannot_access_pending_users(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/pending-users", headers=_h("lecturer"), timeout=10)
        assert resp.status_code in (403, 401)

    def test_student_cannot_approve_user(self):
        resp = httpx.post(
            f"{BASE_URL}/api/admin/approve-user",
            json={"email": "anyone@graduate.utm.my"},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)

    def test_lecturer_cannot_assign_special_role(self):
        resp = httpx.post(
            f"{BASE_URL}/api/admin/assign-special-role",
            json={"email": "lecturer@utm.my", "special_role": "coordinator"},
            headers=_h("lecturer"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)


# ── Admin Operations ─────────────────────────────────────────────────────────

class TestAdminOperations:
    def test_admin_can_list_pending_users(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/pending-users", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_admin_can_list_lecturers(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/lecturers", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_admin_can_get_stats(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/stats", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, dict)

    def test_admin_can_get_audit_logs(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/audit-logs", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, (list, dict))

    def test_admin_can_list_all_users(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/users", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200

    def test_approve_nonexistent_user_404(self):
        resp = httpx.post(
            f"{BASE_URL}/api/admin/approve-user",
            json={"email": "nobody@graduate.utm.my"},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (404, 400)

    def test_reject_nonexistent_user_404(self):
        resp = httpx.post(
            f"{BASE_URL}/api/admin/reject-user",
            json={"email": "nobody@graduate.utm.my", "reason": "Test"},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (404, 400)

    def test_assign_invalid_special_role_400(self):
        resp = httpx.post(
            f"{BASE_URL}/api/admin/assign-special-role",
            json={"email": "lecturer@utm.my", "special_role": "superuser"},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_hod_stats_accessible_by_admin(self):
        resp = httpx.get(f"{BASE_URL}/api/admin/hod-stats", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200

    def test_toggle_user_active_missing_fields(self):
        resp = httpx.post(
            f"{BASE_URL}/api/admin/toggle-user-active",
            json={},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)
