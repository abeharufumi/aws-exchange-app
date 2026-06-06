"""
通知機能のテスト
通知取得、既読管理
"""

import time
from starlette.testclient import TestClient


def test_notifications_basic(client: TestClient):
    """基本的な通知取得機能"""

    # ユーザーA
    email_a = f"notif_a_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_a,
            "password": "pass1234",
            "gender": "male",
            "display_name": "Notif_A",
        },
    )
    res_a = client.post("/api/auth/login", json={"email": email_a, "password": "pass1234"})
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]

    # ユーザーB
    email_b = f"notif_b_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_b,
            "password": "pass1234",
            "gender": "female",
            "display_name": "Notif_B",
        },
    )
    res_b = client.post("/api/auth/login", json={"email": email_b, "password": "pass1234"})
    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["user"]["id"]

    # --- 1. AからBへいいね送信（通知が作成される） ---
    headers_a = {"Authorization": f"Bearer {token_a}"}
    like_res = client.post(
        "/api/matches/like", json={"target_user_id": user_b_id}, headers=headers_a
    )
    assert like_res.status_code in [200, 400], like_res.text

    # --- 2. Bの通知一覧を取得 ---
    headers_b = {"Authorization": f"Bearer {token_b}"}
    notif_res = client.get("/api/notifications", headers=headers_b)
    assert notif_res.status_code == 200, notif_res.text
    notif_data = notif_res.json()
    assert isinstance(notif_data, list)

    # --- 3. Bの未読件数を取得 ---
    unread_res = client.get("/api/notifications/unread-count", headers=headers_b)
    assert unread_res.status_code == 200, unread_res.text
    unread_data = unread_res.json()
    assert "unreadCount" in unread_data
    assert unread_data["unreadCount"] >= 0

    # --- 4. 既読更新（全て既読） ---
    if notif_data and len(notif_data) > 0:
        mark_read_res = client.patch("/api/notifications/read-all", headers=headers_b)
        assert mark_read_res.status_code == 200, mark_read_res.text
        mark_read_data = mark_read_res.json()
        assert mark_read_data["status"] == "ok"
        assert "updatedCount" in mark_read_data


def test_notifications_pagination(client: TestClient):
    """通知一覧のページネーション"""

    # ユーザーを作成
    email = f"notif_paging_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": "pass1234",
            "gender": "male",
            "display_name": "Notif_Paging",
        },
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "pass1234"})
    token = res.json()["access_token"]

    # ページネーション付き通知取得
    headers = {"Authorization": f"Bearer {token}"}
    notif_res = client.get("/api/notifications", params={"limit": 10, "offset": 0}, headers=headers)
    assert notif_res.status_code == 200, notif_res.text
    notif_data = notif_res.json()
    assert isinstance(notif_data, list)
    assert len(notif_data) <= 10
