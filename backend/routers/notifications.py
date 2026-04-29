"""
通知関連のエンドポイント
通知取得、既読管理
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from utils.dependencies import get_current_user
import execQuery
from typing import Any, Dict, List, Optional

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class NotificationItemResponse(BaseModel):
    """通知アイテムレスポンス"""

    id: int  # 通知ID
    type: str  # 通知種別（'like','match','meet_request','meet_accepted','meet_rejected','gift','tip','fanclub_join' など）
    content: Optional[str] = ""  # 通知本文（未設定の場合は空文字）
    target_user_id: Optional[int] = None  # 遷移先の相手ユーザーID（未設定の場合はnull）
    target_display_name: Optional[str] = None  # 相手ユーザー表示名（未設定の場合はnull）
    is_read: bool  # 既読状態（true:既読 / false:未読）
    created_at: str  # 作成日時（文字列）


class NotificationUnreadCountResponse(BaseModel):
    """未読件数レスポンス"""

    unreadCount: int  # 未読通知件数


class NotificationMarkReadResponse(BaseModel):
    """既読更新レスポンス"""

    status: str  # 'ok'
    updatedCount: int  # 更新件数


def _resolve_legacy_target_user(
    notification: Dict[str, Any], current_user_id: int, db: Session
) -> Optional[Dict[str, Any]]:
    """target_user_id が未設定の旧通知に対して相手ユーザーを補完する"""

    notification_type = notification.get("type")
    created_at = notification.get("created_at")
    if not notification_type or not created_at:
        return None

    if notification_type in ("like", "match"):
        query = """
            SELECT mr.from_user_id AS target_user_id,
                 up.display_name AS target_display_name
            FROM matching_requests mr
             LEFT JOIN user_profiles up ON up.user_id = mr.from_user_id
            WHERE mr.to_user_id = ?
                            AND mr.created_at BETWEEN (CAST(? AS TIMESTAMP) - INTERVAL '30 days')
                                                                        AND (CAST(? AS TIMESTAMP) + INTERVAL '30 days')
                        ORDER BY ABS(EXTRACT(EPOCH FROM (mr.created_at - CAST(? AS TIMESTAMP)))) ASC
            LIMIT 1
        """
        result = execQuery.execute_select(
            query,
            [current_user_id, created_at, created_at, created_at],
            db,
        )
        return result[0] if result else None

    if notification_type == "match_expired":
        query = """
            SELECT mr.to_user_id AS target_user_id,
                 up.display_name AS target_display_name
            FROM matching_requests mr
             LEFT JOIN user_profiles up ON up.user_id = mr.to_user_id
            WHERE mr.from_user_id = ?
              AND mr.status = 'expired'
                            AND mr.created_at BETWEEN (CAST(? AS TIMESTAMP) - INTERVAL '30 days')
                                                                        AND (CAST(? AS TIMESTAMP) + INTERVAL '30 days')
                        ORDER BY ABS(EXTRACT(EPOCH FROM (mr.created_at - CAST(? AS TIMESTAMP)))) ASC
            LIMIT 1
        """
        result = execQuery.execute_select(
            query,
            [current_user_id, created_at, created_at, created_at],
            db,
        )
        return result[0] if result else None

    if notification_type in (
        "meet_request",
        "meet_accepted",
        "meet_rejected",
        "meet_completed",
        "meet_trouble",
        "rank_penalty",
    ):
        query = """
            SELECT
                CASE
                    WHEN mr.to_user_id = ? THEN mr.from_user_id
                    ELSE mr.to_user_id
                END AS target_user_id,
                up.display_name AS target_display_name
            FROM meet_requests mr
            LEFT JOIN user_profiles up ON up.user_id = (
                CASE
                    WHEN mr.to_user_id = ? THEN mr.from_user_id
                    ELSE mr.to_user_id
                END
            )
            WHERE (mr.to_user_id = ? OR mr.from_user_id = ?)
              AND mr.created_at BETWEEN (CAST(? AS TIMESTAMP) - INTERVAL '30 days')
                                    AND (CAST(? AS TIMESTAMP) + INTERVAL '30 days')
            ORDER BY ABS(EXTRACT(EPOCH FROM (mr.created_at - CAST(? AS TIMESTAMP)))) ASC
            LIMIT 1
        """
        result = execQuery.execute_select(
            query,
            [
                current_user_id,
                current_user_id,
                current_user_id,
                current_user_id,
                created_at,
                created_at,
                created_at,
            ],
            db,
        )
        return result[0] if result else None

    if notification_type == "review":
        query = """
            SELECT r.reviewer_id AS target_user_id,
                 up.display_name AS target_display_name
            FROM reviews r
             LEFT JOIN user_profiles up ON up.user_id = r.reviewer_id
            WHERE r.reviewed_id = ?
                AND r.created_at BETWEEN (CAST(? AS TIMESTAMP) - INTERVAL '30 days')
                            AND (CAST(? AS TIMESTAMP) + INTERVAL '30 days')
                 ORDER BY ABS(EXTRACT(EPOCH FROM (r.created_at - CAST(? AS TIMESTAMP)))) ASC
            LIMIT 1
        """
        result = execQuery.execute_select(
            query,
            [current_user_id, created_at, created_at, created_at],
            db,
        )
        return result[0] if result else None

    return None


@router.get("", response_model=List[NotificationItemResponse])
def get_notifications(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """通知取得 (🟠P2-46)"""

    query = """
         SELECT n.id,
             n.type,
             n.content,
             n.target_user_id,
             up.display_name AS target_display_name,
             n.is_read,
             n.created_at::text AS created_at
         FROM notifications n
         LEFT JOIN user_profiles up ON n.target_user_id = up.user_id
         WHERE n.user_id = ?
         ORDER BY n.created_at DESC
         LIMIT 50
    """
    map_params = [current_user["id"]]
    notifications: List[Dict[str, Any]] = execQuery.execute_select(query, map_params, db)

    for item in notifications:
        if item.get("target_user_id"):
            continue
        resolved = _resolve_legacy_target_user(item, int(current_user["id"]), db)
        if not resolved:
            continue
        item["target_user_id"] = resolved.get("target_user_id")
        item["target_display_name"] = resolved.get("target_display_name")

    return notifications


@router.get("/unread-count", response_model=NotificationUnreadCountResponse)
def get_unread_count(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """未読通知件数を取得する"""

    query = """
        SELECT COUNT(*) AS unread_count
        FROM notifications
        WHERE user_id = ?
          AND is_read = FALSE
    """
    map_params = [current_user["id"]]
    result = execQuery.execute_select(query, map_params, db)
    unread_count = result[0]["unread_count"] if result else 0

    return {"unreadCount": unread_count}


@router.patch("/read-all", response_model=NotificationMarkReadResponse)
def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    """通知をすべて既読にする"""

    query = """
        UPDATE notifications
        SET is_read = TRUE
        WHERE user_id = ?
          AND is_read = FALSE
    """
    map_params = [current_user["id"]]
    updated = execQuery.execute_update(query, map_params, db)

    return {"status": "ok", "updatedCount": updated}


@router.patch("/{notification_id}/read", response_model=NotificationMarkReadResponse)
def mark_notification_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """単一通知を既読にする"""

    query = """
        UPDATE notifications
        SET is_read = TRUE
        WHERE id = ?
          AND user_id = ?
    """
    map_params = [notification_id, current_user["id"]]
    updated = execQuery.execute_update(query, map_params, db)

    return {"status": "ok", "updatedCount": updated}
