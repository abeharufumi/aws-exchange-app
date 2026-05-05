"""
ユーザー関連のエンドポイント
検索、発見、プロフィール取得
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Any, List, Optional
from datetime import datetime
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/users", tags=["users"])


LOCATION_KEYWORD_ALIASES = {
    "東京": ["Tokyo"],
    "大阪": ["Osaka"],
    "京都": ["Kyoto"],
    "福岡": ["Fukuoka", "Hakata"],
    "名古屋": ["Nagoya"],
    "渋谷": ["Shibuya"],
    "新宿": ["Shinjuku"],
    "横浜": ["Yokohama"],
    "博多": ["Hakata", "Fukuoka"],
    "Tokyo": ["東京"],
    "Osaka": ["大阪"],
    "Kyoto": ["京都"],
    "Fukuoka": ["福岡", "博多"],
    "Nagoya": ["名古屋"],
    "Shibuya": ["渋谷"],
    "Shinjuku": ["新宿"],
    "Yokohama": ["横浜"],
    "Hakata": ["博多", "福岡"],
}

PRESENCE_ONLINE_THRESHOLD_MINUTES = 5


def _boost_active_clause(user_alias: str = "users") -> str:
    return f"""
        EXISTS (
            SELECT 1
            FROM boost_purchases bp
            WHERE bp.user_id = {user_alias}.id
              AND bp.payment_status = 'completed'
              AND bp.activated_at IS NOT NULL
              AND (bp.expires_at IS NULL OR bp.expires_at > NOW())
        )
    """


def _premium_active_clause(user_alias: str = "users") -> str:
    return f"""
        EXISTS (
            SELECT 1
            FROM premium_subscriptions ps
            WHERE ps.user_id = {user_alias}.id
              AND ps.status = 'active'
              AND (ps.ends_at IS NULL OR ps.ends_at > NOW())
        )
    """


def _presence_status_case(user_alias: str = "users") -> str:
    return f"""
        CASE
            WHEN {user_alias}.presence_status = 'logged_out' THEN 'logged_out'
            WHEN {user_alias}.last_active_at IS NOT NULL
                 AND {user_alias}.last_active_at >= NOW() - INTERVAL '{PRESENCE_ONLINE_THRESHOLD_MINUTES} minutes'
                THEN 'online'
            ELSE 'offline'
        END
    """


def _activity_order_clause(user_alias: str = "users") -> str:
    return f"""
        CASE
            WHEN {_presence_status_case(user_alias)} = 'online' THEN 0
            WHEN {_presence_status_case(user_alias)} = 'offline' THEN 1
            ELSE 2
        END ASC,
        COALESCE({user_alias}.last_active_at, {user_alias}.last_login, {user_alias}.created_at) DESC,
        {user_alias}.id DESC
    """


def _resolve_target_gender(current_gender: str) -> str:
    """検索対象性別を解決（male→female, それ以外→male）"""
    return "female" if current_gender == "male" else "male"


def _resolve_search_filter_policy(user_id: int, db: Session) -> tuple[int, bool, bool]:
    """検索フィルタ解放ポリシーを解決
    - Rank1: 年齢・ランク絞り込み不可
    - Rank2: 年齢絞り込みのみ可
    - Rank3以上: 年齢・ランク絞り込み可
    """
    query = """
        SELECT current_rank
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rows = execQuery.execute_select(query, [user_id], db)
    current_rank = int(rows[0]["current_rank"]) if rows else 1
    can_use_age_filter = current_rank >= 2
    can_use_rank_filter = current_rank >= 3
    return current_rank, can_use_age_filter, can_use_rank_filter


def _expand_location_keywords(keyword: str) -> List[str]:
    normalized = keyword.strip()
    if normalized == "":
        return []

    values = [normalized]
    for alias in LOCATION_KEYWORD_ALIASES.get(normalized, []):
        if alias not in values:
            values.append(alias)
    return values


def _get_receive_filter(user_id: int, db: Session) -> dict:
    """受信フィルター設定を取得（未設定時はデフォルトを返す）"""
    query = """
        SELECT block_rank1, block_rank2, block_rank3, tribute_filter_enabled
        FROM receive_filters
        WHERE user_id = ?
        LIMIT 1
    """
    rows = execQuery.execute_select(query, [user_id], db)
    if not rows:
        return {
            "blockRank1": False,
            "blockRank2": False,
            "blockRank3": False,
            "tributeFilterEnabled": False,
        }

    row = rows[0]
    return {
        "blockRank1": bool(row.get("block_rank1")),
        "blockRank2": bool(row.get("block_rank2")),
        "blockRank3": bool(row.get("block_rank3")),
        "tributeFilterEnabled": bool(row.get("tribute_filter_enabled")),
    }


