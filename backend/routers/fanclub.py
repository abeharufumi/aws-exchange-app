"""
ファンクラブ関連のエンドポイント
加入・解約・メンバー一覧・加入一覧
Rank5 ユーザーのみファンクラブ開設可能
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/fanclub", tags=["fanclub"])


class FanclubSubscribePayload(BaseModel):
    """ファンクラブ加入ペイロード"""

    monthly_price_jpy: Optional[int] = None  # 月額（省略時はクリエーター設定値を使用）


class FanclubMemberItem(BaseModel):
    """ファンクラブメンバーアイテム"""

    member_id: int  # メンバーユーザーID
    member_name: str  # メンバー表示名
    joined_at: str  # 加入日時
    expires_at: Optional[str] = None  # 有効期限
    status: str  # 'active', 'cancelled', 'expired'
    monthly_price_jpy: int  # 月額（円）


class FanclubSubscriptionItem(BaseModel):
    """加入ファンクラブアイテム"""

    creator_id: int  # クリエーターユーザーID
    creator_name: str  # クリエーター表示名
    joined_at: str  # 加入日時
    expires_at: Optional[str] = None  # 有効期限
    status: str  # 'active', 'cancelled', 'expired'
    monthly_price_jpy: int  # 月額（円）


class FanclubCreatorInfo(BaseModel):
    """クリエーターのファンクラブ情報"""

    creator_id: int  # クリエーターユーザーID
    creator_name: str  # クリエーター表示名
    member_count: int  # 現在のメンバー数
    monthly_price_jpy: int  # 月額（円）
    is_subscribed: bool  # 自分が加入済みか


@router.get("/creator/{creator_id}", response_model=FanclubCreatorInfo)
def get_fanclub_info(
    creator_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """クリエーターのファンクラブ情報を取得"""
    # クリエーター存在 + Rank5 チェック
    rank_rows = execQuery.execute_select(
        """
        SELECT ur.current_rank, ur.meets_count, ur.reply_rate, ur.review_avg, ur.manner_points, up.display_name
        FROM user_ranks ur
        JOIN user_profiles up ON up.user_id = ur.user_id
        WHERE ur.user_id = ?
        LIMIT 1
        """,
        [creator_id],
        db,
    )
    if not rank_rows:
        raise HTTPException(status_code=404, detail="ユーザーが見つかりません")
    if int(rank_rows[0]["current_rank"]) < 5:
        creator_rank = int(rank_rows[0].get("current_rank") or 1)
        rank_progress = build_rank_progress(
            current_rank=creator_rank,
            meets_count=int(rank_rows[0].get("meets_count") or 0),
            reply_rate=float(rank_rows[0].get("reply_rate") or 0.0),
            review_avg=float(rank_rows[0].get("review_avg") or 0.0),
            manner_points=int(rank_rows[0].get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "このユーザーはファンクラブを開設していません",
                "requiredRank": 5,
                "currentRank": creator_rank,
                "creatorId": creator_id,
                "rankProgress": rank_progress,
            },
        )

    creator_name = rank_rows[0]["display_name"]

    # メンバー数
    count_rows = execQuery.execute_select(
        "SELECT COUNT(*) AS cnt FROM fanclub_memberships WHERE creator_id = ? AND status = 'active'",
        [creator_id],
        db,
    )
    member_count = int(count_rows[0]["cnt"]) if count_rows else 0

    # 代表的な月額（最新のアクティブメンバーの設定を参照、なければデフォルト500）
    price_rows = execQuery.execute_select(
        """
        SELECT monthly_price_jpy FROM fanclub_memberships
        WHERE creator_id = ? AND status = 'active'
        ORDER BY joined_at DESC LIMIT 1
        """,
        [creator_id],
        db,
    )
    monthly_price_jpy = int(price_rows[0]["monthly_price_jpy"]) if price_rows else 500

    # 自分が加入済みか
    my_row = execQuery.execute_select(
        """
        SELECT id FROM fanclub_memberships
        WHERE creator_id = ? AND member_id = ? AND status = 'active'
        LIMIT 1
        """,
        [creator_id, current_user["id"]],
        db,
    )

    return FanclubCreatorInfo(
        creator_id=creator_id,
        creator_name=creator_name,
        member_count=member_count,
        monthly_price_jpy=monthly_price_jpy,
        is_subscribed=bool(my_row),
    )


@router.post("/subscribe/{creator_id}")
def subscribe_fanclub(
    creator_id: int,
    payload: FanclubSubscribePayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ファンクラブに加入"""
    if creator_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="自分のファンクラブには加入できません")

    # クリエーター Rank5 確認
    rank_rows = execQuery.execute_select(
        """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
        """,
        [creator_id],
        db,
    )
    if not rank_rows or int(rank_rows[0]["current_rank"]) < 5:
        creator_rank_row = rank_rows[0] if rank_rows else {}
        creator_rank = int(creator_rank_row.get("current_rank") or 1)
        rank_progress = build_rank_progress(
            current_rank=creator_rank,
            meets_count=int(creator_rank_row.get("meets_count") or 0),
            reply_rate=float(creator_rank_row.get("reply_rate") or 0.0),
            review_avg=float(creator_rank_row.get("review_avg") or 0.0),
            manner_points=int(creator_rank_row.get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "このユーザーはファンクラブを開設していません",
                "requiredRank": 5,
                "currentRank": creator_rank,
                "creatorId": creator_id,
                "rankProgress": rank_progress,
            },
        )

    # 既加入チェック
    existing = execQuery.execute_select(
        "SELECT id, status FROM fanclub_memberships WHERE creator_id = ? AND member_id = ? LIMIT 1",
        [creator_id, current_user["id"]],
        db,
    )
    if existing and existing[0]["status"] == "active":
        raise HTTPException(status_code=400, detail="既に加入済みです")

    monthly_price = payload.monthly_price_jpy or 500

    if existing:
        # 再加入（UPDATE）
        execQuery.execute_update(
            """
            UPDATE fanclub_memberships
            SET status = 'active',
                joined_at = NOW(),
                expires_at = NOW() + INTERVAL '30 days',
                monthly_price_jpy = ?,
                next_charge_at = NOW() + INTERVAL '30 days'
            WHERE creator_id = ? AND member_id = ?
            """,
            [monthly_price, creator_id, current_user["id"]],
            db,
        )
    else:
        execQuery.execute_insert(
            """
            INSERT INTO fanclub_memberships
                (member_id, creator_id, joined_at, expires_at, status, monthly_price_jpy, next_charge_at)
            VALUES (?, ?, NOW(), NOW() + INTERVAL '30 days', 'active', ?, NOW() + INTERVAL '30 days')
            """,
            [current_user["id"], creator_id, monthly_price],
            db,
        )

    # 通知
    execQuery.execute_insert(
        """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, 'fanclub_join', FALSE, NOW())
        """,
        [creator_id, current_user["id"], "新しいファンクラブメンバーが加入しました"],
        db,
    )

    return {"status": "subscribed", "creator_id": creator_id, "monthly_price_jpy": monthly_price}


