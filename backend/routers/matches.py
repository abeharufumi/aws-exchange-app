"""
マッチング関連のエンドポイント
いいね、パス、マッチング管理
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import get_db
from utils.dependencies import get_current_user
from utils.rank import build_rank_progress
import execQuery

router = APIRouter(prefix="/api/matches", tags=["matches"])


def _expire_old_pending_requests(db: Session) -> None:
    """7日以上経過したpending依頼を期限切れへ更新"""
    expire_query = """
        UPDATE matching_requests
        SET status = 'expired'
        WHERE status = 'pending'
          AND created_at < NOW() - INTERVAL '7 days'
    """
    execQuery.execute_update(expire_query, [], db)


def _get_receive_filter_block_detail(
    sender_user_id: int,
    target_user_id: int,
    db: Session,
) -> Optional[dict]:
    """受信側フィルターにより送信がブロックされる場合、理由詳細を返す"""
    rank_query = """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rank_rows = execQuery.execute_select(rank_query, [sender_user_id], db)
    sender_rank_row = rank_rows[0] if rank_rows else {}
    sender_rank = int(sender_rank_row.get("current_rank") or 1)

    filter_query = """
        SELECT block_rank1, block_rank2, block_rank3
        FROM receive_filters
        WHERE user_id = ?
        LIMIT 1
    """
    filter_rows = execQuery.execute_select(filter_query, [target_user_id], db)
    if not filter_rows:
        return None

    filter_row = filter_rows[0]
    blocked_by_rank = None
    if sender_rank == 1 and bool(filter_row.get("block_rank1")):
        blocked_by_rank = 1
    if sender_rank == 2 and bool(filter_row.get("block_rank2")):
        blocked_by_rank = 2
    if sender_rank == 3 and bool(filter_row.get("block_rank3")):
        blocked_by_rank = 3

    if blocked_by_rank is None:
        return None

    rank_progress = build_rank_progress(
        current_rank=sender_rank,
        meets_count=int(sender_rank_row.get("meets_count") or 0),
        reply_rate=float(sender_rank_row.get("reply_rate") or 0.0),
        review_avg=float(sender_rank_row.get("review_avg") or 0.0),
        manner_points=int(sender_rank_row.get("manner_points") or 0),
    )

    return {
        "status": "blocked_by_filter",
        "action": "like",
        "reason": "target_user_receive_filter",
        "message": "相手の受信フィルターにより、いいねを送れませんでした",
        "senderRank": sender_rank,
        "blockedByRank": blocked_by_rank,
        "requiredRank": blocked_by_rank + 1,
        "rankProgress": rank_progress,
    }


class MatchActionRequest(BaseModel):
    target_user_id: int  # 対象ユーザーID


class IncomingLikeAcceptResponse(BaseModel):
    """受信いいね承諾レスポンス"""

    status: str  # 'matched' or 'already_processed'
    requestId: int  # 承諾対象の受信いいね依頼ID
    targetUserId: int  # マッチ相手ユーザーID
    message: str  # 表示用メッセージ


class IncomingLikeRejectResponse(BaseModel):
    """受信いいね拒否レスポンス"""

    status: str  # 'passed' or 'already_processed'
    requestId: int  # 拒否対象の受信いいね依頼ID
    targetUserId: int  # 拒否相手ユーザーID
    message: str  # 表示用メッセージ


class MatchListItemResponse(BaseModel):
    """マッチ一覧レスポンス"""

    id: int  # 相手ユーザーID
    displayName: Optional[str] = None  # 相手の表示名
    age: Optional[int] = None  # 相手の年齢
    location: Optional[str] = None  # 相手の居住地
    bio: Optional[str] = None  # 相手の自己紹介
    rank: Optional[int] = None  # 相手のランク
    matchedAt: Optional[datetime] = None  # マッチ成立日時
    lastMessage: Optional[str] = None  # 最終メッセージ本文
    lastMessageAt: Optional[datetime] = None  # 最終メッセージ時刻
    unreadCount: int = 0  # 相手からの未読メッセージ件数


