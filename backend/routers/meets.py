"""
デート予約関連のエンドポイント
予約作成、承認、QR検証
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, date, time
from typing import Optional
import math
from zoneinfo import ZoneInfo
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import (
    recalculate_rank_for_user,
    apply_noshow_penalty,
    resolve_next_rank,
    resolve_rank_by_metrics,
)
import execQuery
import secrets

router = APIRouter(prefix="/api/meet", tags=["meets"])


class MeetRequestPayload(BaseModel):
    """デート予約ペイロード"""

    target_user_id: int  # 申込対象ユーザーID
    scheduled_date: str  # 予定日 (YYYY-MM-DD)
    scheduled_time: str  # 予定時刻 (HH:MM)
    meet_latitude: Optional[float] = None  # 待ち合わせ緯度（未指定時は既定値）
    meet_longitude: Optional[float] = None  # 待ち合わせ経度（未指定時は既定値）


class MeetRequestResponse(BaseModel):
    """デート予約レスポンス"""

    request_id: int  # デート予約ID
    status: str  # 'pending', 'accepted', 'rejected'
    message: str  # 画面表示用メッセージ


class MeetDecisionResponse(BaseModel):
    """デート予約への応答レスポンス"""

    request_id: int  # デート予約ID
    status: str  # 'accepted', 'rejected'
    message: str  # 画面表示用メッセージ


class MeetRequestStatusResponse(BaseModel):
    """直近デート予約状態レスポンス"""

    exists: bool  # 直近デート予約が存在するか
    request_id: Optional[int] = None  # デート予約ID
    status: Optional[str] = (
        None  # 'pending', 'accepted', 'rejected', 'completed', 'cancelled', 'reported'
    )
    scheduled_date: Optional[str] = None  # 予定日 (YYYY-MM-DD)
    scheduled_time: Optional[str] = None  # 予定時刻 (HH:MM:SS)


class MeetBetweenUsersResponse(BaseModel):
    """2ユーザー間の直近デート予約状態レスポンス"""

    exists: bool  # 直近デート予約が存在するか
    request_id: Optional[int] = None  # デート予約ID
    status: Optional[str] = (
        None  # 'pending', 'accepted', 'rejected', 'completed', 'cancelled', 'reported'
    )
    role: Optional[str] = None  # 'sender'（申込側）or 'receiver'（受信側）
    scheduled_date: Optional[str] = None  # 予定日 (YYYY-MM-DD)
    scheduled_time: Optional[str] = None  # 予定時刻 (HH:MM:SS)
    meet_latitude: Optional[float] = None  # 待ち合わせ緯度
    meet_longitude: Optional[float] = None  # 待ち合わせ経度


class IncomingMeetRequestItem(BaseModel):
    """受信デート予約一覧アイテム"""

    request_id: int  # デート予約ID
    from_user_id: int  # 申込ユーザーID
    from_display_name: str  # 申込ユーザー表示名
    scheduled_date: str  # 予定日 (YYYY-MM-DD)
    scheduled_time: str  # 予定時刻 (HH:MM:SS)
    status: str  # 'pending', 'accepted', 'rejected'


class MeetReviewPayload(BaseModel):
    """デートレビュー投稿ペイロード"""

    rating: int  # 1-5
    comment: str  # コメント本文


class MeetReviewStatusResponse(BaseModel):
    """デートレビュー状態レスポンス"""

    meet_request_id: int  # デート予約ID
    can_review: bool  # レビュー投稿可能か
    reviewed: bool  # 既に投稿済みか
    target_user_id: Optional[int] = None  # レビュー対象ユーザーID


class MeetReviewSubmitResponse(BaseModel):
    """デートレビュー投稿レスポンス"""

    status: str  # 'submitted'
    review_id: int  # レビューID
    message: str  # 画面表示用メッセージ


class QRVerifyPayload(BaseModel):
    """QR検証ペイロード"""

    request_id: int  # デート予約ID
    token: str  # QRトークン文字列
    latitude: Optional[float] = None  # 緯度（任意）
    longitude: Optional[float] = None  # 経度（任意）
    accuracy_meters: Optional[float] = None  # 位置精度（m, 任意）


class MeetTroubleActionPayload(BaseModel):
    """デートトラブル対応ペイロード"""

    action: str  # 'cancel_agreed'（合意キャンセル）, 'report_noshow'（ドタキャン報告）


class MeetTroubleActionResponse(BaseModel):
    """デートトラブル対応レスポンス"""

    request_id: int  # デート予約ID
    status: str  # 'cancelled', 'reported'
    message: str  # 画面表示用メッセージ


class QRVerifyResponse(BaseModel):
    """QR検証レスポンス"""

    status: str  # 'verified'
    completed_meet_id: int  # 完了レコードID
    meet_request_id: int  # デート予約ID
    message: str  # 画面表示用メッセージ


class QRMeetCenterResponse(BaseModel):
    """QR情報の待ち合わせ地点レスポンス"""

    latitude: float  # 待ち合わせ緯度
    longitude: float  # 待ち合わせ経度


class QRInfoResponse(BaseModel):
    """デート用QR情報レスポンス"""

    request_id: int  # デート予約ID
    status: str  # 'accepted', 'completed'
    role: str  # 'sender', 'receiver'
    qr_token: Optional[str] = None  # 表示用QRトークン（receiverはnull）
    expires_in_seconds: int  # QR残り秒数（未有効時は0）
    qr_enabled: bool  # 約束時刻到達などでQR利用可能か
    required_radius_meters: int  # 許容半径（m）
    meet_center: QRMeetCenterResponse  # 待ち合わせ地点
    already_verified: bool  # 既にQR確認済みか
    scheduled_date: Optional[str] = None  # 予定日 (YYYY-MM-DD)
    scheduled_time: Optional[str] = None  # 予定時刻 (HH:MM:SS)


# 待ち合わせ地点（暫定）: 博多駅
MEET_CENTER_LAT = 33.589886
MEET_CENTER_LON = 130.420685
MEET_ALLOWED_RADIUS_METERS = 500.0
APP_TIMEZONE = ZoneInfo("Asia/Tokyo")


def _resolve_meet_center(
    meet_latitude: Optional[float], meet_longitude: Optional[float]
) -> tuple[float, float]:
    """待ち合わせ地点を解決（未指定時は既定地点）"""
    resolved_lat = MEET_CENTER_LAT if meet_latitude is None else float(meet_latitude)
    resolved_lon = MEET_CENTER_LON if meet_longitude is None else float(meet_longitude)
    return resolved_lat, resolved_lon


def _to_meet_datetime(scheduled_date_value, scheduled_time_value) -> Optional[datetime]:
    """scheduled_date/scheduled_time を datetime に変換"""
    try:
        if isinstance(scheduled_date_value, str):
            parsed_date = date.fromisoformat(scheduled_date_value)
        else:
            parsed_date = scheduled_date_value

        if isinstance(scheduled_time_value, str):
            parsed_time = time.fromisoformat(scheduled_time_value)
        else:
            parsed_time = scheduled_time_value

        if not isinstance(parsed_date, date) or not isinstance(parsed_time, time):
            return None

        return datetime.combine(parsed_date, parsed_time)
    except Exception:
        return None


def _is_qr_available_now(scheduled_date_value, scheduled_time_value) -> bool:
    meet_at = _to_meet_datetime(scheduled_date_value, scheduled_time_value)
    if not meet_at:
        return False
    # scheduled_date/scheduled_time are entered as Japan local wall-clock time.
    return datetime.now(APP_TIMEZONE).replace(tzinfo=None) >= meet_at


def _distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """2点間距離（m）を計算"""
    earth_radius = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return earth_radius * c


def _is_within_meet_area(latitude: float, longitude: float) -> bool:
    """待ち合わせ地点の半径内か判定"""
    distance = _distance_meters(latitude, longitude, MEET_CENTER_LAT, MEET_CENTER_LON)
    return distance <= MEET_ALLOWED_RADIUS_METERS


def _resolve_allowed_radius(accuracy_meters: Optional[float]) -> float:
    """GPS誤差を加味した許容半径を算出（最大+100mまで拡張）"""
    if accuracy_meters is None or accuracy_meters < 0:
        return MEET_ALLOWED_RADIUS_METERS
    extra = min(100.0, accuracy_meters)
    return MEET_ALLOWED_RADIUS_METERS + extra


def _area_check_result(
    latitude: float,
    longitude: float,
    accuracy_meters: Optional[float],
    meet_center_lat: Optional[float] = None,
    meet_center_lon: Optional[float] = None,
) -> tuple[bool, float, float]:
    """エリア判定結果（通過可否, 実距離m, 許容半径m）"""
    resolved_lat, resolved_lon = _resolve_meet_center(meet_center_lat, meet_center_lon)
    distance = _distance_meters(latitude, longitude, resolved_lat, resolved_lon)
    allowed_radius = _resolve_allowed_radius(accuracy_meters)
    return distance <= allowed_radius, distance, allowed_radius


def _issue_qr_token() -> str:
    """30秒有効のワンタイムQRトークンを発行"""
    issued_at_unix = int(datetime.now().timestamp())
    return f"{secrets.token_urlsafe(16)}.{issued_at_unix}"


def _parse_qr_issued_at(token: Optional[str]) -> Optional[datetime]:
    """QRトークン末尾のUNIX時刻を抽出して発行時刻に変換"""
    if not token or "." not in token:
        return None
    try:
        ts = int(token.rsplit(".", 1)[1])
        return datetime.fromtimestamp(ts)
    except Exception:
        return None


def _get_qr_remaining_seconds(token: Optional[str]) -> int:
    issued_at = _parse_qr_issued_at(token)
    if not issued_at:
        return 0
    elapsed = int((datetime.now() - issued_at).total_seconds())
    return max(0, 30 - elapsed)


def _resolve_next_rank(
    current_rank: int,
    reply_rate: float,
    meets_count: int,
    review_avg: float,
    manner_points: int,
) -> int:
    """会った回数・返信率・レビュー平均・マナー点から次ランクを算出（自動昇格のみ）"""
    resolved_rank = _resolve_rank_by_metrics(
        reply_rate=reply_rate,
        meets_count=meets_count,
        review_avg=review_avg,
        manner_points=manner_points,
    )

    # 既存ランクを下げず、満たした上限へ昇格
    return max(current_rank, resolved_rank)


def _resolve_rank_by_metrics(
    reply_rate: float,
    meets_count: int,
    review_avg: float,
    manner_points: int,
) -> int:
    """utils.rank.resolve_rank_by_metrics への委譲ラッパー"""
    return resolve_rank_by_metrics(
        reply_rate=reply_rate,
        meets_count=meets_count,
        review_avg=review_avg,
        manner_points=manner_points,
    )


def _increment_meets_and_update_rank(user_id: int, partner_id: int, db: Session) -> None:
    """デート完了時に会った回数を加算し、ランクを再計算
    同じ相手との過去の会った回数に応じてmeets_countの加算を制御:
      初回(0回目): +1 (100%)
      2回目(1回):  +0.1 (10%)
      3回目以降:   +0 (0%)
    """
    # 過去にこの相手と何回会ったか（今回完了分は除く）
    past_count_query = """
        SELECT COUNT(*) AS cnt
        FROM completed_meets
        JOIN meet_requests ON completed_meets.meet_request_id = meet_requests.id
        WHERE (meet_requests.from_user_id = ? AND meet_requests.to_user_id = ?)
           OR (meet_requests.from_user_id = ? AND meet_requests.to_user_id = ?)
    """
    past_rows = execQuery.execute_select(
        past_count_query, [user_id, partner_id, partner_id, user_id], db
    )
    # completed_meetsへのINSERT後に呼ばれるので、今回の1件が含まれている
    past_count = int((past_rows[0]["cnt"] if past_rows else 1)) - 1  # 今回分を引く

    if past_count == 0:
        meets_increment = 1.0  # 初回: 100%
    elif past_count == 1:
        meets_increment = 0.1  # 2回目: 10%
    else:
        meets_increment = 0.0  # 3回目以降: 0%

    rank_query = """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rank_rows = execQuery.execute_select(rank_query, [user_id], db)
    if not rank_rows:
        return

    rank_row = rank_rows[0]
    current_rank = int(rank_row.get("current_rank") or 1)
    meets_count = float(rank_row.get("meets_count") or 0) + meets_increment
    meets_count_int = int(meets_count)  # ランク判定・保存はINT
    reply_rate = float(rank_row.get("reply_rate") or 0.0)
    review_avg = float(rank_row.get("review_avg") or 0.0)
    manner_points = int(rank_row.get("manner_points") or 0)

    next_rank = _resolve_next_rank(
        current_rank=current_rank,
        reply_rate=reply_rate,
        meets_count=meets_count_int,
        review_avg=review_avg,
        manner_points=manner_points,
    )

    update_rank_query = """
        UPDATE user_ranks
        SET meets_count = ?,
            current_rank = ?,
            last_rank_update = NOW()
        WHERE user_id = ?
    """
    execQuery.execute_update(update_rank_query, [meets_count_int, next_rank, user_id], db)