class ReceiveFilterUpdateRequest(BaseModel):
    """受信フィルター更新リクエスト"""

    blockRank1: bool  # Rank1ユーザーからの受信をブロックするか
    blockRank2: bool  # Rank2ユーザーからの受信をブロックするか
    blockRank3: bool  # Rank3ユーザーからの受信をブロックするか
    tributeFilterEnabled: bool  # 貢ぎフィルターを有効化するか（true/false）


class ReceiveFilterResponse(BaseModel):
    """受信フィルターレスポンス"""

    blockRank1: bool  # Rank1ユーザーからの受信ブロック設定
    blockRank2: bool  # Rank2ユーザーからの受信ブロック設定
    blockRank3: bool  # Rank3ユーザーからの受信ブロック設定
    tributeFilterEnabled: bool  # 貢ぎフィルター有効状態


class UserCardResponse(BaseModel):
    """ユーザーカードレスポンス"""

    id: int  # ユーザーID
    displayName: str  # 表示名
    age: Optional[int] = None  # 年齢
    location: Optional[str] = None  # 居住地
    bio: Optional[str] = None  # 自己紹介
    rank: Optional[int] = None  # ランク
    reviewAvg: Optional[float] = None  # レビュー平均
    requestStatus: Optional[str] = (
        None  # 自分からこのユーザーへの依頼状態: 'pending'/'matched'/'passed'/'expired'
    )
    requestCreatedAt: Optional[datetime] = None  # 依頼作成日時（期限表示用）
    isPremiumActive: Optional[bool] = None  # Premium有効中か（true/false）
    isBoostActive: Optional[bool] = None  # Boost有効中か（true/false）
    onlineStatus: Optional[str] = None  # オンライン状態: 'online'/'offline'/'logged_out'
    lastActiveAt: Optional[datetime] = None  # 最終アクティブ日時
    lastLogoutAt: Optional[datetime] = None  # 最終ログアウト日時


class ProfileUpdateRequest(BaseModel):
    """プロフィール更新リクエスト"""

    displayName: Optional[str] = None  # 表示名
    age: Optional[int] = None  # 年齢
    location: Optional[str] = None  # 居住地
    bio: Optional[str] = None  # 自己紹介
    avatarUrl: Optional[str] = None  # アバター画像URL


