"""User endpoint tests — live server required."""
import httpx

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
    assert resp.status_code == 200, f"Login failed for {role}: {resp.text}"
    return resp.json()["token"]


def test_get_current_user_with_token():
    token = _login("student")
    resp = httpx.get(f"{BASE_URL}/api/users/me", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "student@graduate.utm.my"
    assert data["role"] == "student"


def test_get_current_user_no_token_401():
    resp = httpx.get(f"{BASE_URL}/api/users/me", timeout=10)
    assert resp.status_code == 401


def test_update_profile():
    token = _login("student")
    resp = httpx.put(
        f"{BASE_URL}/api/users/me",
        json={"full_name": "Student Test User"},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert resp.status_code in (200, 204)


def test_update_profile_no_token_401():
    resp = httpx.put(f"{BASE_URL}/api/users/me", json={"full_name": "X"}, timeout=10)
    assert resp.status_code == 401


def test_change_password_wrong_old_password():
    token = _login("student")
    resp = httpx.post(
        f"{BASE_URL}/api/users/password-change",
        json={"old_password": "definitelyWrong!", "new_password": "NewPass1!", "confirm_password": "NewPass1!"},
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert resp.status_code in (400, 401, 422)


def test_list_users_admin_only():
    token = _login("admin")
    resp = httpx.get(f"{BASE_URL}/api/users", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list) or isinstance(data, dict)


def test_list_users_student_forbidden():
    token = _login("student")
    resp = httpx.get(f"{BASE_URL}/api/users", headers={"Authorization": f"Bearer {token}"}, timeout=10)
    assert resp.status_code in (403, 401)
