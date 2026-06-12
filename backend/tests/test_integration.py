"""Integration smoke tests — require live server at localhost:8000."""
import pytest
import httpx

BASE_URL = "http://localhost:8000"


@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=15.0) as c:
        yield c


class TestHealthCheck:
    def test_health_returns_200(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    def test_health_has_version(self, client):
        resp = client.get("/health")
        assert "version" in resp.json()


class TestAuthValidation:
    def test_login_missing_fields_422(self, client):
        resp = client.post("/auth/login", json={})
        assert resp.status_code == 422

    def test_login_missing_password_422(self, client):
        resp = client.post("/auth/login", json={"email": "student@graduate.utm.my", "role": "student"})
        assert resp.status_code == 422

    def test_login_wrong_password_401(self, client):
        resp = client.post("/auth/login", json={
            "email": "student@graduate.utm.my",
            "password": "definitelyWrong!",
            "role": "student",
        })
        assert resp.status_code == 401

    def test_signup_missing_fields_422(self, client):
        resp = client.post("/auth/signup", json={})
        assert resp.status_code == 422

    def test_signup_invalid_domain_400(self, client):
        resp = client.post("/auth/signup", json={
            "email": "user@gmail.com",
            "full_name": "Test User",
            "role": "student",
            "password": "Test1234!",
            "matric_number": "A12345",
        })
        assert resp.status_code == 400

    def test_signup_admin_role_rejected_400(self, client):
        resp = client.post("/auth/signup", json={
            "email": "newadmin@utm.my",
            "full_name": "Fake Admin",
            "role": "admin",
            "password": "Test1234!",
        })
        assert resp.status_code == 400


class TestProtectedEndpoints:
    def test_courses_requires_auth(self, client):
        resp = client.get("/api/courses")
        assert resp.status_code in (401, 403)

    def test_marks_requires_auth(self, client):
        resp = client.get("/api/marks/course/nonexistent")
        assert resp.status_code in (401, 403)

    def test_queries_requires_auth(self, client):
        resp = client.get("/api/queries")
        assert resp.status_code in (401, 403)

    def test_admin_requires_auth(self, client):
        resp = client.get("/api/admin/pending-users")
        assert resp.status_code in (401, 403)

    def test_users_me_requires_auth(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code in (401, 403)


class TestLoginSuccess:
    def test_student_login_returns_token(self, client):
        resp = client.post("/auth/login", json={
            "email": "student@graduate.utm.my",
            "password": "password@cmsss",
            "role": "student",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["role"] == "student"

    def test_admin_login_returns_token(self, client):
        resp = client.post("/auth/login", json={
            "email": "admin@utm.my",
            "password": "password@cmsss",
            "role": "admin",
        })
        assert resp.status_code == 200
        assert "token" in resp.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
