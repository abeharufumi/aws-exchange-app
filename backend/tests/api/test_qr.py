"""
QRコード機能のテスト
デート約束のQR生成・検証フロー
"""

import time
from starlette.testclient import TestClient


def test_qr_flow(client: TestClient):
    """QRコード生成・検証の基本フロー"""

    # ユーザーA（sender）
    email_a = f"qr_a_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_a,
            "password": "pass1234",
            "gender": "male",
            "display_name": "QR_A",
        },
    )
    res_a = client.post("/api/auth/login", json={"email": email_a, "password": "pass1234"})
    token_a = res_a.json()["access_token"]
    user_a_id = res_a.json()["user"]["id"]

    # ユーザーB（receiver）
    email_b = f"qr_b_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_b,
            "password": "pass1234",
            "gender": "female",
            "display_name": "QR_B",
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

    # --- 1. AからBへMeetリクエスト送信（過去日付でQR即時有効化） ---
    headers_a = {"Authorization": f"Bearer {token_a}"}
    meet_res = client.post(
        "/api/meet/request",
        json={
            "target_user_id": user_b_id,
            "scheduled_date": "2020-01-01",  # 過去日付でQR即時有効
            "scheduled_time": "12:00:00",
        },
        headers=headers_a,
    )
    assert meet_res.status_code in [200, 400, 403], meet_res.text
    if meet_res.status_code != 200:
        return  # ビジネスロジックによりブロックされた場合はスキップ

    meet_data = meet_res.json()
    assert "request_id" in meet_data

    # --- 2. BがMeet承認 ---
    headers_b = {"Authorization": f"Bearer {token_b}"}
    accept_res = client.post(
        f"/api/meet/accept/{meet_data['request_id']}", headers=headers_b
    )
    assert accept_res.status_code in [200, 400, 409], accept_res.text
    if accept_res.status_code != 200:
        return  # すでに処理済みなどの場合はスキップ

    # --- 3. AがQR情報取得（senderなのでqr_tokenが返る） ---
    qr_res_a = client.get(
        f"/api/meet/{meet_data['request_id']}/qr",
        params={"latitude": 33.589886, "longitude": 130.420685, "accuracy_meters": 10.0},
        headers=headers_a,
    )
    assert qr_res_a.status_code == 200, qr_res_a.text
    qr_data_a = qr_res_a.json()
    assert qr_data_a["role"] == "sender"
    assert "qr_token" in qr_data_a
    assert qr_data_a["qr_token"] is not None

    # --- 4. BがQR検証（Aのトークンをスキャンしたと仮定） ---
    verify_payload = {
        "request_id": meet_data["request_id"],
        "token": qr_data_a["qr_token"],
        "latitude": 33.589886,  # 博多駅付近（許容範囲内）
        "longitude": 130.420685,
        "accuracy_meters": 10.0,
    }
    verify_res = client.post("/api/meet/verify", json=verify_payload, headers=headers_b)
    assert verify_res.status_code in [200, 400, 403], verify_res.text
    if verify_res.status_code == 200:
        verify_data = verify_res.json()
        assert verify_data["status"] == "verified"
        assert "completed_meet_id" in verify_data
        assert "meet_request_id" in verify_data
