"""
通話チケット関連のエンドポイント
チケット作成・購入・一覧・使用
Rank5 男性のみチケット販売可能
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/call-tickets", tags=["call-tickets"])


class CreateTicketPayload(BaseModel):
    """チケット作成ペイロード"""

    ticket_duration_minutes: int  # 通話時間（分）
    price_jpy: int  # 価格（円）
    scheduled_date: str  # 利用予定日（YYYY-MM-DD）
    start_time: str  # 開始時間（HH:MM）
    end_time: str  # 終了時間（HH:MM）


class CallTicketItem(BaseModel):
    """通話チケットアイテム"""

    id: int
    seller_id: int  # 販売者ユーザーID
    seller_name: str  # 販売者表示名
    ticket_duration_minutes: int  # 通話時間（分）
    price_jpy: int  # 価格（円）
    is_available: bool  # 購入可能か
    scheduled_date: str  # 利用予定日（YYYY-MM-DD）
    start_time: str  # 開始時間（HH:MM）
    end_time: str  # 終了時間（HH:MM）


class PurchasedTicketItem(BaseModel):
    """購入済み通話チケットアイテム"""

    purchase_id: int  # 購入ID
    ticket_id: int  # チケットID
    seller_id: int  # 販売者ユーザーID
    seller_name: str  # 販売者表示名
    ticket_duration_minutes: int  # 通話時間（分）
    scheduled_date: str  # 利用予定日（YYYY-MM-DD）
    start_time: str  # 開始時間（HH:MM）
    end_time: str  # 終了時間（HH:MM）
    amount_jpy: int  # 購入金額（円）
    purchased_at: str  # 購入日時
    used_at: Optional[str] = None  # 使用日時（未使用は None）
    is_used: bool  # 使用済みか


class CreatedTicketItem(BaseModel):
    """作成済み通話チケットアイテム"""

    ticket_id: int  # チケットID
    ticket_number: int  # 表示用チケット番号
    ticket_duration_minutes: int  # 通話時間（分）
    price_jpy: int  # 価格（円）
    is_available: bool  # 販売中フラグ（True=販売中, False=販売済み）
    scheduled_date: str  # 利用予定日（YYYY-MM-DD）
    start_time: str  # 開始時間（HH:MM）
    end_time: str  # 終了時間（HH:MM）
    created_at: str  # 作成日時
    sold_at: Optional[str] = None  # 売却日時（未売却は None）
    buyer_id: Optional[int] = None  # 購入者ユーザーID
    buyer_name: Optional[str] = None  # 購入者表示名


def _assert_rank5_male(user_id: int, db: Session) -> None:
    """Rank5 の男性でない場合は 403 を返す"""
    user_rows = execQuery.execute_select(
        "SELECT gender FROM users WHERE id = ? LIMIT 1",
        [user_id],
        db,
    )
    if not user_rows or user_rows[0]["gender"] != "male":
        raise HTTPException(
            status_code=403,
            detail={
                "message": "通話チケット販売は男性ユーザーのみ利用できます",
                "requiredGender": "male",
            },
        )

    rank_rows = execQuery.execute_select(
        """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
        """,
        [user_id],
        db,
    )
    rank_row = rank_rows[0] if rank_rows else {}
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
                "message": "通話チケット販売はRank5以上のユーザーのみ利用できます",
                "currentRank": rank,
                "requiredRank": 5,
                "rankProgress": rank_progress,
            },
        )


@router.post("", response_model=CallTicketItem)
def create_ticket(
    payload: CreateTicketPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """通話チケットを作成（Rank5 男性のみ）"""
    _assert_rank5_male(current_user["id"], db)

    if payload.ticket_duration_minutes < 5:
        raise HTTPException(status_code=400, detail="最短通話時間は5分です")
    if payload.price_jpy < 100:
        raise HTTPException(status_code=400, detail="最低価格は100円です")

    ticket_id = execQuery.execute_insert(
        """
        INSERT INTO call_tickets (
            seller_id,
            ticket_duration_minutes,
            price_jpy,
            scheduled_date,
            start_time,
            end_time,
            is_available,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, TRUE, NOW())
        RETURNING id
        """,
        [
            current_user["id"],
            payload.ticket_duration_minutes,
            payload.price_jpy,
            payload.scheduled_date,
            payload.start_time,
            payload.end_time,
        ],
        db,
    )

    name_rows = execQuery.execute_select(
        "SELECT display_name FROM user_profiles WHERE user_id = ? LIMIT 1",
        [current_user["id"]],
        db,
    )
    seller_name = name_rows[0]["display_name"] if name_rows else "Unknown"

    return CallTicketItem(
        id=ticket_id or 0,
        seller_id=current_user["id"],
        seller_name=seller_name,
        ticket_duration_minutes=payload.ticket_duration_minutes,
        price_jpy=payload.price_jpy,
        is_available=True,
    )


@router.get("/seller/{seller_id}", response_model=List[CallTicketItem])
def list_seller_tickets(
    seller_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """指定ユーザーの販売中チケット一覧"""
    rows = execQuery.execute_select(
        """
        SELECT ct.id, ct.seller_id, up.display_name AS seller_name,
             ct.ticket_duration_minutes, ct.price_jpy, ct.is_available,
             ct.scheduled_date::text AS scheduled_date,
             ct.start_time::text AS start_time,
             ct.end_time::text AS end_time
        FROM call_tickets ct
        JOIN user_profiles up ON up.user_id = ct.seller_id
        WHERE ct.seller_id = ? AND ct.is_available = TRUE
        ORDER BY ct.created_at DESC
        """,
        [seller_id],
        db,
    )
    return [CallTicketItem(**r) for r in rows]


@router.get("/available", response_model=List[CallTicketItem])
def list_available_tickets(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """購入可能な全チケット一覧（Rank5 男性のもの）"""
    rows = execQuery.execute_select(
        """
        SELECT ct.id, ct.seller_id, up.display_name AS seller_name,
             ct.ticket_duration_minutes, ct.price_jpy, ct.is_available,
             ct.scheduled_date::text AS scheduled_date,
             ct.start_time::text AS start_time,
             ct.end_time::text AS end_time
        FROM call_tickets ct
        JOIN user_profiles up ON up.user_id = ct.seller_id
        JOIN user_ranks ur ON ur.user_id = ct.seller_id
        WHERE ct.is_available = TRUE
          AND ur.current_rank >= 5
          AND ct.seller_id != ?
        ORDER BY ct.price_jpy ASC
        LIMIT 50
        """,
        [current_user["id"]],
        db,
    )
    return [CallTicketItem(**r) for r in rows]


@router.post("/purchase/{ticket_id}")
def purchase_ticket(
    ticket_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """通話チケットを購入"""
    rows = execQuery.execute_select(
        """
        SELECT ct.id, ct.seller_id, ct.ticket_duration_minutes, ct.price_jpy, ct.is_available
        FROM call_tickets ct
        WHERE ct.id = ?
        LIMIT 1
        """,
        [ticket_id],
        db,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="チケットが見つかりません")
    ticket = rows[0]

    if not ticket["is_available"]:
        raise HTTPException(status_code=400, detail="このチケットは既に購入されています")
    if ticket["seller_id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="自分のチケットは購入できません")

    # 購入記録
    purchase_id = execQuery.execute_insert(
        """
        INSERT INTO call_ticket_purchases
            (buyer_id, ticket_id, seller_id, purchased_at, amount_jpy)
        VALUES (?, ?, ?, NOW(), ?)
        RETURNING id
        """,
        [current_user["id"], ticket_id, ticket["seller_id"], ticket["price_jpy"]],
        db,
    )

    # チケットを購入済みに変更
    execQuery.execute_update(
        "UPDATE call_tickets SET is_available = FALSE WHERE id = ?",
        [ticket_id],
        db,
    )

    # 販売者へ通知
    execQuery.execute_insert(
        """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, 'ticket_sold', FALSE, NOW())
        """,
        [
            ticket["seller_id"],
            current_user["id"],
            f"通話チケット（{ticket['ticket_duration_minutes']}分）が購入されました",
        ],
        db,
    )

    return {
        "purchase_id": purchase_id or 0,
        "ticket_id": ticket_id,
        "amount_jpy": ticket["price_jpy"],
        "status": "purchased",
    }


@router.get("/my-purchases", response_model=List[PurchasedTicketItem])
def my_purchases(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分が購入した通話チケット一覧"""
    rows = execQuery.execute_select(
        """
        SELECT ctp.id AS purchase_id, ctp.ticket_id, ctp.seller_id,
               up.display_name AS seller_name,
             ct.ticket_duration_minutes,
             ct.scheduled_date::text AS scheduled_date,
             ct.start_time::text AS start_time,
             ct.end_time::text AS end_time,
             ctp.amount_jpy,
               ctp.purchased_at::text AS purchased_at,
               ctp.used_at::text AS used_at,
               CASE WHEN ctp.used_at IS NOT NULL THEN TRUE ELSE FALSE END AS is_used
        FROM call_ticket_purchases ctp
        JOIN call_tickets ct ON ct.id = ctp.ticket_id
        JOIN user_profiles up ON up.user_id = ctp.seller_id
        WHERE ctp.buyer_id = ?
        ORDER BY ctp.purchased_at DESC
        """,
        [current_user["id"]],
        db,
    )
    return [PurchasedTicketItem(**r) for r in rows]


