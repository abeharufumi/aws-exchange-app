"""
ライブ配信関連のエンドポイント
配信開始・終了・一覧・投げ銭
Rank5 ユーザーのみ配信開始可能
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/live", tags=["live-streams"])


class StartStreamPayload(BaseModel):
    """配信開始ペイロード"""

    title: str  # 配信タイトル


class LiveStreamItem(BaseModel):
    """ライブ配信アイテム"""

    id: int
    broadcaster_id: int  # 配信者ユーザーID
    broadcaster_name: str  # 配信者表示名
    title: str  # タイトル
    viewer_count: int  # 現在の視聴者数
    total_tipping_jpy: int  # 累計投げ銭額（円）
    status: str  # 'live', 'ended'
    started_at: str  # 開始日時


class TipPayload(BaseModel):
    """投げ銭ペイロード"""

    amount_jpy: int  # 投げ銭額（円）。最小100円


class TipResponse(BaseModel):
    """投げ銭レスポンス"""

    transaction_id: int  # 取引ID
    stream_id: int  # 配信ID
    amount_jpy: int  # 投げ銭額（円）
    status: str  # 'completed'


def _assert_rank5(user_id: int, db: Session) -> None:
    """Rank5でない場合は 403 を返す"""
    rows = execQuery.execute_select(
        """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
        """,
        [user_id],
        db,
    )
    rank_row = rows[0] if rows else {}
    rank = int(rank_row.get("current_rank") or 1)
    if rank < 5:
        rank_progress = build_rank_progress(
            current_rank=rank,
            meets_count=int(rank_row.get("meets_count") or 0),
            reply_rate=float(rank_row.get("reply_rate") or 0),
            review_avg=float(rank_row.get("review_avg") or 0),
            manner_points=int(rank_row.get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "ライブ配信はRank5以上のユーザーのみ利用できます",
                "currentRank": rank,
                "requiredRank": 5,
                "rankProgress": rank_progress,
            },
        )


@router.post("/start", response_model=LiveStreamItem)
def start_stream(
    payload: StartStreamPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ライブ配信を開始する（Rank5のみ）"""
    _assert_rank5(current_user["id"], db)

    # 既に配信中でないか確認
    active = execQuery.execute_select(
        "SELECT id FROM live_streams WHERE broadcaster_id = ? AND status = 'live' LIMIT 1",
        [current_user["id"]],
        db,
    )
    if active:
        raise HTTPException(status_code=400, detail="既に配信中です")

    stream_id = execQuery.execute_insert(
        """
        INSERT INTO live_streams (broadcaster_id, title, started_at, viewer_count, status, total_tipping_jpy)
        VALUES (?, ?, NOW(), 0, 'live', 0)
        RETURNING id
        """,
        [current_user["id"], payload.title],
        db,
    )

    rows = execQuery.execute_select(
        """
        SELECT ls.id, ls.broadcaster_id, up.display_name AS broadcaster_name,
               ls.title, ls.viewer_count, ls.total_tipping_jpy, ls.status,
               ls.started_at::text AS started_at
        FROM live_streams ls
        JOIN user_profiles up ON up.user_id = ls.broadcaster_id
        WHERE ls.id = ?
        """,
        [stream_id],
        db,
    )
    return LiveStreamItem(**rows[0])


