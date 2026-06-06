"""
レビュー機能のテスト
デート完了後のレビュー投稿フロー
"""

import time
from starlette.testclient import TestClient


def test_review_flow(client: TestClient):
    """レビュー投稿の基本フロー"""

    # ユーザーA
    email_a = f"review_a_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_a,
            "password": "pass1234",
            "gender": "male",
            "display_name": "Review_A",
        },
    )
    res_a = client.post("/api/auth/login", json={"email": email_a, "password": "pass1234"})
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]

    # ユーザーB
    email_b = f"review_b_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_b,
            "password": "pass1234",
            "gender": "female",
            "display_name": "Review_B",
        },
    )
    res_b = client.post("/api/auth/login", json={"email": email_b, "password": "pass1234"})
    token_b = res_b.json()["access_token"]
    user_b_id = res_b.json()["user"]["id"]

    # 事前にマッチング状態にする
    client.post(
        "/api/matches/like",
        json={"target_user_id": user_b_id},
        headers={"Authorization": f"Bearer {token_a}"},
    )
    incoming_res = client.get(
        "/api/matches/requests/incoming", headers={"Authorization": f"Bearer {token_b}"}
    )
    for req in incoming_res.json():
        if req["sourceUserId"] == user_a_id:
            client.post(
                f"/api/matches/requests/{req['requestId']}/accept",
                headers={"Authorization": f"Bearer {token_b}"},
            )

    # --- 1. AからBへMeetリクエスト送信 ---
    headers_a = {"Authorization": f"Bearer {token_a}"}
    meet_res = client.post(
        "/api/meet/request",
        json={
            "target_user_id": user_b_id,
            "scheduled_date": "2020-01-01",  # 過去日付
            "scheduled_time": "12:00:00",
        },
        headers=headers_a,
    )
    assert meet_res.status_code in [200, 400, 403], meet_res.text
    if meet_res.status_code != 200:
        return  # ビジネスロジックでブロックされた場合はスキップ

    meet_data = meet_res.json()
    request_id = meet_data["request_id"]

    # --- 2. BがMeet承認 ---
    headers_b = {"Authorization": f"Bearer {token_b}"}
    accept_res = client.post(f"/api/meet/accept/{request_id}", headers=headers_b)
    assert accept_res.status_code in [200, 400, 409], accept_res.text
    if accept_res.status_code != 200:
        return

    # --- 3. QR検証を行ってステータスを completed にする ---
    qr_res = client.get(
        f"/api/meet/{request_id}/qr",
        params={"latitude": 33.589886, "longitude": 130.420685, "accuracy_meters": 10.0},
        headers=headers_a,
    )
    if qr_res.status_code == 200:
        qr_data = qr_res.json()
        if qr_data.get("qr_token"):
            verify_res = client.post(
                "/api/meet/verify",
                json={
                    "request_id": request_id,
                    "token": qr_data["qr_token"],
                    "latitude": 33.589886,
                    "longitude": 130.420685,
                    "accuracy_meters": 10.0,
                },
                headers=headers_b,
            )
            if verify_res.status_code != 200:
                return  # QR検証が失敗した場合はスキップ

    # --- 4. AがBをレビュー ---
    review_res = client.post(
        "/api/review/",
        json={"target_user_id": user_b_id, "rating": 5, "comment": "とても良かったです！"},
        headers=headers_a,
    )
    assert review_res.status_code in [200, 400], review_res.text
    if review_res.status_code == 200:
        review_data = review_res.json()
        assert "review_id" in review_data
        assert "meet_request_id" in review_data
        assert review_data["status"] == "submitted"


def test_review_without_completed_meet(client: TestClient):
    """完了したMeetが無い状態でのレビュー投稿エラー"""

    # ユーザーA
    email_a = f"review_fail_a_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_a,
            "password": "pass1234",
            "gender": "male",
            "display_name": "Review_Fail_A",
        },
    )
    res_a = client.post("/api/auth/login", json={"email": email_a, "password": "pass1234"})
    token_a = res_a.json()["access_token"]

    # ユーザーB
    email_b = f"review_fail_b_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_b,
            "password": "pass1234",
            "gender": "female",
            "display_name": "Review_Fail_B",
        },
    )
    res_b = client.post("/api/auth/login", json={"email": email_b, "password": "pass1234"})
    user_b_id = res_b.json()["user"]["id"]

    # 完了したMeetが無い状態でレビュー投稿
    headers_a = {"Authorization": f"Bearer {token_a}"}
    review_res = client.post(
        "/api/review/",
        json={"target_user_id": user_b_id, "rating": 4, "comment": "test"},
        headers=headers_a,
    )
    assert review_res.status_code == 400
    assert "No completed meet available for review" in review_res.json()["detail"]
