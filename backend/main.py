"""
FastAPI Main Server for AWS Exchange App
エントリーポイント - ルーターを統合
"""

from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine, SessionLocal

# ルーターをインポート
from routers import (
    auth,
    users,
    matches,
    notifications,
    chat,
    meets,
    reviews,
    boost,
    premium,
    icon_frames,
    live_streams,
    fanclub,
    call_tickets,
    gifts,
)


def _expire_pending_matching_requests():
    """7日以上pending状態のマッチング依頼を自動期限切れに＋送信者へ通知"""
    db: Session = SessionLocal()
    try:
        # 期限切れ対象を取得
        select_query = text(
            """
            SELECT id, from_user_id, to_user_id FROM matching_requests
            WHERE status = 'pending'
              AND created_at < NOW() - INTERVAL '7 days'
            """
        )
        expired_rows = db.execute(select_query).fetchall()

        if expired_rows:
            # ステータスを expired に更新
            ids = [row[0] for row in expired_rows]
            db.execute(
                text("UPDATE matching_requests SET status = 'expired' WHERE id = ANY(:ids)"),
                {"ids": ids},
            )
            # 送信者へ通知
            for row in expired_rows:
                db.execute(
                    text(
                        """
                        INSERT INTO notifications (user_id, target_user_id, content, type, is_read, created_at)
                        VALUES (:uid, :target_user_id, :content, 'match_expired', FALSE, NOW())
                    """
                    ),
                    {
                        "uid": row[1],
                        "target_user_id": row[2],
                        "content": "送ったいいねの有効期限が切れました。再依頼できます",
                    },
                )
            db.commit()
            print(f"[Scheduler] {len(expired_rows)}件のマッチング依頼を期限切れにしました")
    except Exception as e:
        print(f"[Scheduler] expire job error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(application: FastAPI):
    """サーバー起動時にDBマイグレーションを自動実行"""
    try:
        with engine.connect() as conn:
            conn.execute(
                text(
                    "ALTER TABLE meet_requests "
                    "ADD COLUMN IF NOT EXISTS meet_latitude DOUBLE PRECISION "
                    "NOT NULL DEFAULT 33.589886"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE meet_requests "
                    "ADD COLUMN IF NOT EXISTS meet_longitude DOUBLE PRECISION "
                    "NOT NULL DEFAULT 130.420685"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE reviews "
                    "ADD COLUMN IF NOT EXISTS meet_request_id BIGINT "
                    "REFERENCES meet_requests(id) ON DELETE CASCADE"
                )
            )
            conn.execute(
                text(
                    "CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_meet_request_id_reviewer_id "
                    "ON reviews(meet_request_id, reviewer_id) "
                    "WHERE meet_request_id IS NOT NULL"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE notifications "
                    "ADD COLUMN IF NOT EXISTS target_user_id BIGINT "
                    "REFERENCES users(id) ON DELETE SET NULL"
                )
            )
            conn.commit()
    except Exception as e:
        print(f"[Migration] Warning: {e}")

    # マッチング依頼の7日期限切れジョブをスケジュール
    scheduler = AsyncIOScheduler()
    scheduler.add_job(_expire_pending_matching_requests, "interval", hours=6, id="expire_matching")
    scheduler.start()
    # 起動直後にも一度実行
    _expire_pending_matching_requests()

    yield

    scheduler.shutdown()


# FastAPI app
app = FastAPI(
    title="AWS Exchange App",
    version="1.0.0",
    redirect_slashes=False,
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ルーターを登録
app.include_router(auth.router)
app.include_router(auth.router, prefix="/api")
app.include_router(users.router)
app.include_router(matches.router)
app.include_router(notifications.router)
app.include_router(chat.router)
app.include_router(meets.router)
app.include_router(reviews.router)
app.include_router(boost.router)
app.include_router(premium.router)
app.include_router(icon_frames.router)
app.include_router(live_streams.router)
app.include_router(fanclub.router)
app.include_router(call_tickets.router)
app.include_router(gifts.router)


@app.get("/")
def root():
    """ルートエンドポイント"""
    return {"message": "AWS Exchange App API", "version": "1.0.0", "status": "running"}


@app.get("/health")
def health_check():
    """ヘルスチェック"""
    return {"status": "healthy"}