class OutgoingLikeResponse(BaseModel):
    """送信済みいいね一覧レスポンス"""

    requestId: int  # いいね依頼ID
    targetUserId: int  # 相手ユーザーID
    displayName: Optional[str] = None  # 相手の表示名
    age: Optional[int] = None  # 相手の年齢
    rank: Optional[int] = None  # 相手のランク
    status: str  # 'pending' or 'expired'
    createdAt: datetime  # いいね送信日時


class IncomingLikeResponse(BaseModel):
    """受信いいね一覧レスポンス"""

    requestId: int  # 受信したいいね依頼ID
    sourceUserId: int  # 送信元ユーザーID
    displayName: Optional[str] = None  # 送信元ユーザー表示名
    age: Optional[int] = None  # 送信元ユーザー年齢
    location: Optional[str] = None  # 送信元ユーザー居住地
    bio: Optional[str] = None  # 送信元ユーザー自己紹介
    rank: Optional[int] = None  # 送信元ユーザーランク
    lastLoginAt: Optional[datetime] = None  # 送信元ユーザー最終ログイン日時（未ログイン時はnull）
    createdAt: datetime  # 受信日時


class LikeActionResponse(BaseModel):
    """いいね送信レスポンス"""

    status: str  # 'success', 'matched', 'already_pending', 'already_matched', 'blocked_by_filter'
    action: Optional[str] = None  # 'like'
    match_id: Optional[int] = None  # マッチング依頼ID
    reason: Optional[str] = None  # 'target_user_receive_filter'（フィルターブロック時）
    message: str  # 画面表示用メッセージ
    senderRank: Optional[int] = None  # 送信者ランク（フィルターブロック時）
    blockedByRank: Optional[int] = None  # ブロック対象ランク（1/2/3）
    requiredRank: Optional[int] = None  # 解放に必要なランク
    rankProgress: Optional[dict] = None  # 次ランク到達までの進捗情報


class PassActionResponse(BaseModel):
    """パス送信レスポンス"""

    status: str  # 'success' or 'already_exists'
    action: str  # 'pass'
    match_id: int  # マッチング依頼ID
    message: str  # 画面表示用メッセージ


