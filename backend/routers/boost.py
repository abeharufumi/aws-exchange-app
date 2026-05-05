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

BOOST_PRICE_JPY = 500
BOOST_DISPLAY_MINUTES = 30
BOOST_MESSAGE_BONUS = 10


class BoostPurchasePayload(BaseModel):
    """ブースト購入ペイロード"""

    price_jpy: int  # 購入価格（円）


class BoostPurchaseResponse(BaseModel):
    """ブースト購入レスポンス"""

    boost_id: int  # ブースト購入ID
    user_id: int  # ユーザーID
    expires_at: Optional[datetime] = None  # 表示優先の有効期限（有効化前はNULL）
    message_bonus_total: int  # 追加メッセージ総数
    message_bonus_used: int  # 使用済み追加メッセージ数
    message_bonus_remaining: int  # 残り追加メッセージ数


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

    if payload.price_jpy != BOOST_PRICE_JPY:
        raise HTTPException(status_code=400, detail=f"price_jpy must be {BOOST_PRICE_JPY}")

    # 購入記録を作成（表示優先30分は有効化時に開始）
    insert_query = """
        INSERT INTO boost_purchases (
            user_id, purchased_at, activated_at, expires_at,
            price_jpy, payment_status,
            bonus_messages_total, bonus_messages_used
        )
        VALUES (?, NOW(), NULL, NULL, ?, 'completed', ?, 0)
        RETURNING id
    """
    boost_id = execQuery.execute_insert(
        insert_query,
        [current_user["id"], payload.price_jpy, BOOST_MESSAGE_BONUS],
        db,
    )

    if not boost_id:
        raise HTTPException(status_code=500, detail="Failed to create boost purchase")

    # 作成したレコードをIDで取得
    fetch_query = """
        SELECT id, expires_at, bonus_messages_total, bonus_messages_used FROM boost_purchases
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
        "message_bonus_total": int(boost_record.get("bonus_messages_total") or BOOST_MESSAGE_BONUS),
        "message_bonus_used": int(boost_record.get("bonus_messages_used") or 0),
        "message_bonus_remaining": max(
            0,
            int(boost_record.get("bonus_messages_total") or BOOST_MESSAGE_BONUS)
            - int(boost_record.get("bonus_messages_used") or 0),
        ),
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
    - 表示優先の有効期限を NOW() + 30分 に設定
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
    update_query = f"""
        UPDATE boost_purchases
        SET activated_at = NOW(),
            expires_at = NOW() + INTERVAL '{BOOST_DISPLAY_MINUTES} minutes'
        WHERE id = ? AND user_id = ?
    """
    execQuery.execute_update(update_query, [boost_id, current_user["id"]], db)

    updated_query = """
        SELECT expires_at
        FROM boost_purchases
        WHERE id = ? AND user_id = ?
        LIMIT 1
    """
    updated_rows = execQuery.execute_select(updated_query, [boost_id, current_user["id"]], db)
    updated_expires_at = updated_rows[0]["expires_at"] if updated_rows else None

    return {
        "status": "activated",
        "boost_id": boost_id,
        "expires_at": updated_expires_at,
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
         SELECT id, activated_at, expires_at,
             bonus_messages_total,
             bonus_messages_used
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
        "message_bonus_remaining": max(
            0,
            int(boost_record.get("bonus_messages_total") or BOOST_MESSAGE_BONUS)
            - int(boost_record.get("bonus_messages_used") or 0),
        ),
    }
