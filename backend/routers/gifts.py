"""
ギフト関連のエンドポイント
ギフト送信・受取一覧・既読更新
Rank3以上の女性のみギフト受取可能
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/gifts", tags=["gifts"])

# ギフトアイテム定義（固定マスター）
GIFT_ITEMS = {
    1: {"name": "💐 花束", "price_jpy": 300},
    2: {"name": "🍫 チョコレート", "price_jpy": 200},
    3: {"name": "🎂 ケーキ", "price_jpy": 500},
    4: {"name": "💎 ダイヤ", "price_jpy": 5000},
    5: {"name": "👑 王冠", "price_jpy": 10000},
    6: {"name": "🌹 バラ", "price_jpy": 800},
    7: {"name": "🎁 プレゼント箱", "price_jpy": 1000},
    8: {"name": "🍾 シャンパン", "price_jpy": 2000},
    9: {"name": "✈️ 旅行チケット", "price_jpy": 3000},
    10: {"name": "🏠 家", "price_jpy": 50000},
}


class SendGiftPayload(BaseModel):
    """ギフト送信ペイロード"""

    recipient_id: int  # 受取人ユーザーID
    gift_item_id: int  # ギフトアイテムID（1-10）


class GiftItem(BaseModel):
    """ギフトアイテム定義"""

    id: int
    name: str  # アイテム名（絵文字込み）
    price_jpy: int  # 価格（円）


class ReceivedGiftItem(BaseModel):
    """受け取ったギフトアイテム"""

    id: int
    sender_id: int  # 送信者ユーザーID
    sender_name: str  # 送信者表示名
    gift_item_id: int  # ギフトアイテムID
    gift_name: str  # ギフト名（絵文字込み）
    price_jpy: int  # ギフト金額（円）
    sent_at: str  # 送信日時
    is_opened: bool  # 開封済みか


class SentGiftItem(BaseModel):
    """送ったギフトアイテム"""

    id: int
    recipient_id: int  # 受取人ユーザーID
    recipient_name: str  # 受取人表示名
    gift_item_id: int  # ギフトアイテムID
    gift_name: str  # ギフト名
    price_jpy: int  # ギフト金額（円）
    sent_at: str  # 送信日時
    is_opened: bool  # 開封済みか


@router.get("/items", response_model=List[GiftItem])
def list_gift_items(
    current_user: dict = Depends(get_current_user),
):
    """購入可能なギフトアイテム一覧"""
    return [
        GiftItem(id=item_id, name=item["name"], price_jpy=item["price_jpy"])
        for item_id, item in GIFT_ITEMS.items()
    ]


@router.post("/send")
def send_gift(
    payload: SendGiftPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ギフトを送信"""
    if payload.recipient_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="自分にはギフトを送れません")

    if payload.gift_item_id not in GIFT_ITEMS:
        raise HTTPException(status_code=400, detail="無効なギフトアイテムIDです")

    gift_info = GIFT_ITEMS[payload.gift_item_id]

    # 受取人が Rank3 以上かチェック
    rank_rows = execQuery.execute_select(
        """
        SELECT ur.current_rank, ur.meets_count, ur.reply_rate, ur.review_avg, ur.manner_points, u.gender
        FROM user_ranks ur
        JOIN users u ON u.id = ur.user_id
        WHERE ur.user_id = ?
        LIMIT 1
        """,
        [payload.recipient_id],
        db,
    )
    if not rank_rows:
        raise HTTPException(status_code=404, detail="受取人が見つかりません")
    recipient_rank_row = rank_rows[0]
    recipient_rank = int(recipient_rank_row["current_rank"])
    recipient_gender = str(recipient_rank_row.get("gender") or "").lower()

    if recipient_gender != "female":
        raise HTTPException(
            status_code=403,
            detail={
                "message": "この相手はまだギフトを受け取れません（女性ユーザーのみ対象）",
                "requiredGender": "female",
                "recipientGender": recipient_gender or None,
                "recipientId": payload.recipient_id,
            },
        )

    if recipient_rank < 3:
        rank_progress = build_rank_progress(
            current_rank=recipient_rank,
            meets_count=int(recipient_rank_row.get("meets_count") or 0),
            reply_rate=float(recipient_rank_row.get("reply_rate") or 0.0),
            review_avg=float(recipient_rank_row.get("review_avg") or 0.0),
            manner_points=int(recipient_rank_row.get("manner_points") or 0),
        )
        raise HTTPException(
            status_code=403,
            detail={
                "message": "この相手はまだギフトを受け取れません（Rank3以上が対象）",
                "requiredRank": 3,
                "currentRank": recipient_rank,
                "recipientId": payload.recipient_id,
                "rankProgress": rank_progress,
            },
        )

    gift_id = execQuery.execute_insert(
        """
        INSERT INTO gifts (sender_id, recipient_id, gift_item_id, sent_at, is_opened, price_jpy)
        VALUES (?, ?, ?, NOW(), FALSE, ?)
        RETURNING id
        """,
        [current_user["id"], payload.recipient_id, payload.gift_item_id, gift_info["price_jpy"]],
        db,
    )

    # 通知
    execQuery.execute_insert(
        """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, 'gift', FALSE, NOW())
        """,
        [
            payload.recipient_id,
            current_user["id"],
            f"{gift_info['name']}が届きました（¥{gift_info['price_jpy']:,}）",
        ],
        db,
    )

    return {
        "gift_id": gift_id or 0,
        "gift_name": gift_info["name"],
        "price_jpy": gift_info["price_jpy"],
        "status": "sent",
    }


