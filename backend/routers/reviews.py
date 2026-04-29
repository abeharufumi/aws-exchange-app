"""
レビュー関連のエンドポイント
レビュー投稿、評価計算
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import recalculate_rank_for_user
import execQuery

router = APIRouter(prefix="/api/review", tags=["reviews"])


class ReviewPayload(BaseModel):
    """レビューペイロード"""

    target_user_id: int  # レビュー対象ユーザーID
    rating: int  # 1-5
    comment: str  # レビューコメント本文


class ReviewSubmitResponse(BaseModel):
    """レビュー投稿レスポンス"""

    review_id: int  # レビューID
    meet_request_id: int  # 紐づくデート予約ID
    status: str  # 'submitted'


def _create_review_notification(target_user_id: int, reviewer_user_id: int, db: Session) -> None:
    """レビュー投稿通知を作成"""
    notify_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    execQuery.execute_insert(
        notify_query,
        [target_user_id, reviewer_user_id, "レビューが投稿されました", "review", False],
        db,
    )


@router.post("/", response_model=ReviewSubmitResponse)
def submit_review(
    payload: ReviewPayload,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    レビュー投稿 (🔴P1-35)
    """

    if payload.target_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot review yourself")

    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # 直近の completed デート（未レビュー）を1件取得
    reviewable_meet_query = """
        SELECT mr.id AS meet_request_id
        FROM meet_requests mr
        LEFT JOIN reviews r
          ON r.meet_request_id = mr.id
         AND r.reviewer_id = ?
        WHERE ((mr.from_user_id = ? AND mr.to_user_id = ?)
            OR (mr.from_user_id = ? AND mr.to_user_id = ?))
          AND mr.status = 'completed'
          AND r.id IS NULL
        ORDER BY mr.created_at DESC
        LIMIT 1
    """
    reviewable_rows = execQuery.execute_select(
        reviewable_meet_query,
        [
            current_user["id"],
            current_user["id"],
            payload.target_user_id,
            payload.target_user_id,
            current_user["id"],
        ],
        db,
    )
    if not reviewable_rows:
        raise HTTPException(status_code=400, detail="No completed meet available for review")

    meet_request_id = int(reviewable_rows[0]["meet_request_id"])

    # 既存レビューチェック
    check_query = """
        SELECT id FROM reviews
        WHERE reviewer_id = ? AND meet_request_id = ?
        LIMIT 1
    """
    check_map = [current_user["id"], meet_request_id]
    existing = execQuery.execute_select(check_query, check_map, db)

    if existing:
        raise HTTPException(status_code=400, detail="Review already submitted")

    # レビュー作成
    insert_query = """
        INSERT INTO reviews (meet_request_id, reviewer_id, reviewed_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
        RETURNING id
    """
    insert_map = [
        meet_request_id,
        current_user["id"],
        payload.target_user_id,
        payload.rating,
        payload.comment,
    ]
    review_id = execQuery.execute_insert(insert_query, insert_map, db)

    # レビュー平均を更新
    avg_query = """
        SELECT AVG(rating) AS avg_rating FROM reviews WHERE reviewed_id = ?
    """
    avg_map = [payload.target_user_id]
    avg_result = execQuery.execute_select(avg_query, avg_map, db)
    avg_rating = (
        float(avg_result[0]["avg_rating"]) if avg_result and avg_result[0]["avg_rating"] else 0.0
    )

    # user_ranks の review_avg を更新し、昇格条件を満たしていればランクアップ
    recalculate_rank_for_user(payload.target_user_id, db, review_avg=avg_rating)

    # レビュー投稿通知
    _create_review_notification(payload.target_user_id, current_user["id"], db)

    return {
        "review_id": review_id,
        "meet_request_id": meet_request_id,
        "status": "submitted",
    }