@router.get("", response_model=list[MatchListItemResponse])
def get_match_list(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """マッチ一覧取得"""
    _expire_old_pending_requests(db)

    query = """
        WITH matched_partners AS (
            SELECT
                CASE
                    WHEN m.from_user_id = ? THEN m.to_user_id
                    ELSE m.from_user_id
                END AS partner_id,
                MAX(m.created_at) AS matched_at
            FROM matching_requests m
            WHERE (m.from_user_id = ? OR m.to_user_id = ?)
              AND m.status = ?
            GROUP BY
                CASE
                    WHEN m.from_user_id = ? THEN m.to_user_id
                    ELSE m.from_user_id
                END
        )
        SELECT
            mp.partner_id AS id,
            up.display_name AS "displayName",
            up.age,
            up.location,
            up.bio,
            ur.current_rank AS rank,
            mp.matched_at AS "matchedAt",
            lm.message AS "lastMessage",
            lm.sent_at AS "lastMessageAt",
            COALESCE(uc.unread_count, 0) AS "unreadCount"
        FROM matched_partners mp
        JOIN users u ON u.id = mp.partner_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN user_ranks ur ON ur.user_id = u.id
        LEFT JOIN LATERAL (
            SELECT cm.message, cm.sent_at
            FROM chat_messages cm
            WHERE (cm.sender_id = ? AND cm.receiver_id = mp.partner_id)
               OR (cm.sender_id = mp.partner_id AND cm.receiver_id = ?)
            ORDER BY cm.sent_at DESC
            LIMIT 1
        ) lm ON TRUE
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS unread_count
            FROM chat_messages cmu
            WHERE cmu.sender_id = mp.partner_id
              AND cmu.receiver_id = ?
              AND cmu.is_read = FALSE
        ) uc ON TRUE
                WHERE mp.partner_id <> ?
        ORDER BY COALESCE(lm.sent_at, mp.matched_at) DESC
    """
    map_params = [
        current_user["id"],
        current_user["id"],
        current_user["id"],
        "matched",
        current_user["id"],
        current_user["id"],
        current_user["id"],
        current_user["id"],
        current_user["id"],
    ]

    return execQuery.execute_select(query, map_params, db)


@router.get("/requests/outgoing", response_model=list[OutgoingLikeResponse])
def get_outgoing_like_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    送信済みいいね一覧取得
    - pending: 返信待ち
    - expired: 7日期限切れ（再依頼可能）
    """
    _expire_old_pending_requests(db)

    query = """
        SELECT mr.id AS "requestId",
               mr.to_user_id AS "targetUserId",
               up.display_name AS "displayName",
               up.age,
               ur.current_rank AS rank,
               mr.status,
               mr.created_at AS "createdAt"
        FROM matching_requests mr
        JOIN users u ON u.id = mr.to_user_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN user_ranks ur ON ur.user_id = u.id
        WHERE mr.from_user_id = ?
          AND mr.status IN ('pending', 'expired')
        ORDER BY mr.created_at DESC
        LIMIT 100
    """
    return execQuery.execute_select(query, [current_user["id"]], db)


@router.get("/requests/incoming", response_model=list[IncomingLikeResponse])
def get_incoming_like_requests(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    受信したいいね一覧取得
    - 自分宛のpendingいいねのみ表示
    """
    _expire_old_pending_requests(db)

    query = """
        SELECT mr.id AS "requestId",
               mr.from_user_id AS "sourceUserId",
               up.display_name AS "displayName",
               up.age,
               up.location,
               up.bio,
               ur.current_rank AS rank,
             u.last_login AS "lastLoginAt",
               mr.created_at AS "createdAt"
        FROM matching_requests mr
        JOIN users u ON u.id = mr.from_user_id
        LEFT JOIN user_profiles up ON up.user_id = u.id
        LEFT JOIN user_ranks ur ON ur.user_id = u.id
        WHERE mr.to_user_id = ?
          AND mr.status = 'pending'
        ORDER BY mr.created_at DESC
        LIMIT 100
    """
    return execQuery.execute_select(query, [current_user["id"]], db)


@router.post("/requests/{request_id}/accept", response_model=IncomingLikeAcceptResponse)
def accept_incoming_like_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    受信したいいねを承諾してマッチ成立
    - status: 'matched'（今回成立） / 'already_processed'（既にpending以外）
    """
    _expire_old_pending_requests(db)

    target_query = """
        SELECT id, from_user_id, to_user_id, status
        FROM matching_requests
        WHERE id = ? AND to_user_id = ?
        LIMIT 1
    """
    target_rows = execQuery.execute_select(target_query, [request_id, current_user["id"]], db)

    if not target_rows:
        raise HTTPException(status_code=404, detail="Incoming like request not found")

    target = target_rows[0]
    source_user_id = int(target["from_user_id"])
    current_status = str(target["status"])

    if current_status != "pending":
        return {
            "status": "already_processed",
            "requestId": int(target["id"]),
            "targetUserId": source_user_id,
            "message": "このいいねは既に処理済みです",
        }

    # 対象受信依頼を matched 化
    execQuery.execute_update(
        "UPDATE matching_requests SET status = ? WHERE id = ?",
        ["matched", int(target["id"])],
        db,
    )

    # 逆方向のpendingがあれば matched 化、なければmatchedを補完作成
    reverse_pending_query = """
        SELECT id
        FROM matching_requests
        WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
    """
    reverse_pending_rows = execQuery.execute_select(
        reverse_pending_query,
        [current_user["id"], source_user_id],
        db,
    )

    if reverse_pending_rows:
        execQuery.execute_update(
            "UPDATE matching_requests SET status = ? WHERE id = ?",
            ["matched", int(reverse_pending_rows[0]["id"])],
            db,
        )
    else:
        reverse_matched_query = """
            SELECT id
            FROM matching_requests
            WHERE from_user_id = ? AND to_user_id = ? AND status = 'matched'
            ORDER BY created_at DESC
            LIMIT 1
        """
        reverse_matched_rows = execQuery.execute_select(
            reverse_matched_query,
            [current_user["id"], source_user_id],
            db,
        )
        if not reverse_matched_rows:
            execQuery.execute_insert(
                """
                INSERT INTO matching_requests (from_user_id, to_user_id, status, created_at)
                VALUES (?, ?, ?, NOW())
                """,
                [current_user["id"], source_user_id, "matched"],
                db,
            )

    # 返信率計算用: 承諾数を双方+1
    accepted_upsert_query = """
        INSERT INTO matching_replies (user_id, accepted_count, replied_count, period_date)
        VALUES (?, 1, 0, CURRENT_DATE)
        ON CONFLICT (user_id, period_date)
        DO UPDATE SET accepted_count = matching_replies.accepted_count + 1
    """
    execQuery.execute_insert(accepted_upsert_query, [current_user["id"]], db)
    execQuery.execute_insert(accepted_upsert_query, [source_user_id], db)

    # 相手へマッチ成立通知
    notification_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    execQuery.execute_insert(
        notification_query,
        [source_user_id, current_user["id"], "マッチングが成立しました!", "match", False],
        db,
    )

    return {
        "status": "matched",
        "requestId": int(target["id"]),
        "targetUserId": source_user_id,
        "message": "お互いにいいねしました！",
    }


@router.post("/requests/{request_id}/reject", response_model=IncomingLikeRejectResponse)
def reject_incoming_like_request(
    request_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    受信したいいねを拒否してパス登録
    - status: 'passed'（拒否完了） / 'already_processed'（既にpending以外）
    """
    _expire_old_pending_requests(db)

    target_query = """
        SELECT id, from_user_id, to_user_id, status
        FROM matching_requests
        WHERE id = ? AND to_user_id = ?
        LIMIT 1
    """
    target_rows = execQuery.execute_select(target_query, [request_id, current_user["id"]], db)

    if not target_rows:
        raise HTTPException(status_code=404, detail="Incoming like request not found")

    target = target_rows[0]
    source_user_id = int(target["from_user_id"])
    current_status = str(target["status"])

    if current_status != "pending":
        return {
            "status": "already_processed",
            "requestId": int(target["id"]),
            "targetUserId": source_user_id,
            "message": "この依頼は既に処理されています",
        }

    # 対象受信依頼を passed 化
    execQuery.execute_update(
        "UPDATE matching_requests SET status = ? WHERE id = ?",
        ["passed", int(target["id"])],
        db,
    )

    # 逆方向のpendingがあれば passed 化、なければ補完作成しない（一方的なpassは記録しない）
    reverse_pending_query = """
        SELECT id
        FROM matching_requests
        WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
        ORDER BY created_at DESC
        LIMIT 1
    """
    reverse_pending_rows = execQuery.execute_select(
        reverse_pending_query,
        [current_user["id"], source_user_id],
        db,
    )

    if reverse_pending_rows:
        execQuery.execute_update(
            "UPDATE matching_requests SET status = ? WHERE id = ?",
            ["passed", int(reverse_pending_rows[0]["id"])],
            db,
        )

    # 拒否率計算用: 拒否数を自ユーザーのみ+1
    rejected_upsert_query = """
        INSERT INTO matching_replies (user_id, accepted_count, replied_count, period_date)
        VALUES (?, 0, 0, CURRENT_DATE)
        ON CONFLICT (user_id, period_date)
        DO UPDATE SET replied_count = matching_replies.replied_count + 1
    """
    execQuery.execute_insert(rejected_upsert_query, [current_user["id"]], db)

    # 相手には通知しない（拒否は通知対象外）

    return {
        "status": "passed",
        "requestId": int(target["id"]),
        "targetUserId": source_user_id,
        "message": "見送りました",
    }


@router.post("/like", response_model=LikeActionResponse)
def like_user(
    payload: MatchActionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """いいね送信"""

    _expire_old_pending_requests(db)

    if payload.target_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot like yourself")

    # 受信側のフィルターを確認
    block_detail = _get_receive_filter_block_detail(current_user["id"], payload.target_user_id, db)
    if block_detail:
        return block_detail

    # 既存のLikeをチェック（pending/matchedのみブロック。expired/passedは再依頼可）
    query = """
        SELECT id, status FROM matching_requests
        WHERE from_user_id = ? AND to_user_id = ?
          AND status IN ('pending', 'matched')
        ORDER BY created_at DESC
        LIMIT 1
    """
    map_params = [current_user["id"], payload.target_user_id]
    results = execQuery.execute_select(query, map_params, db)

    if results:
        existing = results[0]
        if existing["status"] == "matched":
            return {
                "status": "already_matched",
                "action": "like",
                "match_id": existing["id"],
                "message": "このユーザーとは既にマッチしています",
            }
        return {
            "status": "already_pending",
            "action": "like",
            "match_id": existing["id"],
            "message": "このユーザーには既に依頼中です",
        }

    # Likeを作成
    insert_query = """
        INSERT INTO matching_requests (from_user_id, to_user_id, status, created_at)
        VALUES (?, ?, ?, NOW())
        RETURNING id
    """
    insert_map = [current_user["id"], payload.target_user_id, "pending"]
    new_match_id = execQuery.execute_insert(insert_query, insert_map, db)

    # 相手からのLikeがあるかチェック
    reverse_query = """
        SELECT * FROM matching_requests
        WHERE from_user_id = ? AND to_user_id = ? AND status = ?
          AND created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 1
    """
    reverse_map = [payload.target_user_id, current_user["id"], "pending"]
    reverse_results = execQuery.execute_select(reverse_query, reverse_map, db)

    if reverse_results:
        # 両方がLikeした場合はマッチング成立
        update_query = """
            UPDATE matching_requests SET status = ? WHERE id = ?
        """
        execQuery.execute_update(update_query, ["matched", new_match_id], db)
        execQuery.execute_update(update_query, ["matched", reverse_results[0]["id"]], db)

        # 返信率計算用: 承諾数を双方で+1
        accepted_upsert_query = """
            INSERT INTO matching_replies (user_id, accepted_count, replied_count, period_date)
            VALUES (?, 1, 0, CURRENT_DATE)
            ON CONFLICT (user_id, period_date)
            DO UPDATE SET accepted_count = matching_replies.accepted_count + 1
        """
        execQuery.execute_insert(accepted_upsert_query, [current_user["id"]], db)
        execQuery.execute_insert(accepted_upsert_query, [payload.target_user_id], db)

        # マッチング通知
        notification_query = """
            INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        """
        notification_map = [
            payload.target_user_id,
            current_user["id"],
            "マッチングが成立しました!",
            "match",
            False,
        ]
        execQuery.execute_insert(notification_query, notification_map, db)

        return {
            "status": "matched",
            "match_id": new_match_id,
            "message": "お互いにいいねしました！",
        }

    # いいね通知
    notification_query = """
        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    """
    notification_map = [
        payload.target_user_id,
        current_user["id"],
        "いいねが届きました",
        "like",
        False,
    ]
    execQuery.execute_insert(notification_query, notification_map, db)

    return {
        "status": "success",
        "action": "like",
        "match_id": new_match_id,
        "message": "いいねを送信しました",
    }


@router.post("/pass", response_model=PassActionResponse)
def pass_user(
    payload: MatchActionRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """パス送信"""

    _expire_old_pending_requests(db)

    if payload.target_user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot pass yourself")

    # 既存レコードをチェック（pending/matched/passedは重複作成しない。expiredは再作成可）
    query = """
        SELECT id, status FROM matching_requests
        WHERE from_user_id = ? AND to_user_id = ?
          AND status IN ('pending', 'matched', 'passed')
        ORDER BY created_at DESC
        LIMIT 1
    """
    map_params = [current_user["id"], payload.target_user_id]
    results = execQuery.execute_select(query, map_params, db)

    if results:
        return {
            "status": "already_exists",
            "action": "pass",
            "match_id": results[0]["id"],
            "message": "このユーザーへの操作は既に登録されています",
        }

    # Passを作成
    insert_query = """
        INSERT INTO matching_requests (from_user_id, to_user_id, status, created_at)
        VALUES (?, ?, ?, NOW())
        RETURNING id
    """
    insert_map = [current_user["id"], payload.target_user_id, "passed"]
    new_match_id = execQuery.execute_insert(insert_query, insert_map, db)

    return {
        "status": "success",
        "action": "pass",
        "match_id": new_match_id,
        "message": "見送りを反映しました",
    }
