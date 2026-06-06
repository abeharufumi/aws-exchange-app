"""
ユーザー検索機能のテスト
検索エンドポイントのテスト
"""

import time
from starlette.testclient import TestClient


def test_search_basic(client: TestClient):
    """基本的なユーザー検索機能"""

    # 検索を行うユーザーを作成
    email_searcher = f"searcher_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email_searcher,
            "password": "pass1234",
            "gender": "male",
            "display_name": "Searcher",
        },
    )
    res_searcher = client.post(
        "/api/auth/login", json={"email": email_searcher, "password": "pass1234"}
    )
    token_searcher = res_searcher.json()["access_token"]

    # 検索対象となるユーザーを複数作成
    for i in range(3):
        email_target = f"target_{i}_{int(time.time())}@example.com"
        client.post(
            "/api/auth/signup",
            json={
                "email": email_target,
                "password": "pass1234",
                "gender": "female",
                "display_name": f"Target_{i}",
            },
        )

    # --- 1. 基本検索（パラメータなし） ---
    headers = {"Authorization": f"Bearer {token_searcher}"}
    search_res = client.get("/api/users/search", headers=headers)
    assert search_res.status_code == 200, search_res.text
    search_data = search_res.json()
    assert isinstance(search_data, list)

    # --- 2. 年齢フィルター付き検索 ---
    search_age_res = client.get(
        "/api/users/search", params={"min_age": 18, "max_age": 30}, headers=headers
    )
    assert search_age_res.status_code == 200, search_age_res.text
    search_age_data = search_age_res.json()
    assert isinstance(search_age_data, list)

    # --- 3. ランクフィルター付き検索 ---
    search_rank_res = client.get(
        "/api/users/search", params={"min_rank": 1, "max_rank": 3}, headers=headers
    )
    assert search_rank_res.status_code == 200, search_rank_res.text
    search_rank_data = search_rank_res.json()
    assert isinstance(search_rank_data, list)


def test_search_with_location(client: TestClient):
    """位置情報キーワード検索"""

    # ユーザーを作成
    email = f"location_searcher_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": "pass1234",
            "gender": "male",
            "display_name": "LocationSearcher",
        },
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "pass1234"})
    token = res.json()["access_token"]

    # 位置情報キーワード検索
    headers = {"Authorization": f"Bearer {token}"}
    search_res = client.get("/api/users/search", params={"location": "Tokyo"}, headers=headers)
    assert search_res.status_code == 200, search_res.text
    search_data = search_res.json()
    assert isinstance(search_data, list)


def test_search_pagination(client: TestClient):
    """検索結果のページネーション"""

    # ユーザーを作成
    email = f"paging_searcher_{int(time.time())}@example.com"
    client.post(
        "/api/auth/signup",
        json={
            "email": email,
            "password": "pass1234",
            "gender": "male",
            "display_name": "PagingSearcher",
        },
    )
    res = client.post("/api/auth/login", json={"email": email, "password": "pass1234"})
    token = res.json()["access_token"]

    # ページネーション付き検索
    headers = {"Authorization": f"Bearer {token}"}
    search_res = client.get(
        "/api/users/search", params={"limit": 5, "offset": 0}, headers=headers
    )
    assert search_res.status_code == 200, search_res.text
    search_data = search_res.json()
    assert isinstance(search_data, list)
    assert len(search_data) <= 5
