"""User endpoint full integration tests — live server required at localhost:8000."""
import httpx
import pytest

BASE_URL = "http://localhost:8000"


def _login(role: str) -> dict:
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
    return resp.json()


def _h(role: str) -> dict:
    return {"Authorization": f"Bearer {_login(role)['token']}"}


# ── GET /api/users/me ────────────────────────────────────────────────────────

class TestGetMe:
    def test_student_me_returns_correct_data(self):
        resp = httpx.get(f"{BASE_URL}/api/users/me", headers=_h("student"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "student@graduate.utm.my"
        assert data["role"] == "student"

    def test_lecturer_me_returns_correct_data(self):
        resp = httpx.get(f"{BASE_URL}/api/users/me", headers=_h("lecturer"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "lecturer@utm.my"
        assert data["role"] == "lecturer"

    def test_admin_me_returns_correct_data(self):
        resp = httpx.get(f"{BASE_URL}/api/users/me", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "admin"

    def test_me_no_auth_401(self):
        resp = httpx.get(f"{BASE_URL}/api/users/me", timeout=10)
        assert resp.status_code == 401


# ── PUT /api/users/me ────────────────────────────────────────────────────────

class TestUpdateProfile:
    def test_update_name_succeeds(self):
        resp = httpx.put(
            f"{BASE_URL}/api/users/me",
            json={"full_name": "Student Integration Test"},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (200, 204)

    def test_update_profile_no_auth_401(self):
        resp = httpx.put(f"{BASE_URL}/api/users/me", json={"full_name": "X"}, timeout=10)
        assert resp.status_code == 401


# ── POST /api/users/password-change ─────────────────────────────────────────

class TestChangePassword:
    def test_wrong_old_password_rejected(self):
        resp = httpx.post(
            f"{BASE_URL}/api/users/password-change",
            json={"old_password": "Wrong!111", "new_password": "NewTest1!", "confirm_password": "NewTest1!"},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (400, 401)

    def test_mismatch_confirm_password_rejected(self):
        resp = httpx.post(
            f"{BASE_URL}/api/users/password-change",
            json={"old_password": "password@cmsss", "new_password": "New1Pass!", "confirm_password": "Different!"},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (400, 422)

    def test_change_password_no_auth_401(self):
        resp = httpx.post(
            f"{BASE_URL}/api/users/password-change",
            json={"old_password": "a", "new_password": "b", "confirm_password": "b"},
            timeout=10,
        )
        assert resp.status_code == 401


# ── GET /api/users ────────────────────────────────────────────────────────────

class TestListUsers:
    def test_admin_can_list_users(self):
        resp = httpx.get(f"{BASE_URL}/api/users", headers=_h("admin"), timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, (list, dict))

    def test_admin_can_filter_by_role(self):
        resp = httpx.get(
            f"{BASE_URL}/api/users",
            params={"role": "student"},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code == 200

    def test_student_cannot_list_all_users(self):
        resp = httpx.get(f"{BASE_URL}/api/users", headers=_h("student"), timeout=10)
        assert resp.status_code in (403, 401)

    def test_lecturer_cannot_list_all_users(self):
        resp = httpx.get(f"{BASE_URL}/api/users", headers=_h("lecturer"), timeout=10)
        assert resp.status_code in (403, 401)


# ── PATCH /api/users/{id}/teaching-credits ──────────────────────────────────

class TestTeachingCredits:
    def test_set_teaching_credits_requires_admin(self):
        login_data = _login("lecturer")
        lecturer_id = login_data["user"]["id"]
        resp = httpx.patch(
            f"{BASE_URL}/api/users/{lecturer_id}/teaching-credits",
            json={"max_credits": 9},
            headers=_h("student"),
            timeout=10,
        )
        assert resp.status_code in (403, 401)

    def test_admin_can_set_teaching_credits(self):
        login_data = _login("lecturer")
        lecturer_id = login_data["user"]["id"]
        resp = httpx.patch(
            f"{BASE_URL}/api/users/{lecturer_id}/teaching-credits",
            json={"max_credits": 9},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (200, 204)

    def test_admin_can_clear_teaching_credits(self):
        login_data = _login("lecturer")
        lecturer_id = login_data["user"]["id"]
        resp = httpx.patch(
            f"{BASE_URL}/api/users/{lecturer_id}/teaching-credits",
            json={"max_credits": None},
            headers=_h("admin"),
            timeout=10,
        )
        assert resp.status_code in (200, 204)
