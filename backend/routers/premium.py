"""
プレミアム会員関連のエンドポイント
プレミアム加入、有効期限管理
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from utils.dependencies import get_current_user
import execQuery

router = APIRouter(prefix="/api/premium", tags=["premium"])


class PremiumSubscriptionPayload(BaseModel):
    """プレミアム加入ペイロード"""

    duration_months: int  # 加入期間（月数）。例: 1, 3, 12
    monthly_price_jpy: int  # 月額料金（円）


class PremiumSubscriptionResponse(BaseModel):
    """プレミアム加入レスポンス"""

    subscription_id: int  # サブスクリプションID
    user_id: int  # ユーザーID
    ends_at: Optional[datetime] = None  # 有効期限（NULL=継続中）
    status: str  # 'active', 'cancelled'


@router.post("/subscribe", response_model=PremiumSubscriptionResponse)
def subscribe_premium(
    payload: PremiumSubscriptionPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """プレミアム加入 (🟠P2-14)"""

    if payload.duration_months <= 0:
        raise HTTPException(status_code=400, detail="duration_months must be positive")
    if payload.monthly_price_jpy <= 0:
        raise HTTPException(status_code=400, detail="monthly_price_jpy must be positive")

    existing_query = """
        SELECT id, status, ends_at
        FROM premium_subscriptions
        WHERE user_id = ?
        LIMIT 1
    """
    existing_rows = execQuery.execute_select(existing_query, [current_user["id"]], db)

    if existing_rows:
        existing = existing_rows[0]
        is_active_now = str(existing.get("status") or "") == "active" and (
            existing.get("ends_at") is None or existing.get("ends_at") > datetime.now()
        )

        if is_active_now:
            update_query = """
                UPDATE premium_subscriptions
                SET ends_at = COALESCE(ends_at, NOW()) + (? || ' months')::interval,
                    monthly_price_jpy = ?,
                    last_charge_at = NOW(),
                    next_charge_at = COALESCE(ends_at, NOW()) + (? || ' months')::interval,
                    status = 'active'
                WHERE id = ?
            """
            execQuery.execute_update(
                update_query,
                [
                    payload.duration_months,
                    payload.monthly_price_jpy,
                    payload.duration_months,
                    int(existing["id"]),
                ],
                db,
            )
        else:
            reactivate_query = """
                UPDATE premium_subscriptions
                SET started_at = NOW(),
                    ends_at = NOW() + (? || ' months')::interval,
                    status = 'active',
                    monthly_price_jpy = ?,
                    last_charge_at = NOW(),
                    next_charge_at = NOW() + (? || ' months')::interval
                WHERE id = ?
            """
            execQuery.execute_update(
                reactivate_query,
                [
                    payload.duration_months,
                    payload.monthly_price_jpy,
                    payload.duration_months,
                    int(existing["id"]),
                ],
                db,
            )
    else:
        insert_query = """
            INSERT INTO premium_subscriptions (
                user_id, started_at, ends_at, status, monthly_price_jpy, last_charge_at, next_charge_at
            )
            VALUES (?, NOW(), NOW() + (? || ' months')::interval, 'active', ?, NOW(), NOW() + (? || ' months')::interval)
            RETURNING id
        """
        inserted_id = execQuery.execute_insert(
            insert_query,
            [
                current_user["id"],
                payload.duration_months,
                payload.monthly_price_jpy,
                payload.duration_months,
            ],
            db,
        )
        if not inserted_id:
            raise HTTPException(status_code=500, detail="Failed to create subscription")

    fetch_query = """
        SELECT id, ends_at, status
        FROM premium_subscriptions
        WHERE user_id = ?
        LIMIT 1
    """
    rows = execQuery.execute_select(fetch_query, [current_user["id"]], db)
    if not rows:
        raise HTTPException(status_code=500, detail="Failed to load subscription")

    sub = rows[0]
    return {
        "subscription_id": int(sub["id"]),
        "user_id": int(current_user["id"]),
        "ends_at": sub.get("ends_at"),
        "status": str(sub.get("status") or "active"),
    }


@router.post("/cancel", response_model=dict)
def cancel_premium(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """プレミアム解約 (🟠P2-14)"""

    query = """
        SELECT id
        FROM premium_subscriptions
        WHERE user_id = ?
          AND status = 'active'
          AND (ends_at IS NULL OR ends_at > NOW())
        LIMIT 1
    """
    rows = execQuery.execute_select(query, [current_user["id"]], db)
    if not rows:
        raise HTTPException(status_code=404, detail="No active premium subscription found")

    update_query = """
        UPDATE premium_subscriptions
        SET status = 'cancelled'
        WHERE user_id = ?
    """
    execQuery.execute_update(update_query, [current_user["id"]], db)

    return {
        "status": "cancelled",
        "message": "プレミアムサブスクリプションをキャンセルしました（有効期限まで利用可能）",
    }


@router.get("/status", response_model=Optional[dict])
def get_premium_status(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """プレミアムステータス取得 (🟠P2-14)"""

    query = """
        SELECT id, status, ends_at, last_charge_at, next_charge_at
        FROM premium_subscriptions
        WHERE user_id = ?
          AND status = 'active'
          AND (ends_at IS NULL OR ends_at > NOW())
        LIMIT 1
    """
    rows = execQuery.execute_select(query, [current_user["id"]], db)
    if not rows:
        return None

    sub = rows[0]
    return {
        "subscription_id": int(sub["id"]),
        "status": str(sub["status"]),
        "ends_at": sub["ends_at"],
        "last_charge_at": sub["last_charge_at"],
        "next_charge_at": sub["next_charge_at"],
    }
