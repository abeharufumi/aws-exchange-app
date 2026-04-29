"""
チャット関連のエンドポイント
メッセージ送受信
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _assert_can_chat_between_users(current_user_id: int, partner_user_id: int, db: Session) -> None:
    """マッチ成立済みユーザー間のみチャット可能"""
    if int(current_user_id) == int(partner_user_id):
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")

    query = """
        SELECT id
        FROM matching_requests
        WHERE ((from_user_id = ? AND to_user_id = ?)
            OR (from_user_id = ? AND to_user_id = ?))
          AND status = 'matched'
        LIMIT 1
    """
    rows = execQuery.execute_select(
        query,
        [current_user_id, partner_user_id, partner_user_id, current_user_id],
        db,
    )
    if not rows:
        raise HTTPException(status_code=403, detail="Chat is available only for matched users")


class ChatMessagePayload(BaseModel):
    """チャットメッセージペイロード"""

    target_user_id: Optional[int] = None  # 送信先ユーザーID（互換用。未指定可）
    message: str  # メッセージ本文


class ChatReadPayload(BaseModel):
    """既読更新リクエスト"""

    messageIds: list[int]  # 既読化対象メッセージID配列


class ChatQuotaResponse(BaseModel):
    """チャット送信上限レスポンス"""

    currentRank: int  # 現在ランク（1,2,3,4以上）
    usedToday: int  # 本日の送信済み通数
    dailyLimit: Optional[int] = None  # 本日の送信上限（Rank4以上はNone=無制限）
    remainingToday: Optional[int] = None  # 本日の残り送信可能通数（無制限はNone）
    isUnlimited: bool  # 無制限かどうか（Rank4以上はTrue）
    hasPremium: bool = False  # プレミアム会員かどうか
    hasBoost: bool = False  # 有効なブーストを所持しているかどうか
    rankProgress: Optional[dict] = (
        None  # 次ランク到達までの進捗情報（currentRank, nextRank, items）
    )


class ChatReadResponse(BaseModel):
    """既読更新レスポンス"""

    status: str  # 'no_target', 'updated'
    updated: int  # 既読化件数


class ChatSendMessageResponse(BaseModel):
    """メッセージ送信レスポンス"""

    message_id: int  # 送信メッセージID
    status: str  # 'sent'


def _resolve_chat_quota(user_id: int, db: Session) -> dict:
    """ユーザーの当日チャット送信上限情報を取得（Boost/Premium対応）"""
    today_query = """
        SELECT COUNT(*) AS count FROM chat_messages
        WHERE sender_id = ?
        AND DATE(sent_at) = CURRENT_DATE
    """
    today_count_result = execQuery.execute_select(today_query, [user_id], db)
    used_today = int(today_count_result[0]["count"]) if today_count_result else 0

    rank_query = """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rank_result = execQuery.execute_select(rank_query, [user_id], db)
    rank_row = rank_result[0] if rank_result else {}
    current_rank = int(rank_row.get("current_rank") or 1)
    rank_progress = build_rank_progress(
        current_rank=current_rank,
        meets_count=int(rank_row.get("meets_count") or 0),
        reply_rate=float(rank_row.get("reply_rate") or 0),
        review_avg=float(rank_row.get("review_avg") or 0),
        manner_points=int(rank_row.get("manner_points") or 0),
    )

    # Premium 会員確認（有効期限内）
    premium_query = """
        SELECT id FROM premium_subscriptions
        WHERE user_id = ?
                    AND status = 'active'
          AND (ends_at IS NULL OR ends_at > NOW())
        LIMIT 1
    """
    premium_result = execQuery.execute_select(premium_query, [user_id], db)
    has_premium = bool(premium_result)

    # Boost アクティブ確認（有効期限内）
    boost_query = """
        SELECT id FROM boost_purchases
        WHERE user_id = ?
                    AND payment_status = 'completed'
          AND activated_at IS NOT NULL
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1
    """
    boost_result = execQuery.execute_select(boost_query, [user_id], db)
    has_boost = bool(boost_result)

    # 上限決定ロジック
    # Premium 会員または Rank4 以上は無制限
    if has_premium or current_rank >= 4:
        daily_limit = None
        is_unlimited = True
    # Boost アクティブなら base + 10
    elif has_boost:
        base_limits = {1: 3, 2: 5, 3: 10, 4: 10, 5: 10}
        base_limit = base_limits.get(current_rank, 10)
        daily_limit = base_limit + 10
        is_unlimited = False
    # 通常（Rank のみ）
    else:
        daily_limits = {1: 3, 2: 5, 3: 10, 4: 10, 5: 10}
        daily_limit = daily_limits.get(current_rank, 10)
        is_unlimited = current_rank >= 4

    remaining_today = None if is_unlimited else max(0, daily_limit - used_today)

    return {
        "currentRank": current_rank,
        "usedToday": used_today,
        "dailyLimit": daily_limit,
        "remainingToday": remaining_today,
        "isUnlimited": is_unlimited,
        "hasPremium": has_premium,
        "hasBoost": has_boost,
        "rankProgress": rank_progress,
    }