@router.get("/discover", response_model=List[UserCardResponse])
def discover_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ユーザー発見（タイムラインスワイプ用） (🔴P1-07)
    全ユーザーを取得（地域・フィルター条件なし）
    """
    query = f"""
                SELECT users.id,
                             user_profiles.display_name AS "displayName",
                             user_profiles.age,
                             user_profiles.location,
                             user_profiles.bio,
                             user_ranks.current_rank AS rank,
                             user_ranks.review_avg AS "reviewAvg",
                             {_premium_active_clause('users')} AS "isPremiumActive",
                             {_boost_active_clause('users')} AS "isBoostActive",
                             {_presence_status_case('users')} AS "onlineStatus",
                             COALESCE(users.last_active_at, users.last_login, users.created_at) AS "lastActiveAt",
                             users.last_logout_at AS "lastLogoutAt",
                             req.status AS "requestStatus",
                             req.created_at AS "requestCreatedAt"
                FROM users
                JOIN user_profiles ON users.id = user_profiles.user_id
                JOIN user_ranks ON users.id = user_ranks.user_id
                LEFT JOIN LATERAL (
                        SELECT mr.status,
                               mr.created_at
                        FROM matching_requests mr
                        WHERE mr.from_user_id = ?
                            AND mr.to_user_id = users.id
                        ORDER BY mr.created_at DESC
                        LIMIT 1
                ) req ON TRUE
                WHERE users.status = ?
                    AND users.id <> ?
        """
    map_params = [current_user["id"], "active", current_user["id"]]

    target_gender = _resolve_target_gender(current_user["gender"])
    query += " AND users.gender = ?"
    map_params.append(target_gender)

    # passed / matched 済みユーザーを除外（自分が from_user_id のレコードが存在しないか expired のみ）
    query += """
        AND NOT EXISTS (
            SELECT 1 FROM matching_requests excl
            WHERE excl.from_user_id = ?
              AND excl.to_user_id = users.id
              AND excl.status IN ('passed', 'matched', 'pending')
        )
    """
    map_params.append(current_user["id"])

    # 案B: Boost中 → Rank5 → Rank4 → Rank3 → Rank1-2、各順位帯の中ではアクティブユーザー順
    query += f"""
        ORDER BY
            CASE
                WHEN {_boost_active_clause('users')} THEN 0
                WHEN user_ranks.current_rank = 5 THEN 1
                WHEN user_ranks.current_rank = 4 THEN 2
                WHEN user_ranks.current_rank = 3 THEN 3
                ELSE 4
            END ASC,
            {_activity_order_clause('users')}
        LIMIT 100
    """
    return execQuery.execute_select(query, map_params, db)


@router.get("/search", response_model=List[UserCardResponse])
def search_users(
    current_user: dict = Depends(get_current_user),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    distance_km: int = Query(10),
    location_keyword: Optional[str] = Query(None, alias="locationKeyword"),
    bio_keyword: Optional[str] = Query(None, alias="bioKeyword"),
    age_min: Optional[int] = Query(None, alias="minAge"),
    age_max: Optional[int] = Query(None, alias="maxAge"),
    rank_min: Optional[int] = Query(None, alias="minRank"),
    db: Session = Depends(get_db),
):
    """
    ユーザー検索 (🔴P1-11 ~ P1-15)
    地域ベースの検索 + 年齢・ランク絞り込み
    """

    # ユーザー検索クエリ
    query = f"""
        SELECT users.id,
               user_profiles.display_name AS "displayName",
               COALESCE(user_profiles.age, 0) AS age,
               COALESCE(user_profiles.location, '') AS location,
               user_profiles.bio,
               user_ranks.current_rank AS rank,
               user_ranks.review_avg AS "reviewAvg",
               {_premium_active_clause('users')} AS "isPremiumActive",
               {_boost_active_clause('users')} AS "isBoostActive",
               {_presence_status_case('users')} AS "onlineStatus",
               COALESCE(users.last_active_at, users.last_login, users.created_at) AS "lastActiveAt",
               users.last_logout_at AS "lastLogoutAt",
                   req.status AS "requestStatus",
                   req.created_at AS "requestCreatedAt"
        FROM users
        JOIN user_profiles ON users.id = user_profiles.user_id
        JOIN user_ranks ON users.id = user_ranks.user_id
        LEFT JOIN LATERAL (
                        SELECT mr.status,
                                     mr.created_at
            FROM matching_requests mr
            WHERE mr.from_user_id = ?
              AND mr.to_user_id = users.id
            ORDER BY mr.created_at DESC
            LIMIT 1
        ) req ON TRUE
        WHERE users.status = ?
          AND users.id != ?
    """
    map_params = [current_user["id"], "active", current_user["id"]]

    target_gender = _resolve_target_gender(current_user["gender"])
    query += " AND users.gender = ?"
    map_params.append(target_gender)

    current_rank, can_use_age_filter, can_use_rank_filter = _resolve_search_filter_policy(
        current_user["id"], db
    )

    # Rank制限に応じて未解放フィルターは無効化
    if not can_use_age_filter:
        age_min = None
        age_max = None
    if not can_use_rank_filter:
        rank_min = None

    # 年齢フィルター（Rank2以上）
    if age_min is not None:
        query += " AND user_profiles.age >= ?"
        map_params.append(age_min)
    if age_max is not None:
        query += " AND user_profiles.age <= ?"
        map_params.append(age_max)

    # 地域キーワード（全ランクで利用可）
    if location_keyword is not None and location_keyword.strip() != "":
        location_keywords = _expand_location_keywords(location_keyword)
        if location_keywords:
            clauses = []
            for keyword in location_keywords:
                clauses.append("COALESCE(user_profiles.location, '') ILIKE ?")
                map_params.append(f"%{keyword}%")
            query += " AND (" + " OR ".join(clauses) + ")"

    # 自己紹介キーワード（詳細検索）
    if bio_keyword is not None and bio_keyword.strip() != "":
        query += " AND COALESCE(user_profiles.bio, '') ILIKE ?"
        map_params.append(f"%{bio_keyword.strip()}%")

    # ランクフィルター（Rank3以上）
    if rank_min is not None:
        query += " AND user_ranks.current_rank >= ?"
        map_params.append(rank_min)

    query += f"""
        ORDER BY
            CASE
                WHEN {_boost_active_clause('users')} THEN 0
                WHEN user_ranks.current_rank = 5 THEN 1
                WHEN user_ranks.current_rank = 4 THEN 2
                WHEN user_ranks.current_rank = 3 THEN 3
                ELSE 4
            END ASC,
            {_activity_order_clause('users')}
        LIMIT 50
    """

    return execQuery.execute_select(query, map_params, db)


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """自分のプロフィール取得"""

    query = """
         SELECT ? AS id,
             users.email AS "email",
             users.gender AS "gender",
             users.phone_number AS "phoneNumber",
             user_profiles.display_name AS "displayName",
             user_profiles.age AS "age",
             user_profiles.location AS "location",
             user_profiles.bio AS "bio",
             user_profiles.avatar_url AS "avatarUrl",
             user_ranks.current_rank AS "rank",
             user_ranks.meets_count AS "meetsCount",
             user_ranks.review_avg AS "reviewAvg",
             user_ranks.reply_rate AS "replyRate",
             user_ranks.manner_points AS "mannerPoints",
             icon_frames.image_url AS "iconFrameImageUrl",
             icon_frames.rarity AS "iconFrameRarity",
             icon_frames.name AS "iconFrameName"
         FROM users
         JOIN user_profiles ON users.id = user_profiles.user_id
         JOIN user_ranks ON users.id = user_ranks.user_id
         LEFT JOIN icon_frames ON icon_frames.id = user_profiles.icon_frame_id
         WHERE users.id = ?
    """
    results = execQuery.execute_select(query, [current_user["id"], current_user["id"]], db)

    if not results:
        raise HTTPException(status_code=404, detail="Profile not found")

    can_view_footprints, footprint_limit = _resolve_footprint_policy(current_user["id"], db)
    current_rank, can_use_age_filter, can_use_rank_filter = _resolve_search_filter_policy(
        current_user["id"], db
    )
    profile = results[0]
    profile["rank"] = current_rank
    profile["canViewFootprints"] = can_view_footprints
    profile["footprintViewLimit"] = footprint_limit
    profile["canUseAgeFilter"] = can_use_age_filter
    profile["canUseRankFilter"] = can_use_rank_filter

    profile["rankProgress"] = build_rank_progress(
        current_rank=current_rank,
        meets_count=int(profile.get("meetsCount") or 0),
        reply_rate=float(profile.get("replyRate") or 0),
        review_avg=float(profile.get("reviewAvg") or 0),
        manner_points=int(profile.get("mannerPoints") or 0),
    )

    receive_filter = _get_receive_filter(current_user["id"], db)
    profile["receiveFilter"] = receive_filter

    return profile


@router.patch("/me")
def update_me(
    payload: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分のプロフィール更新"""

    update_fields = []
    map_params: List[Any] = []

    if payload.displayName is not None:
        update_fields.append("display_name = ?")
        map_params.append(payload.displayName)
    if payload.age is not None:
        update_fields.append("age = ?")
        map_params.append(payload.age)
    if payload.location is not None:
        update_fields.append("location = ?")
        map_params.append(payload.location)
    if payload.bio is not None:
        update_fields.append("bio = ?")
        map_params.append(payload.bio)
    if payload.avatarUrl is not None:
        update_fields.append("avatar_url = ?")
        map_params.append(payload.avatarUrl)

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    query = f"""
        UPDATE user_profiles
        SET {', '.join(update_fields)}
        WHERE user_id = ?
    """
    map_params.append(current_user["id"])

    updated_count = execQuery.execute_update(query, map_params, db)
    if updated_count == 0:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {"status": "updated"}