@router.post("/{stream_id}/end")
def end_stream(
    stream_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ライブ配信を終了する"""
    rows = execQuery.execute_select(
        "SELECT id, broadcaster_id, status FROM live_streams WHERE id = ? LIMIT 1",
        [stream_id],
        db,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="配信が見つかりません")
    stream = rows[0]
    if stream["broadcaster_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="自分の配信のみ終了できます")
    if stream["status"] == "ended":
        raise HTTPException(status_code=400, detail="既に終了済みです")

    execQuery.execute_update(
        "UPDATE live_streams SET status = 'ended', ended_at = NOW() WHERE id = ?",
        [stream_id],
        db,
    )
    return {"stream_id": stream_id, "status": "ended"}


@router.get("", response_model=List[LiveStreamItem])
def list_live_streams(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ライブ配信中の一覧を取得"""
    rows = execQuery.execute_select(
        """
        SELECT ls.id, ls.broadcaster_id, up.display_name AS broadcaster_name,
               ls.title, ls.viewer_count, ls.total_tipping_jpy, ls.status,
               ls.started_at::text AS started_at
        FROM live_streams ls
        JOIN user_profiles up ON up.user_id = ls.broadcaster_id
        WHERE ls.status = 'live'
        ORDER BY ls.started_at DESC
        """,
        [],
        db,
    )
    return [LiveStreamItem(**r) for r in rows]


@router.get("/my-history", response_model=List[LiveStreamItem])
def my_stream_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分の配信履歴を取得"""
    rows = execQuery.execute_select(
        """
        SELECT ls.id, ls.broadcaster_id, up.display_name AS broadcaster_name,
               ls.title, ls.viewer_count, ls.total_tipping_jpy, ls.status,
               ls.started_at::text AS started_at
        FROM live_streams ls
        JOIN user_profiles up ON up.user_id = ls.broadcaster_id
        WHERE ls.broadcaster_id = ?
        ORDER BY ls.started_at DESC
        LIMIT 50
        """,
        [current_user["id"]],
        db,
    )
    return [LiveStreamItem(**r) for r in rows]


@router.get("/{stream_id}", response_model=LiveStreamItem)
def get_stream(
    stream_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """配信詳細を取得"""
    rows = execQuery.execute_select(
        """
        SELECT ls.id, ls.broadcaster_id, up.display_name AS broadcaster_name,
               ls.title, ls.viewer_count, ls.total_tipping_jpy, ls.status,
               ls.started_at::text AS started_at
        FROM live_streams ls
        JOIN user_profiles up ON up.user_id = ls.broadcaster_id
        WHERE ls.id = ?
        """,
        [stream_id],
        db,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="配信が見つかりません")
    return LiveStreamItem(**rows[0])


@router.post("/{stream_id}/tip", response_model=TipResponse)
def tip_stream(
    stream_id: int,
    payload: TipPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ライブ配信へ投げ銭（Rank5 女性のみ受取可能）"""
    if payload.amount_jpy < 100:
        raise HTTPException(status_code=400, detail="最小投げ銭額は100円です")

    # 配信存在・配信中チェック
    stream_rows = execQuery.execute_select(
        "SELECT id, broadcaster_id, status FROM live_streams WHERE id = ? LIMIT 1",
        [stream_id],
        db,
    )
    if not stream_rows:
        raise HTTPException(status_code=404, detail="配信が見つかりません")
    stream = stream_rows[0]
    if stream["status"] != "live":
        raise HTTPException(status_code=400, detail="配信は終了しています")

    broadcaster_id = stream["broadcaster_id"]

    # 配信者が Rank5 か確認（Rank5 女性のみ投げ銭受取可能）
    broadcaster_rank_rows = execQuery.execute_select(
        """
        SELECT ur.current_rank, ur.meets_count, ur.reply_rate, ur.review_avg, ur.manner_points, u.gender
        FROM user_ranks ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.user_id = ?
        LIMIT 1
        """,
        [broadcaster_id],
        db,
    )
    broadcaster_rank_row = broadcaster_rank_rows[0] if broadcaster_rank_rows else {}
    broadcaster_rank = int(broadcaster_rank_row.get("current_rank") or 1)
    broadcaster_gender = str(broadcaster_rank_row.get("gender") or "").lower()

    if broadcaster_gender != "female":
        raise HTTPException(
            status_code=403,
            detail={
                "message": "この配信者はまだ投げ銭を受け取れません（女性ユーザーのみ対象）",
                "requiredGender": "female",
                "broadcasterGender": broadcaster_gender or None,
                "broadcasterId": broadcaster_id,
            },
        )

    if broadcaster_rank < 5:
        rank_progress = build_rank_progress(
            current_rank=broadcaster_rank,
            meets_count=int(broadcaster_rank_row.get("meets_count") or 0),
            reply_rate=float(broadcaster_rank_row.get("reply_rate") or 0.0),
            review_avg=float(broadcaster_rank_row.get("review_avg") or 0.0),
            manner_points=int(broadcaster_rank_row.get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "この配信者はまだ投げ銭を受け取れません（Rank5以上が対象）",
                "requiredRank": 5,
                "currentRank": broadcaster_rank,
                "broadcasterId": broadcaster_id,
                "rankProgress": rank_progress,
            },
        )

    # 70% クリエーター / 30% プラットフォーム
    creator_revenue = int(payload.amount_jpy * 0.70)
    platform_revenue = payload.amount_jpy - creator_revenue

    transaction_id = execQuery.execute_insert(
        """
        INSERT INTO tipping_transactions
            (sender_user_id, recipient_user_id, live_stream_id,
             amount_jpy, status, occurred_at, creator_revenue_jpy, platform_revenue_jpy)
        VALUES (?, ?, ?, ?, 'completed', NOW(), ?, ?)
        RETURNING id
        """,
        [
            current_user["id"],
            broadcaster_id,
            stream_id,
            payload.amount_jpy,
            creator_revenue,
            platform_revenue,
        ],
        db,
    )

    # 配信の累計投げ銭額を更新
    execQuery.execute_update(
        "UPDATE live_streams SET total_tipping_jpy = total_tipping_jpy + ? WHERE id = ?",
        [payload.amount_jpy, stream_id],
        db,
    )

    # 通知
    execQuery.execute_insert(
        """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, 'tip', FALSE, NOW())
        """,
        [broadcaster_id, current_user["id"], f"¥{payload.amount_jpy:,}の投げ銭を受け取りました"],
        db,
    )

    return TipResponse(
        transaction_id=transaction_id or 0,
        stream_id=stream_id,
        amount_jpy=payload.amount_jpy,
        status="completed",
    )