@router.get("/received", response_model=List[ReceivedGiftItem])
def my_received_gifts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分が受け取ったギフト一覧"""
    rows = execQuery.execute_select(
        """
        SELECT g.id, g.sender_id, up.display_name AS sender_name,
               g.gift_item_id, g.price_jpy,
               g.sent_at::text AS sent_at, g.is_opened
        FROM gifts g
        JOIN user_profiles up ON up.user_id = g.sender_id
        WHERE g.recipient_id = ?
        ORDER BY g.sent_at DESC
        LIMIT 100
        """,
        [current_user["id"]],
        db,
    )
    result = []
    for r in rows:
        item_info = GIFT_ITEMS.get(r["gift_item_id"], {"name": "不明なギフト"})
        result.append(
            ReceivedGiftItem(
                id=r["id"],
                sender_id=r["sender_id"],
                sender_name=r["sender_name"],
                gift_item_id=r["gift_item_id"],
                gift_name=item_info["name"],
                price_jpy=r["price_jpy"],
                sent_at=r["sent_at"],
                is_opened=bool(r["is_opened"]),
            )
        )
    return result


@router.get("/sent", response_model=List[SentGiftItem])
def my_sent_gifts(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """自分が送ったギフト一覧"""
    rows = execQuery.execute_select(
        """
        SELECT g.id, g.recipient_id, up.display_name AS recipient_name,
               g.gift_item_id, g.price_jpy,
               g.sent_at::text AS sent_at, g.is_opened
        FROM gifts g
        JOIN user_profiles up ON up.user_id = g.recipient_id
        WHERE g.sender_id = ?
        ORDER BY g.sent_at DESC
        LIMIT 100
        """,
        [current_user["id"]],
        db,
    )
    result = []
    for r in rows:
        item_info = GIFT_ITEMS.get(r["gift_item_id"], {"name": "不明なギフト"})
        result.append(
            SentGiftItem(
                id=r["id"],
                recipient_id=r["recipient_id"],
                recipient_name=r["recipient_name"],
                gift_item_id=r["gift_item_id"],
                gift_name=item_info["name"],
                price_jpy=r["price_jpy"],
                sent_at=r["sent_at"],
                is_opened=bool(r["is_opened"]),
            )
        )
    return result


@router.post("/open/{gift_id}")
def open_gift(
    gift_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """ギフトを開封済みにする"""
    rows = execQuery.execute_select(
        "SELECT id, recipient_id, is_opened FROM gifts WHERE id = ? LIMIT 1",
        [gift_id],
        db,
    )
    if not rows:
        raise HTTPException(status_code=404, detail="ギフトが見つかりません")
    gift = rows[0]
    if gift["recipient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="自分宛のギフトのみ開封できます")
    if gift["is_opened"]:
        return {"gift_id": gift_id, "status": "already_opened"}

    execQuery.execute_update(
        "UPDATE gifts SET is_opened = TRUE, received_at = NOW() WHERE id = ?",
        [gift_id],
        db,
    )
    return {"gift_id": gift_id, "status": "opened"}