@router.post("/cancel/{creator_id}")
def cancel_fanclub(
    creator_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ファンクラブを解約"""
    existing = execQuery.execute_select(
        "SELECT id, status FROM fanclub_memberships WHERE creator_id = ? AND member_id = ? LIMIT 1",
        [creator_id, current_user["id"]],
        db,
    )
    if not existing or existing[0]["status"] != "active":
        raise HTTPException(status_code=404, detail="加入中のファンクラブが見つかりません")

    execQuery.execute_update(
        "UPDATE fanclub_memberships SET status = 'cancelled' WHERE creator_id = ? AND member_id = ?",
        [creator_id, current_user["id"]],
        db,
    )
    return {"status": "cancelled", "creator_id": creator_id}


@router.get("/my-subscriptions", response_model=List[FanclubSubscriptionItem])
def my_subscriptions(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分が加入中のファンクラブ一覧"""
    rows = execQuery.execute_select(
        """
        SELECT fm.creator_id, up.display_name AS creator_name,
               fm.joined_at::text AS joined_at,
               fm.expires_at::text AS expires_at,
               fm.status, fm.monthly_price_jpy
        FROM fanclub_memberships fm
        JOIN user_profiles up ON up.user_id = fm.creator_id
        WHERE fm.member_id = ?
        ORDER BY fm.joined_at DESC
        """,
        [current_user["id"]],
        db,
    )
    return [FanclubSubscriptionItem(**r) for r in rows]


@router.get("/my-members", response_model=List[FanclubMemberItem])
def my_members(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分のファンクラブメンバー一覧（Rank5のみ）"""
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
    if not rank_rows or int(rank_rows[0]["current_rank"]) < 5:
        rank_row = rank_rows[0] if rank_rows else {}
        current_rank = int(rank_row.get("current_rank") or 1)
        rank_progress = build_rank_progress(
            current_rank=current_rank,
            meets_count=int(rank_row.get("meets_count") or 0),
            reply_rate=float(rank_row.get("reply_rate") or 0.0),
            review_avg=float(rank_row.get("review_avg") or 0.0),
            manner_points=int(rank_row.get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "ファンクラブ管理はRank5以上のみ利用できます",
                "requiredRank": 5,
                "currentRank": current_rank,
                "rankProgress": rank_progress,
            },
        )

    rows = execQuery.execute_select(
        """
        SELECT fm.member_id, up.display_name AS member_name,
               fm.joined_at::text AS joined_at,
               fm.expires_at::text AS expires_at,
               fm.status, fm.monthly_price_jpy
        FROM fanclub_memberships fm
        JOIN user_profiles up ON up.user_id = fm.member_id
        WHERE fm.creator_id = ?
        ORDER BY fm.joined_at DESC
        """,
        [current_user["id"]],
        db,
    )
    return [FanclubMemberItem(**r) for r in rows]
