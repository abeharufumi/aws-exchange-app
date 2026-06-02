import pytest
from fastapi.testclient import TestClient
import time


def test_signup_success(client: TestClient):
    """正常なサインアップのテスト"""
    unique_email = f"test_{int(time.time())}@example.com"
    payload = {
        "email": unique_email,
        "password": "strong_password123",
        "gender": "male",
        "display_name": "Test User",
        "phone_number": f"090{int(time.time())}",
    }

    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 200, f"Signup failed: {response.text}"

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["displayName"] == "Test User"


def test_signup_invalid_email(client: TestClient):
    """無効なメールアドレスでのサインアップテスト"""
    payload = {
        "email": "invalid_email.com",
        "password": "strong_password123",
        "gender": "male",
        "display_name": "Test User",
    }

    response = client.post("/api/auth/signup", json=payload)
    assert response.status_code == 400
    assert "Invalid email format" in response.json()["detail"]


def test_login_success(client: TestClient):
    """登録とログインのテスト"""
    unique_email = f"login_{int(time.time())}@example.com"
    password = "secure_password456"

    # 事前にサインアップ
    signup_payload = {
        "email": unique_email,
        "password": password,
        "gender": "female",
        "display_name": "Login Test User",
    }
    client.post("/api/auth/signup", json=signup_payload)

    # ログインテスト
    login_payload = {"email": unique_email, "password": password}
    response = client.post("/api/auth/login", json=login_payload)

    assert response.status_code == 200, f"Login failed: {response.text}"

    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert data["user"]["gender"] == "female"


def test_login_wrong_password(client: TestClient):
    """パスワード間違いのテスト"""
    unique_email = f"wrongpw_{int(time.time())}@example.com"
    password = "secure_password456"

    # 事前にサインアップ
    signup_payload = {
        "email": unique_email,
        "password": password,
        "gender": "male",
        "display_name": "Login Test User",
    }
    client.post("/api/auth/signup", json=signup_payload)

    # 間違ったパスワードでログイン
    login_payload = {"email": unique_email, "password": "wrong_password"}
    response = client.post("/api/auth/login", json=login_payload)

    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]
