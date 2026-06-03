import pytest
from fastapi.testclient import TestClient
import time


def test_get_me_success(client: TestClient):
    """ログインユーザー自身のプロフィール取得テスト"""
    unique_email = f"me_test_{int(time.time())}@example.com"
    # 事前にサインアップ
    signup_payload = {
        "email": unique_email,
        "password": "testpassword123",
        "gender": "male",
        "display_name": "Me Test User",
    }
    response = client.post("/api/auth/signup", json=signup_payload)
    assert response.status_code == 200
    token = response.json()["access_token"]

    # 自身のプロフィールを取得
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/users/me", headers=headers)
    assert response.status_code == 200, f"Get /me failed: {response.text}"

    data = response.json()
    assert data["displayName"] == "Me Test User"
    assert data["gender"] == "male"
    assert "rankProgress" in data
    assert data["rank"] == 1


def test_get_user_by_id_success(client: TestClient):
    """他のユーザーのプロフィール取得テスト"""
    target_email = f"target_{int(time.time())}@example.com"
    # ターゲットユーザーをサインアップ
    target_payload = {
        "email": target_email,
        "password": "testpassword123",
        "gender": "female",
        "display_name": "Target User",
        "phone_number": f"090{int(time.time())}",
    }
    target_response = client.post("/api/auth/signup", json=target_payload)
    target_id = target_response.json()["user"]["id"]

    viewer_email = f"viewer_{int(time.time())}@example.com"
    # 閲覧ユーザーをサインアップ＆ログイン
    viewer_payload = {
        "email": viewer_email,
        "password": "testpassword123",
        "gender": "male",
        "display_name": "Viewer User",
        "phone_number": f"080{int(time.time())}",
    }
    viewer_response = client.post("/api/auth/signup", json=viewer_payload)
    viewer_token = viewer_response.json()["access_token"]

    # ターゲットユーザーのプロフィールを取得
    headers = {"Authorization": f"Bearer {viewer_token}"}
    response = client.get(f"/api/users/{target_id}", headers=headers)
    assert response.status_code == 200, f"Get target user failed: {response.text}"

    data = response.json()
    assert data["id"] == target_id
    assert data["displayName"] == "Target User"


def test_update_profile(client: TestClient):
    """プロフィールの更新テスト"""
    unique_email = f"update_{int(time.time())}@example.com"
    # サインアップ
    signup_payload = {
        "email": unique_email,
        "password": "testpassword123",
        "gender": "male",
        "display_name": "Before Update",
    }
    response = client.post("/api/auth/signup", json=signup_payload)
    token = response.json()["access_token"]

    # プロフィールを更新
    headers = {"Authorization": f"Bearer {token}"}
    update_payload = {
        "displayName": "After Update",
        "age": 30,
        "location": "Tokyo",
        "bio": "Hello World",
    }
    response = client.patch("/api/users/me", json=update_payload, headers=headers)
    assert response.status_code == 200, f"Update profile failed: {response.text}"

    # 更新内容を確認
    response = client.get("/api/users/me", headers=headers)
    data = response.json()
    assert data["displayName"] == "After Update"
    assert data["age"] == 30
    assert data["location"] == "Tokyo"
    assert data["bio"] == "Hello World"