def _recalculate_rank_for_user(
    user_id: int,
    db: Session,
    review_avg: Optional[float] = None,
    manner_points: Optional[int] = None,
) -> None:
    """utils.rank.recalculate_rank_for_user への委譲ラッパー"""
    recalculate_rank_for_user(user_id, db, review_avg=review_avg, manner_points=manner_points)


def _apply_noshow_penalty(user_id: int, db: Session, penalty_points: int = 10) -> None:
    """utils.rank.apply_noshow_penalty への委譲ラッパー"""
    apply_noshow_penalty(user_id, db, penalty_points=penalty_points)


@router.post("/request", response_model=MeetRequestResponse)
def request_meet(
    payload: MeetRequestPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    デート予約 (🔴P1-31)
    """

    # ターゲットユーザー存在確認
    check_query = """
        SELECT * FROM users WHERE id = ?
    """
    check_map = [payload.target_user_id]
    results = execQuery.execute_select(check_query, check_map, db)

    if not results:
        raise HTTPException(status_code=404, detail="Target user not found")

    # 未完了の既存申込をチェック（同一ペア）
    existing_query = """
        SELECT id, status
        FROM meet_requests
        WHERE (
            (from_user_id = ? AND to_user_id = ?)
            OR (from_user_id = ? AND to_user_id = ?)
        )
          AND status IN ('pending', 'accepted')
        ORDER BY created_at DESC
        LIMIT 1
    """
    existing_params = [
        current_user["id"],
        payload.target_user_id,
        payload.target_user_id,
        current_user["id"],
    ]
    existing_rows = execQuery.execute_select(existing_query, existing_params, db)
    if existing_rows:
        raise HTTPException(status_code=400, detail="Active meet request already exists")

    request_meet_lat, request_meet_lon = _resolve_meet_center(
        payload.meet_latitude, payload.meet_longitude
    )

    # デート予約作成
    insert_query = """
        INSERT INTO meet_requests (
            from_user_id,
            to_user_id,
            scheduled_date,
            scheduled_time,
            status,
            meet_latitude,
            meet_longitude,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        RETURNING id
    """
    insert_map = [
        current_user["id"],
        payload.target_user_id,
        payload.scheduled_date,
        payload.scheduled_time,
        "pending",
        request_meet_lat,
        request_meet_lon,
    ]
    request_id = execQuery.execute_insert(insert_query, insert_map, db)

    # 通知作成
    notification_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    notification_map = [
        payload.target_user_id,
        current_user["id"],
        "デート予約のリクエストが届きました",
        "meet_request",
        False,
    ]
    execQuery.execute_insert(notification_query, notification_map, db)

    return MeetRequestResponse(
        request_id=request_id,
        status="pending",
        message="デート申込を送信しました",
    )


@router.get("/request/status/{target_user_id}", response_model=MeetRequestStatusResponse)
def get_meet_request_status(
    target_user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    直近デート予約の状態取得
    """

    query = """
        SELECT id, status, scheduled_date, scheduled_time
        FROM meet_requests
        WHERE from_user_id = ?
          AND to_user_id = ?
        ORDER BY created_at DESC
        LIMIT 1
    """
    map_params = [current_user["id"], target_user_id]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        return {"exists": False}

    row = results[0]
    return {
        "exists": True,
        "request_id": row["id"],
        "status": row["status"],
        "scheduled_date": str(row["scheduled_date"]) if row.get("scheduled_date") else None,
        "scheduled_time": str(row["scheduled_time"]) if row.get("scheduled_time") else None,
    }


@router.get("/between/{target_user_id}", response_model=MeetBetweenUsersResponse)
def get_meet_between_users(
    target_user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    2ユーザー間の直近デート予約状態取得
    """

    query = """
        SELECT id, from_user_id, to_user_id, status, scheduled_date, scheduled_time, meet_latitude, meet_longitude
        FROM meet_requests
        WHERE (from_user_id = ? AND to_user_id = ?)
           OR (from_user_id = ? AND to_user_id = ?)
        ORDER BY created_at DESC
        LIMIT 1
    """
    map_params = [
        current_user["id"],
        target_user_id,
        target_user_id,
        current_user["id"],
    ]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        return {"exists": False}

    row = results[0]
    is_sender = row["from_user_id"] == current_user["id"]

    return {
        "exists": True,
        "request_id": row["id"],
        "status": row["status"],
        "role": "sender" if is_sender else "receiver",
        "scheduled_date": str(row["scheduled_date"]) if row.get("scheduled_date") else None,
        "scheduled_time": str(row["scheduled_time"]) if row.get("scheduled_time") else None,
        "meet_latitude": (
            float(row["meet_latitude"]) if row.get("meet_latitude") is not None else None
        ),
        "meet_longitude": (
            float(row["meet_longitude"]) if row.get("meet_longitude") is not None else None
        ),
    }


@router.get("/incoming", response_model=list[IncomingMeetRequestItem])
def get_incoming_meet_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    自分宛のデート予約一覧取得
    """

    query = """
        SELECT
            mr.id AS request_id,
            mr.from_user_id,
            COALESCE(up.display_name, 'Unknown') AS from_display_name,
            mr.scheduled_date,
            mr.scheduled_time,
            mr.status
        FROM meet_requests mr
        LEFT JOIN user_profiles up ON up.user_id = mr.from_user_id
        WHERE mr.to_user_id = ?
        ORDER BY mr.created_at DESC
        LIMIT 30
    """
    map_params = [current_user["id"]]
    rows = execQuery.execute_select(query, map_params, db)

    return [
        {
            "request_id": row["request_id"],
            "from_user_id": row["from_user_id"],
            "from_display_name": row["from_display_name"],
            "scheduled_date": str(row["scheduled_date"]),
            "scheduled_time": str(row["scheduled_time"]),
            "status": row["status"],
        }
        for row in rows
    ]


@router.post("/accept/{request_id}", response_model=MeetDecisionResponse)
def accept_meet(
    request_id: int, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    デート予約承認 (🔴P1-32)
    QRトークン発行
    """

    # リクエスト取得
    query = """
        SELECT * FROM meet_requests WHERE id = ?
    """
    map_params = [request_id]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        raise HTTPException(status_code=404, detail="Meet request not found")

    row = results[0]
    to_user_id = row["to_user_id"]

    if to_user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # QRトークン生成
    qr_token_a = _issue_qr_token()
    qr_token_b = _issue_qr_token()

    # 承認とトークン保存
    update_query = """
        UPDATE meet_requests
        SET status = ?, qr_token_a = ?, qr_token_b = ?
        WHERE id = ?
    """
    update_map = ["accepted", qr_token_a, qr_token_b, request_id]
    execQuery.execute_update(update_query, update_map, db)

    notify_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    notify_map = [
        row["from_user_id"],
        current_user["id"],
        "デート予約が承諾されました",
        "meet_accepted",
        False,
    ]
    execQuery.execute_insert(notify_query, notify_map, db)

    return {
        "request_id": request_id,
        "status": "accepted",
        "message": "デート申込を承諾しました",
        "qr_token_a": qr_token_a,
        "qr_token_b": qr_token_b,
    }


@router.post("/reject/{request_id}", response_model=MeetDecisionResponse)
def reject_meet(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    デート予約却下
    """

    query = """
        SELECT * FROM meet_requests WHERE id = ?
    """
    map_params = [request_id]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        raise HTTPException(status_code=404, detail="Meet request not found")

    row = results[0]
    if row["to_user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    if row["status"] != "pending":
        raise HTTPException(status_code=400, detail="Meet request is not pending")

    update_query = """
        UPDATE meet_requests
        SET status = ?
        WHERE id = ?
    """
    execQuery.execute_update(update_query, ["rejected", request_id], db)

    notify_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    notify_map = [
        row["from_user_id"],
        current_user["id"],
        "デート予約が却下されました",
        "meet_rejected",
        False,
    ]
    execQuery.execute_insert(notify_query, notify_map, db)

    return {
        "request_id": request_id,
        "status": "rejected",
        "message": "デート申込を却下しました",
    }


@router.post("/verify", response_model=QRVerifyResponse)
def verify_qr(
    payload: QRVerifyPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    QR検証 (🔴P1-33)
    デート完了確認
    """
    request_id = payload.request_id
    token = payload.token

    # 対象デート取得
    meet_query = """
        SELECT
            id,
            from_user_id,
            to_user_id,
            status,
            qr_token_a,
            qr_scanned_at,
            scheduled_date,
            scheduled_time,
            meet_latitude,
            meet_longitude
        FROM meet_requests
        WHERE id = ?
    """
    meet_rows = execQuery.execute_select(meet_query, [request_id], db)
    if not meet_rows:
        raise HTTPException(status_code=404, detail="Meet request not found")

    meet = meet_rows[0]

    # 受信者のみ検証可能
    if meet["to_user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only receiver can verify QR")

    if meet["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Meet request is not accepted")

    if not _is_qr_available_now(meet.get("scheduled_date"), meet.get("scheduled_time")):
        raise HTTPException(status_code=400, detail="QR is not active yet")

    if payload.latitude is None or payload.longitude is None:
        raise HTTPException(status_code=400, detail="Location is required")

    in_area, distance_meters, allowed_radius_meters = _area_check_result(
        payload.latitude,
        payload.longitude,
        payload.accuracy_meters,
        meet.get("meet_latitude"),
        meet.get("meet_longitude"),
    )
    if not in_area:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "Outside allowed area",
                "distance_meters": int(distance_meters),
                "allowed_radius_meters": int(allowed_radius_meters),
            },
        )

    if meet.get("qr_scanned_at") is not None:
        raise HTTPException(status_code=400, detail="QR already verified")

    # 発行QRトークン一致確認
    if meet.get("qr_token_a") != token:
        raise HTTPException(status_code=404, detail="Invalid QR token")

    remaining_seconds = _get_qr_remaining_seconds(token)
    if remaining_seconds <= 0:
        raise HTTPException(status_code=400, detail="QR token expired")

    # スキャン済みマーク + 完了更新
    update_query = """
        UPDATE meet_requests
        SET qr_scanned_at = NOW(),
            status = 'completed'
        WHERE id = ?
    """
    execQuery.execute_update(update_query, [request_id], db)

    # completed_meets が未作成なら作成
    check_complete_query = """
        SELECT id
        FROM completed_meets
        WHERE meet_request_id = ?
        LIMIT 1
    """
    completed_rows = execQuery.execute_select(check_complete_query, [request_id], db)
    if completed_rows:
        completed_id = completed_rows[0]["id"]
    else:
        complete_query = """
            INSERT INTO completed_meets (meet_request_id, completed_at)
            VALUES (?, NOW())
            RETURNING id
        """
        completed_id = execQuery.execute_insert(complete_query, [request_id], db)

    # 双方の会った回数 +1 とランク再計算
    _increment_meets_and_update_rank(meet["from_user_id"], meet["to_user_id"], db)
    _increment_meets_and_update_rank(meet["to_user_id"], meet["from_user_id"], db)

    # 双方へ完了通知
    notify_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    execQuery.execute_insert(
        notify_query,
        [
            meet["from_user_id"],
            meet["to_user_id"],
            "デートのQR確認が完了しました",
            "meet_completed",
            False,
        ],
        db,
    )
    execQuery.execute_insert(
        notify_query,
        [
            meet["to_user_id"],
            meet["from_user_id"],
            "デートのQR確認が完了しました",
            "meet_completed",
            False,
        ],
        db,
    )

    return {
        "status": "verified",
        "completed_meet_id": completed_id,
        "meet_request_id": request_id,
        "message": "デートのQR確認が完了しました",
    }


@router.get("/{request_id}/qr", response_model=QRInfoResponse)
def get_qr_for_meet(
    request_id: int,
    refresh: bool = Query(False),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
    accuracy_meters: Optional[float] = Query(None),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    デート用QR情報取得
    - sender: 自分が提示するQRトークンを取得
    - receiver: 検証入力画面用の状態のみ取得
    """

    query = """
        SELECT
            id,
            from_user_id,
            to_user_id,
            status,
            qr_token_a,
            qr_scanned_at,
            scheduled_date,
            scheduled_time,
            meet_latitude,
            meet_longitude
        FROM meet_requests
        WHERE id = ?
    """
    map_params = [request_id]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        raise HTTPException(status_code=404, detail="Meet request not found")

    meet = results[0]
    if current_user["id"] not in (meet["from_user_id"], meet["to_user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    role = "sender" if current_user["id"] == meet["from_user_id"] else "receiver"

    if meet["status"] not in ("accepted", "completed"):
        raise HTTPException(status_code=400, detail="Meet request is not accepted")

    if role == "sender" and meet["status"] == "accepted":
        if latitude is None or longitude is None:
            raise HTTPException(status_code=400, detail="Location is required")
        in_area, distance_meters, allowed_radius_meters = _area_check_result(
            latitude,
            longitude,
            accuracy_meters,
            meet.get("meet_latitude"),
            meet.get("meet_longitude"),
        )
        if not in_area:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "Outside allowed area",
                    "distance_meters": int(distance_meters),
                    "allowed_radius_meters": int(allowed_radius_meters),
                },
            )

    qr_enabled_now = _is_qr_available_now(meet.get("scheduled_date"), meet.get("scheduled_time"))

    # 旧データ互換: accepted だがトークン未発行の場合は自動発行
    # ただし、約束時刻より前は発行しない
    qr_token = meet.get("qr_token_a")
    remaining_seconds = _get_qr_remaining_seconds(qr_token)
    token_needs_issue = (
        meet["status"] == "accepted"
        and qr_enabled_now
        and (not qr_token or remaining_seconds <= 0 or (refresh and role == "sender"))
    )

    if token_needs_issue:
        qr_token_a = _issue_qr_token()
        qr_token_b = _issue_qr_token()
        issue_query = """
            UPDATE meet_requests
            SET qr_token_a = ?, qr_token_b = ?
            WHERE id = ?
        """
        execQuery.execute_update(issue_query, [qr_token_a, qr_token_b, request_id], db)
        meet["qr_token_a"] = qr_token_a
        remaining_seconds = _get_qr_remaining_seconds(qr_token_a)
    else:
        remaining_seconds = _get_qr_remaining_seconds(meet.get("qr_token_a"))

    resolved_center_lat, resolved_center_lon = _resolve_meet_center(
        meet.get("meet_latitude"),
        meet.get("meet_longitude"),
    )

    return {
        "request_id": meet["id"],
        "status": meet["status"],
        "role": role,
        "qr_token": meet["qr_token_a"] if role == "sender" and qr_enabled_now else None,
        "expires_in_seconds": remaining_seconds,
        "qr_enabled": qr_enabled_now,
        "required_radius_meters": int(MEET_ALLOWED_RADIUS_METERS),
        "meet_center": {
            "latitude": resolved_center_lat,
            "longitude": resolved_center_lon,
        },
        "already_verified": meet.get("qr_scanned_at") is not None,
        "scheduled_date": str(meet["scheduled_date"]) if meet.get("scheduled_date") else None,
        "scheduled_time": str(meet["scheduled_time"]) if meet.get("scheduled_time") else None,
    }


@router.post("/{request_id}/trouble", response_model=MeetTroubleActionResponse)
def handle_meet_trouble_action(
    request_id: int,
    payload: MeetTroubleActionPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """デートトラブル対応（合意キャンセル / ドタキャン報告）"""

    query = """
        SELECT id, from_user_id, to_user_id, status, qr_scanned_at
        FROM meet_requests
        WHERE id = ?
        LIMIT 1
    """
    rows = execQuery.execute_select(query, [request_id], db)
    if not rows:
        raise HTTPException(status_code=404, detail="Meet request not found")

    meet = rows[0]
    if current_user["id"] not in (meet["from_user_id"], meet["to_user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    if meet.get("qr_scanned_at") is not None or meet["status"] == "completed":
        raise HTTPException(status_code=400, detail="Meet already completed")

    if meet["status"] not in ("accepted", "pending"):
        raise HTTPException(status_code=400, detail="Meet request is not active")

    if payload.action not in ("cancel_agreed", "report_noshow"):
        raise HTTPException(status_code=400, detail="Invalid trouble action")

    next_status = "cancelled" if payload.action == "cancel_agreed" else "reported"
    update_query = """
        UPDATE meet_requests
        SET status = ?
        WHERE id = ?
    """
    execQuery.execute_update(update_query, [next_status, request_id], db)

    other_user_id = (
        meet["to_user_id"] if current_user["id"] == meet["from_user_id"] else meet["from_user_id"]
    )
    notify_content = (
        "デート予定は双方合意でキャンセルされました"
        if payload.action == "cancel_agreed"
        else "相手からドタキャン報告がありました"
    )
    notify_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    execQuery.execute_insert(
        notify_query,
        [other_user_id, current_user["id"], notify_content, "meet_trouble", False],
        db,
    )

    if payload.action == "report_noshow":
        _apply_noshow_penalty(other_user_id, db)
        execQuery.execute_insert(
            notify_query,
            [
                other_user_id,
                current_user["id"],
                "ドタキャン報告によりマナー点が減点されました",
                "rank_penalty",
                False,
            ],
            db,
        )

    return {
        "request_id": request_id,
        "status": next_status,
        "message": (
            "デートを合意キャンセルしました"
            if payload.action == "cancel_agreed"
            else "ドタキャン報告を送信しました"
        ),
    }


@router.get("/{meet_request_id}/review/status", response_model=MeetReviewStatusResponse)
def get_review_status_from_meet(
    meet_request_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """デートIDベースのレビュー投稿状態取得"""

    meet_query = """
        SELECT from_user_id, to_user_id, status
        FROM meet_requests
        WHERE id = ?
    """
    meet_rows = execQuery.execute_select(meet_query, [meet_request_id], db)
    if not meet_rows:
        raise HTTPException(status_code=404, detail="Meet request not found")

    meet = meet_rows[0]
    if current_user["id"] not in (meet["from_user_id"], meet["to_user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    target_user_id = (
        meet["to_user_id"] if meet["from_user_id"] == current_user["id"] else meet["from_user_id"]
    )

    can_review = meet["status"] == "completed"
    if not can_review:
        return {
            "meet_request_id": meet_request_id,
            "can_review": False,
            "reviewed": False,
            "target_user_id": target_user_id,
        }

    check_query = """
        SELECT id
        FROM reviews
        WHERE reviewer_id = ? AND meet_request_id = ?
        LIMIT 1
    """
    reviewed_rows = execQuery.execute_select(check_query, [current_user["id"], meet_request_id], db)

    return {
        "meet_request_id": meet_request_id,
        "can_review": True,
        "reviewed": len(reviewed_rows) > 0,
        "target_user_id": target_user_id,
    }


@router.post("/{meet_request_id}/review", response_model=MeetReviewSubmitResponse)
def submit_review_from_meet(
    meet_request_id: int,
    payload: MeetReviewPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    デートIDベースのレビュー投稿
    """

    meet_query = """
        SELECT from_user_id, to_user_id, status
        FROM meet_requests
        WHERE id = ?
    """
    meet_rows = execQuery.execute_select(meet_query, [meet_request_id], db)
    if not meet_rows:
        raise HTTPException(status_code=404, detail="Meet request not found")

    meet = meet_rows[0]
    if current_user["id"] not in (meet["from_user_id"], meet["to_user_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    if meet["status"] != "completed":
        raise HTTPException(status_code=400, detail="Meet is not reviewable")

    target_user_id = (
        meet["to_user_id"] if meet["from_user_id"] == current_user["id"] else meet["from_user_id"]
    )

    check_query = """
        SELECT id
        FROM reviews
        WHERE reviewer_id = ? AND meet_request_id = ?
    """
    already = execQuery.execute_select(check_query, [current_user["id"], meet_request_id], db)
    if already:
        raise HTTPException(status_code=400, detail="Review already submitted")

    insert_query = """
        INSERT INTO reviews (meet_request_id, reviewer_id, reviewed_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        RETURNING id
    """
    review_id = execQuery.execute_insert(
        insert_query,
        [meet_request_id, current_user["id"], target_user_id, payload.rating, payload.comment],
        db,
    )

    avg_query = """
        SELECT AVG(rating) AS avg_rating
        FROM reviews
        WHERE reviewed_id = ?
    """
    avg_rows = execQuery.execute_select(avg_query, [target_user_id], db)
    avg_rating = float(avg_rows[0]["avg_rating"]) if avg_rows and avg_rows[0]["avg_rating"] else 0.0

    _recalculate_rank_for_user(target_user_id, db, review_avg=avg_rating)

    notify_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    execQuery.execute_insert(
        notify_query,
        [target_user_id, current_user["id"], "レビューが投稿されました", "review", False],
        db,
    )

    return {
        "status": "submitted",
        "review_id": review_id,
        "message": "レビューを投稿しました",
    }
