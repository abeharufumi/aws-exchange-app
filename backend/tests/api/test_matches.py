import pytest
from fastapi.testclient import TestClient
import time


def test_matching_flow(client: TestClient):
    """マッチング依頼（Like）の送信と承諾のフローをテスト"""
    # ユーザーA（男性）
    email_a = f"match_a_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_a,
            "password": "password123",
            "gender": "male",
            "display_name": "Match User A",
        },
    )
    res_a = client.post("/api/auth/login", json={"email": email_a, "password": "password123"})
    token_a = res_a.json()["access_token"]

    # ユーザーB（女性）
    email_b = f"match_b_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_b,
            "password": "password123",
            "gender": "female",
            "display_name": "Match User B",
        },
    )
    res_b = client.post("/api/auth/login", json={"email": email_b, "password": "password123"})
    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["user"]["id"]

    # --- 1. AからBへLike送信 ---
    headers_a = {"Authorization": f"Bearer {token_a}"}
    like_res = client.post(
        "/api/matches/like", json={"target_user_id": user_b_id}, headers=headers_a
    )
    assert like_res.status_code == 200, like_res.text

    # --- 2. BがIncomingリクエストを取得 ---
    headers_b = {"Authorization": f"Bearer {token_b}"}
    incoming_res = client.get("/api/matches/requests/incoming", headers=headers_b)
    assert incoming_res.status_code == 200
    incoming_list = incoming_res.json()
    assert len(incoming_list) > 0
    request_id = incoming_list[0]["requestId"]

    # --- 3. BがAのLikeをAcceptする ---
    accept_res = client.post(f"/api/matches/requests/{request_id}/accept", headers=headers_b)
    assert accept_res.status_code == 200, accept_res.text
