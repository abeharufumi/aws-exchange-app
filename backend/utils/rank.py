"""
ランク昇格・降格共通ロジック
meets.py / reviews.py の双方から呼び出される
"""

from typing import Optional
from sqlalchemy.orm import Session
import execQuery


# ---------------------------------------------------------------------------
# ランク判定
# ---------------------------------------------------------------------------


def resolve_rank_by_metrics(
    reply_rate: float,
    meets_count: int,
    review_avg: float,
    manner_points: int,
) -> int:
    """
    会った回数・返信率・レビュー平均・マナー点から到達可能な最高ランクを算出。

    昇格条件 (mermaid.md 設計準拠):
      Rank 1 → 2 : meets_count >= 5,  reply_rate >= 80
      Rank 2 → 3 : meets_count >= 10, reply_rate >= 85, review_avg >= 3.5
      Rank 3 → 4 : meets_count >= 20, reply_rate >= 90, review_avg >= 4.0
      Rank 4 → 5 : meets_count >= 50, reply_rate >= 90, review_avg >= 4.5, manner_points >= 100
    """
    rank = 1

    if meets_count >= 5 and reply_rate >= 80.0:
        rank = 2
    if meets_count >= 10 and reply_rate >= 85.0 and review_avg >= 3.5:
        rank = 3
    if meets_count >= 20 and reply_rate >= 90.0 and review_avg >= 4.0:
        rank = 4
    if meets_count >= 50 and reply_rate >= 90.0 and review_avg >= 4.5 and manner_points >= 100:
        rank = 5

    return rank


def resolve_next_rank(
    current_rank: int,
    reply_rate: float,
    meets_count: int,
    review_avg: float,
    manner_points: int,
) -> int:
    """自動昇格のみ（降格はしない）"""
    resolved = resolve_rank_by_metrics(
        reply_rate=reply_rate,
        meets_count=meets_count,
        review_avg=review_avg,
        manner_points=manner_points,
    )
    return max(current_rank, resolved)


def build_rank_progress(
    current_rank: int,
    meets_count: int,
    reply_rate: float,
    review_avg: float,
    manner_points: int,
) -> dict:
    """次ランク到達までの進捗情報を返す"""
    requirements = {
        2: {
            "meets_count": 5,
            "reply_rate": 80.0,
            "review_avg": None,
            "manner_points": None,
        },
        3: {
            "meets_count": 10,
            "reply_rate": 85.0,
            "review_avg": 3.5,
            "manner_points": None,
        },
        4: {
            "meets_count": 20,
            "reply_rate": 90.0,
            "review_avg": 4.0,
            "manner_points": None,
        },
        5: {
            "meets_count": 50,
            "reply_rate": 90.0,
            "review_avg": 4.5,
            "manner_points": 100,
        },
    }

    if current_rank >= 5:
        return {
            "currentRank": int(current_rank),
            "nextRank": None,
            "isMaxRank": True,
            "items": [],
        }

    next_rank = current_rank + 1
    req = requirements.get(next_rank, requirements[5])

    items = [
        {
            "key": "meets_count",
            "label": "会った回数",
            "currentValue": int(meets_count),
            "requiredValue": int(req["meets_count"]),
            "unit": "回",
            "done": int(meets_count) >= int(req["meets_count"]),
        },
        {
            "key": "reply_rate",
            "label": "返信率",
            "currentValue": round(float(reply_rate), 1),
            "requiredValue": float(req["reply_rate"]),
            "unit": "%",
            "done": float(reply_rate) >= float(req["reply_rate"]),
        },
    ]

    if req["review_avg"] is not None:
        items.append(
            {
                "key": "review_avg",
                "label": "レビュー平均",
                "currentValue": round(float(review_avg), 2),
                "requiredValue": float(req["review_avg"]),
                "unit": "",
                "done": float(review_avg) >= float(req["review_avg"]),
            }
        )

    if req["manner_points"] is not None:
        items.append(
            {
                "key": "manner_points",
                "label": "マナー点",
                "currentValue": int(manner_points),
                "requiredValue": int(req["manner_points"]),
                "unit": "",
                "done": int(manner_points) >= int(req["manner_points"]),
            }
        )

    return {
        "currentRank": int(current_rank),
        "nextRank": int(next_rank),
        "isMaxRank": False,
        "items": items,
    }


# ---------------------------------------------------------------------------
# DB への反映
# ---------------------------------------------------------------------------


def recalculate_rank_for_user(
    user_id: int,
    db: Session,
    review_avg: Optional[float] = None,
    manner_points: Optional[int] = None,
) -> None:
    """
    現在の指標からランクを再計算して user_ranks を更新。
    review_avg / manner_points を上書きしたい場合は引数で渡す。
    昇格・降格の日時も記録する。
    """
    rank_query = """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rank_rows = execQuery.execute_select(rank_query, [user_id], db)
    if not rank_rows:
        return

    row = rank_rows[0]
    current_rank = int(row.get("current_rank") or 1)
    meets_count = int(row.get("meets_count") or 0)
    reply_rate = float(row.get("reply_rate") or 0.0)
    resolved_review_avg = (
        float(review_avg) if review_avg is not None else float(row.get("review_avg") or 0.0)
    )
    resolved_manner_points = (
        int(manner_points) if manner_points is not None else int(row.get("manner_points") or 0)
    )

    next_rank = resolve_rank_by_metrics(
        reply_rate=reply_rate,
        meets_count=meets_count,
        review_avg=resolved_review_avg,
        manner_points=resolved_manner_points,
    )
    # 自動昇格のみ（降格は noshow penalty 専用）
    next_rank = max(current_rank, next_rank)

    promoted = next_rank > current_rank
    demoted = next_rank < current_rank

    update_query = """
        UPDATE user_ranks
        SET review_avg    = ?,
            manner_points = ?,
            current_rank  = ?,
            last_rank_update = NOW(),
            promoted_at  = CASE WHEN ? THEN NOW() ELSE promoted_at END,
            demoted_at   = CASE WHEN ? THEN NOW() ELSE demoted_at  END
        WHERE user_id = ?
    """
    execQuery.execute_update(
        update_query,
        [resolved_review_avg, resolved_manner_points, next_rank, promoted, demoted, user_id],
        db,
    )


def apply_noshow_penalty(user_id: int, db: Session, penalty_points: int = 10) -> None:
    """ドタキャン報告時にマナー点を減点し、必要に応じて降格する"""
    rank_query = """
        SELECT current_rank, meets_count, reply_rate, review_avg, manner_points
        FROM user_ranks
        WHERE user_id = ?
        LIMIT 1
    """
    rank_rows = execQuery.execute_select(rank_query, [user_id], db)
    if not rank_rows:
        return

    row = rank_rows[0]
    review_avg_val = float(row.get("review_avg") or 0.0)
    manner_points_val = int(row.get("manner_points") or 0)

    new_manner_points = max(0, manner_points_val - penalty_points)
    recalculate_rank_for_user(
        user_id,
        db,
        review_avg=review_avg_val,
        manner_points=new_manner_points,
    )