@router.get("/receive-filter", response_model=ReceiveFilterResponse)
def get_receive_filter(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """受信フィルター設定を取得する"""
    return _get_receive_filter(current_user["id"], db)


@router.put("/receive-filter", response_model=ReceiveFilterResponse)
def update_receive_filter(
    payload: ReceiveFilterUpdateRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """受信フィルター設定を更新する"""

    upsert_query = """
        INSERT INTO receive_filters (
            user_id,
            block_rank1,
            block_rank2,
            block_rank3,
            tribute_filter_enabled,
            created_at,
            updated_at
        )
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        ON CONFLICT (user_id)
        DO UPDATE SET
            block_rank1 = EXCLUDED.block_rank1,
            block_rank2 = EXCLUDED.block_rank2,
            block_rank3 = EXCLUDED.block_rank3,
            tribute_filter_enabled = EXCLUDED.tribute_filter_enabled,
            updated_at = NOW()
    """
    execQuery.execute_insert(
        upsert_query,
        [
            current_user["id"],
            payload.blockRank1,
            payload.blockRank2,
            payload.blockRank3,
            payload.tributeFilterEnabled,
        ],
        db,
    )

    return _get_receive_filter(current_user["id"], db)


@router.get("/{user_id}")
def get_user_profile(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    プロフィール閲覧 (🔴P1-16)
    足跡を記録
    """
    query = f"""
        SELECT ? AS id,
             user_profiles.display_name AS "displayName",
             user_profiles.age AS "age",
             user_profiles.location AS "location",
             user_profiles.bio AS "bio",
             user_profiles.avatar_url AS "avatarUrl",
             user_ranks.current_rank AS "rank",
             user_ranks.meets_count AS "meetsCount",
             user_ranks.review_avg AS "reviewAvg",
               {_presence_status_case('users')} AS "onlineStatus",
               COALESCE(users.last_active_at, users.last_login, users.created_at) AS "lastActiveAt",
               users.last_logout_at AS "lastLogoutAt",
             icon_frames.image_url AS "iconFrameImageUrl",
             icon_frames.rarity AS "iconFrameRarity",
             icon_frames.name AS "iconFrameName"
        FROM users
        JOIN user_profiles ON users.id = user_profiles.user_id
        JOIN user_ranks ON users.id = user_ranks.user_id
        LEFT JOIN icon_frames ON icon_frames.id = user_profiles.icon_frame_id
        WHERE users.id = ?
    """
    results = execQuery.execute_select(query, [user_id, user_id], db)

    if not results:
        raise HTTPException(status_code=404, detail="User not found")

    # 足跡を記録（自分以外を閲覧した場合のみ、複数回閲覧時は viewed_at を更新）
    if current_user["id"] != user_id:
        footprint_query = """
            INSERT INTO footprints (visitor_id, visited_id, viewed_at)
            VALUES (?, ?, NOW())
            ON CONFLICT (visitor_id, visited_id)
            DO UPDATE SET viewed_at = NOW()
        """
        footprint_params = [current_user["id"], user_id]
        execQuery.execute_insert(footprint_query, footprint_params, db)

    return results[0]


class FootprintResponse(BaseModel):
    """足跡レスポンス"""

    visitorId: int  # 訪問者ID
    visitorName: str  # 訪問者名
    viewedAt: str  # 閲覧日時


def _resolve_footprint_policy(user_id: int, db: Session) -> tuple[bool, int]:
    """足あと閲覧ポリシーを解決（Rank3:3人、Rank4:10人、Rank5以上:無制限=100）"""
    query = """
        SELECT current_rank
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rows = execQuery.execute_select(query, [user_id], db)
    current_rank = int(rows[0]["current_rank"]) if rows else 1
    if current_rank >= 5:
        return True, 100
    if current_rank == 4:
        return True, 10
    if current_rank == 3:
        return True, 3
    return False, 0


@router.get("/footprints/my-footprints")
def get_my_footprints(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    自分への足跡一覧取得 (🟠P2-55)
    自分のプロフィールを閲覧した他のユーザーリスト
    """
    can_view, limit = _resolve_footprint_policy(current_user["id"], db)
    if not can_view:
        rank_rows = execQuery.execute_select(
            """
            SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
            FROM user_ranks
            WHERE user_id = ?
            LIMIT 1
            """,
            [current_user["id"]],
            db,
        )
        rank_row = rank_rows[0] if rank_rows else {}
        current_rank = int(rank_row.get("current_rank") or 1)
        rank_progress = build_rank_progress(
            current_rank=current_rank,
            meets_count=int(rank_row.get("meets_count") or 0),
            reply_rate=float(rank_row.get("reply_rate") or 0),
            review_avg=float(rank_row.get("review_avg") or 0),
            manner_points=int(rank_row.get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "足あと閲覧はRank3以上で解放されます",
                "currentRank": current_rank,
                "requiredRank": 3,
                "rankProgress": rank_progress,
            },
        )

    query = """
        SELECT footprints.visitor_id AS "visitorId",
               user_profiles.display_name AS "visitorName",
               footprints.viewed_at AS "viewedAt"
        FROM footprints
        JOIN user_profiles ON footprints.visitor_id = user_profiles.user_id
        WHERE footprints.visited_id = ?
        ORDER BY footprints.viewed_at DESC
        LIMIT ?
    """
    return execQuery.execute_select(query, [current_user["id"], limit], db)
