"""
ブースト関連のエンドポイント
ブースト購入、有効化、有効期限管理
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from database import get_db
from utils.dependencies import get_current_user
import execQuery

router = APIRouter(prefix="/api/boost", tags=["boost"])


class BoostPurchasePayload(BaseModel):
    """ブースト購入ペイロード"""

    duration_days: int  # 購入期間（日数）。例: 7, 30, 90
    price_jpy: int  # 購入価格（円）


class BoostPurchaseResponse(BaseModel):
    """ブースト購入レスポンス"""

    boost_id: int  # ブースト購入ID
    user_id: int  # ユーザーID
    expires_at: datetime  # 有効期限


@router.post("/purchase", response_model=BoostPurchaseResponse)
def purchase_boost(
    payload: BoostPurchasePayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ブースト購入 (🟠P2-15)
    - 課金処理（本番環境では決済サービス統合）
    - boost_purchases テーブルに記録
    """

    if payload.duration_days not in [7, 30, 90]:
        raise HTTPException(status_code=400, detail="duration_days must be one of 7, 30, 90")
    if payload.price_jpy <= 0:
        raise HTTPException(status_code=400, detail="Invalid duration or price")

    # 購入記録を作成（activated_at は NULL のまま。有効化は別途エンドポイント）
    insert_query = """
        INSERT INTO boost_purchases (user_id, purchased_at, expires_at, price_jpy, payment_status)
        VALUES (?, NOW(), NOW() + (? || ' days')::interval, ?, 'completed')
        RETURNING id
    """
    boost_id = execQuery.execute_insert(
        insert_query,
        [current_user["id"], payload.duration_days, payload.price_jpy],
        db,
    )

    if not boost_id:
        raise HTTPException(status_code=500, detail="Failed to create boost purchase")

    # 作成したレコードをIDで取得
    fetch_query = """
        SELECT id, expires_at FROM boost_purchases
        WHERE id = ?
    """
    boost_records = execQuery.execute_select(fetch_query, [int(boost_id)], db)

    if not boost_records:
        raise HTTPException(status_code=500, detail="Failed to create boost purchase")

    boost_record = boost_records[0]

    return {
        "boost_id": int(boost_record["id"]),
        "user_id": current_user["id"],
        "expires_at": boost_record["expires_at"],
    }


@router.post("/activate/{boost_id}", response_model=dict)
def activate_boost(
    boost_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    ブースト有効化 (🟠P2-15)
    - 購入したブーストを有効化
    - activated_at を NOW() に設定
    """

    query = """
        SELECT id, user_id, activated_at, expires_at, payment_status
        FROM boost_purchases
        WHERE id = ? AND user_id = ?
        LIMIT 1
    """
    result = execQuery.execute_select(query, [boost_id, current_user["id"]], db)

    if not result:
        raise HTTPException(status_code=404, detail="Boost not found")

    boost_record = result[0]

    if str(boost_record.get("payment_status") or "") != "completed":
        raise HTTPException(status_code=400, detail="Boost payment is not completed")

    expires_at = boost_record.get("expires_at")
    if expires_at is not None and expires_at <= datetime.now():
        raise HTTPException(status_code=400, detail="Boost already expired")

    # 既に有効化済みなら即リターン
    if boost_record["activated_at"] is not None:
        return {
            "status": "already_activated",
            "boost_id": boost_id,
            "expires_at": boost_record["expires_at"],
        }

    # 有効化処理
    update_query = """
        UPDATE boost_purchases
        SET activated_at = NOW()
        WHERE id = ? AND user_id = ?
    """
    execQuery.execute_update(update_query, [boost_id, current_user["id"]], db)

    return {
        "status": "activated",
        "boost_id": boost_id,
        "expires_at": boost_record["expires_at"],
    }


@router.get("/active", response_model=Optional[dict])
def get_active_boost(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    アクティブなブースト情報取得 (🟠P2-15)
    - 有効期限内で activated_at != NULL のブーストを取得
    """

    query = """
        SELECT id, activated_at, expires_at
        FROM boost_purchases
        WHERE user_id = ?
                    AND payment_status = 'completed'
          AND activated_at IS NOT NULL
          AND (expires_at IS NULL OR expires_at > NOW())
        ORDER BY expires_at DESC
        LIMIT 1
    """
    result = execQuery.execute_select(query, [current_user["id"]], db)

    if not result:
        return None

    boost_record = result[0]
    return {
        "boost_id": int(boost_record["id"]),
        "activated_at": boost_record["activated_at"],
        "expires_at": boost_record["expires_at"],
    }