@router.get("/quota", response_model=ChatQuotaResponse)
def get_chat_quota(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    チャット送信上限情報を取得 (🔴P1-30 補強)
    """
    return _resolve_chat_quota(current_user["id"], db)


@router.get("/{user_id}/messages")
def get_chat_messages(
    user_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    チャット履歴取得 (🔴P1-29)
    """
    _assert_can_chat_between_users(current_user["id"], user_id, db)

    query = """
        SELECT id, sender_id, message, sent_at, is_read
        FROM chat_messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC
        LIMIT 100
    """
    map_params = [current_user["id"], user_id, user_id, current_user["id"]]
    return execQuery.execute_select(query, map_params, db)


@router.patch("/{user_id}/read", response_model=ChatReadResponse)
def mark_visible_messages_as_read(
    user_id: int,
    payload: ChatReadPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    可視メッセージのみ既読化 (🔴P1-29 補強)
    """
    _assert_can_chat_between_users(current_user["id"], user_id, db)

    if not payload.messageIds:
        return {"status": "no_target", "updated": 0}

    message_ids = [int(mid) for mid in payload.messageIds if int(mid) > 0]
    if not message_ids:
        return {"status": "no_target", "updated": 0}

    placeholders = ",".join(["?"] * len(message_ids))
    update_query = f"""
        UPDATE chat_messages
        SET is_read = TRUE
        WHERE id IN ({placeholders})
          AND sender_id = ?
          AND receiver_id = ?
          AND is_read = FALSE
    """
    map_params = message_ids + [user_id, current_user["id"]]
    updated = execQuery.execute_update(update_query, map_params, db)
    return {"status": "updated", "updated": updated}


@router.post("/{user_id}/messages", response_model=ChatSendMessageResponse)
def send_chat_message(
    user_id: int,
    payload: ChatMessagePayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    メッセージ送信 (🔴P1-30)
    送信上限チェック付き
    """
    _assert_can_chat_between_users(current_user["id"], user_id, db)

    # 互換用 payload.target_user_id が指定されている場合は path の user_id と一致必須
    if payload.target_user_id is not None and int(payload.target_user_id) != int(user_id):
        raise HTTPException(status_code=400, detail="target_user_id does not match path user_id")

    quota = _resolve_chat_quota(current_user["id"], db)
    today_message_count = int(quota["usedToday"])
    current_rank = int(quota["currentRank"])
    daily_limit = quota["dailyLimit"]

    # ランクに応じた上限チェック
    # Rank1: 3通/日, Rank2: 5通/日, Rank3: 10通/日, Rank4以上: 無制限
    if daily_limit is not None and today_message_count >= daily_limit:
        detail_message = (
            f"Rank{current_rank}の1日送信上限({daily_limit}通)に達しました。"
            "ランクアップで制限が緩和されます"
        )
        raise HTTPException(
            status_code=429,
            detail={
                "message": detail_message,
                "currentRank": current_rank,
                "dailyLimit": daily_limit,
                "rankProgress": quota.get("rankProgress"),
            },
        )

    # メッセージ送信
    insert_query = """
        INSERT INTO chat_messages (sender_id, receiver_id, message, sent_at, is_read)
        VALUES (?, ?, ?, NOW(), ?)
        RETURNING id
    """
    insert_map = [current_user["id"], user_id, payload.message, False]
    message_id = execQuery.execute_insert(insert_query, insert_map, db)

    # 返信率計算用: 返信数を+1
    replied_upsert_query = """
        INSERT INTO matching_replies (user_id, accepted_count, replied_count, period_date)
        VALUES (?, 0, 1, CURRENT_DATE)
        ON CONFLICT (user_id, period_date)
        DO UPDATE SET replied_count = matching_replies.replied_count + 1
    """
    execQuery.execute_insert(replied_upsert_query, [current_user["id"]], db)

    # 返信率を再計算して user_ranks に反映
    reply_rate_query = """
        SELECT
            COALESCE(SUM(accepted_count), 0) AS accepted_count,
            COALESCE(SUM(replied_count), 0) AS replied_count
        FROM matching_replies
        WHERE user_id = ?
    """
    reply_rate_result = execQuery.execute_select(reply_rate_query, [current_user["id"]], db)
    accepted_count = reply_rate_result[0]["accepted_count"] if reply_rate_result else 0
    replied_count = reply_rate_result[0]["replied_count"] if reply_rate_result else 0
    reply_rate = round((replied_count / accepted_count) * 100, 2) if accepted_count > 0 else 0

    update_reply_rate_query = """
        UPDATE user_ranks
        SET reply_rate = ?, last_rank_update = NOW()
        WHERE user_id = ?
    """
    execQuery.execute_update(update_reply_rate_query, [reply_rate, current_user["id"]], db)

    return {"message_id": message_id, "status": "sent"}