@router.get("/my-created", response_model=List[CreatedTicketItem])
def my_created_tickets(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分が作成した通話チケット一覧（販売中・販売済み）"""
    rows = execQuery.execute_select(
        """
        SELECT ct.id AS ticket_id,
               ct.id AS ticket_number,
               ct.ticket_duration_minutes,
               ct.price_jpy,
               ct.is_available,
             ct.scheduled_date::text AS scheduled_date,
             ct.start_time::text AS start_time,
             ct.end_time::text AS end_time,
               ct.created_at::text AS created_at,
               ctp.purchased_at::text AS sold_at,
               ctp.buyer_id,
               buyer.display_name AS buyer_name
        FROM call_tickets ct
        LEFT JOIN call_ticket_purchases ctp ON ctp.ticket_id = ct.id
        LEFT JOIN user_profiles buyer ON buyer.user_id = ctp.buyer_id
        WHERE ct.seller_id = ?
        ORDER BY ct.created_at DESC
        """,
        [current_user["id"]],
        db,
    )
    return [CreatedTicketItem(**r) for r in rows]


@router.post("/use/{purchase_id}")
def use_ticket(
    purchase_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """チケットを使用済みにする"""
    rows = execQuery.execute_select(
        "SELECT id, buyer_id, used_at FROM call_ticket_purchases WHERE id = ? LIMIT 1",
        [purchase_id],
        db,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="購入済みチケットが見つかりません")
    purchase = rows[0]
    if purchase["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="自分のチケットのみ使用できます")
    if purchase["used_at"]:
        raise HTTPException(status_code=400, detail="既に使用済みです")

    execQuery.execute_update(
        "UPDATE call_ticket_purchases SET used_at = NOW() WHERE id = ?",
        [purchase_id],
        db,
    )
    return {"purchase_id": purchase_id, "status": "used"}
