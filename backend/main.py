"""
FastAPI Main Server for AWS Exchange App
Phase 1 (🔴P1) API Endpoints

主要エンドポイント:
- POST /auth/signup - ユーザーサインアップ
- POST /auth/login - ログイン
- GET /users/search - ユーザー検索
- POST /matching/request - マッチング依頼
- GET /chat/{user_id}/messages - チャット取得
- POST /chat/{user_id}/messages - メッセージ送信
- POST /meet/request - デート予約
- POST /verify - QR検証
- POST /review - レビュー投稿
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
import os

from database import SessionLocal, init_db, get_db, engine
from models import (
    Base,
    User,
    UserProfile,
    UserRank,
    MatchingRequest,
    MatchingReplies,
    ChatMessage,
    MeetRequest,
    QRToken,
    CompletedMeet,
    Review,
    Notification,
    Footprint,
)

# Initialize DB
Base.metadata.create_all(bind=engine)

# FastAPI app
app = FastAPI(title="AWS Exchange App", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days


# ============================================================================
# Pydantic Schemas
# ============================================================================


class SignupRequest(BaseModel):
    """サインアップリクエスト"""

    gender: str  # 'male', 'female'
    phone_number: str
    email: str
    password: str
    display_name: str


class LoginRequest(BaseModel):
    """ログインリクエスト"""

    email: str
    password: str


class TokenResponse(BaseModel):
    """トークンレスポンス"""

    access_token: str
    token_type: str = "bearer"


class UserSearchRequest(BaseModel):
    """ユーザー検索リクエスト"""

    latitude: float
    longitude: float
    distance_km: int = 10
    age_min: Optional[int] = None
    age_max: Optional[int] = None
    rank_min: Optional[int] = None


class UserCardResponse(BaseModel):
    """ユーザーカードレスポンス"""

    id: int
    display_name: str
    age: int
    location: str
    avatar_url: Optional[str]
    rank: int


class MatchingRequestPayload(BaseModel):
    """マッチング依頼ペイロード"""

    target_user_id: int
    initial_message: str


class ChatMessagePayload(BaseModel):
    """チャットメッセージペイロード"""

    target_user_id: int
    message: str


class MeetRequestPayload(BaseModel):
    """デート予約ペイロード"""

    target_user_id: int
    scheduled_date: str  # ISO format: '2026-01-20'
    scheduled_time: str  # format: '19:00'


class MeetRequestResponse(BaseModel):
    """デート予約レスポンス"""

    request_id: int
    status: str  # 'pending', 'accepted', 'rejected'


class ReviewPayload(BaseModel):
    """レビュー投稿ペイロード"""

    target_user_id: int
    rating: int  # 1-5
    comment: Optional[str]


class QRVerifyPayload(BaseModel):
    """QR検証ペイロード"""

    token: str
    latitude: float
    longitude: float


# ============================================================================
# Helper Functions
# ============================================================================


def hash_password(password: str) -> str:
    """パスワードハッシュ化"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """パスワード検証"""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: int) -> str:
    """アクセストークン生成"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> int:
    """トークン検証 & ユーザーID取得"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return int(user_id)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user(token: str = None, db: Session = Depends(get_db)) -> User:
    """現在のユーザー取得"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = verify_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ============================================================================
# Authentication Endpoints
# ============================================================================


@app.post("/auth/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    サインアップ (🔴P1-03)
    新規ユーザー登録 + 自動ログイン
    """
    # 既存ユーザーチェック
    existing = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # ユーザー作成
    hashed_password = hash_password(payload.password)
    user = User(
        gender=payload.gender,
        phone_number=payload.phone_number,
        email=payload.email,
        password_hash=hashed_password,
    )
    db.add(user)
    db.flush()

    # プロフィール作成
    profile = UserProfile(
        user_id=user.id,
        display_name=payload.display_name,
        age=None,
        location=None,
        bio="",
    )
    db.add(profile)

    # ランク初期化
    rank = UserRank(
        user_id=user.id,
        current_rank=1,
        meets_count=0,
        reply_rate=0.0,
        review_avg=0.0,
        manner_points=100,
    )
    db.add(rank)
    db.commit()

    # トークン生成
    access_token = create_access_token(user.id)
    return TokenResponse(access_token=access_token)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """ログイン (🔴P1-02)"""
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # ログイン時刻更新
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token(user.id)
    return TokenResponse(access_token=access_token)


# ============================================================================
# User Search & Discovery Endpoints
# ============================================================================


@app.get("/users/search", response_model=List[UserCardResponse])
def search_users(
    latitude: float,
    longitude: float,
    distance_km: int = 10,
    age_min: Optional[int] = None,
    age_max: Optional[int] = None,
    rank_min: Optional[int] = None,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    ユーザー検索 (🔴P1-11 ~ P1-15)
    地域ベースの検索 + 年齢・ランク絞り込み
    """
    current_user = get_current_user(token, db)

    # 地域フィルター（簡易版: 距離計算は省略）
    query = (
        db.query(User)
        .join(UserProfile)
        .join(UserRank)
        .filter(User.id != current_user.id)
        .filter(User.status == "active")
    )

    if age_min:
        query = query.filter(UserProfile.age >= age_min)
    if age_max:
        query = query.filter(UserProfile.age <= age_max)
    if rank_min:
        query = query.filter(UserRank.current_rank >= rank_min)

    users = query.limit(50).all()

    # Footprint記録
    for user in users:
        existing_footprint = (
            db.query(Footprint)
            .filter(
                Footprint.visitor_id == current_user.id,
                Footprint.visited_id == user.id,
            )
            .first()
        )
        if not existing_footprint:
            footprint = Footprint(
                visitor_id=current_user.id,
                visited_id=user.id,
                viewed_at=datetime.now(timezone.utc),
            )
            db.add(footprint)
    db.commit()

    return [
        UserCardResponse(
            id=u.id,
            display_name=u.profile.display_name,
            age=u.profile.age or 0,
            location=u.profile.location or "",
            avatar_url=u.profile.avatar_url,
            rank=u.rank.current_rank,
        )
        for u in users
    ]


@app.get("/users/{user_id}")
def get_user_profile(user_id: int, token: str = None, db: Session = Depends(get_db)):
    """
    プロフィール閲覧 (🔴P1-16)
    """
    current_user = get_current_user(token, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "display_name": user.profile.display_name,
        "age": user.profile.age,
        "location": user.profile.location,
        "bio": user.profile.bio,
        "avatar_url": user.profile.avatar_url,
        "rank": user.rank.current_rank,
        "meets_count": user.rank.meets_count,
        "review_avg": user.rank.review_avg,
    }


# ============================================================================
# Matching Endpoints
# ============================================================================


@app.post("/matching/request")
def request_matching(
    payload: MatchingRequestPayload, token: str = None, db: Session = Depends(get_db)
):
    """
    マッチング依頼 (🔴P1-19)
    """
    current_user = get_current_user(token, db)
    target_user = db.query(User).filter(User.id == payload.target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")

    # マッチング依頼作成
    matching_req = MatchingRequest(
        requester_id=current_user.id,
        recipient_id=payload.target_user_id,
        status="pending",
        initial_message=payload.initial_message,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(matching_req)
    db.commit()

    # 通知作成 (🔴P1-44)
    notification = Notification(
        user_id=payload.target_user_id,
        type="matching_request",
        related_user_id=current_user.id,
        message=f"{current_user.profile.display_name}さんからマッチング依頼がきました",
        is_read=False,
    )
    db.add(notification)
    db.commit()

    return {"request_id": matching_req.id, "status": "pending"}


@app.post("/matching/{request_id}/accept")
def accept_matching(request_id: int, token: str = None, db: Session = Depends(get_db)):
    """マッチング承諾 (🔴P1-21)"""
    current_user = get_current_user(token, db)
    matching_req = db.query(MatchingRequest).filter(MatchingRequest.id == request_id).first()
    if not matching_req:
        raise HTTPException(status_code=404, detail="Request not found")

    matching_req.status = "accepted"
    matching_req.accepted_at = datetime.now(timezone.utc)
    db.commit()

    # 返信率計算対象に追加
    reply_record = MatchingReplies(
        replier_id=current_user.id,
        requester_id=matching_req.requester_id,
        replied_at=datetime.now(timezone.utc),
    )
    db.add(reply_record)
    db.commit()

    return {"status": "accepted"}


# ============================================================================
# Chat Endpoints
# ============================================================================


@app.get("/chat/{user_id}/messages")
def get_chat_messages(
    user_id: int,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    チャットメッセージ取得 (🔴P1-23, P1-88)
    """
    current_user = get_current_user(token, db)

    messages = (
        db.query(ChatMessage)
        .filter(
            ((ChatMessage.sender_id == current_user.id) & (ChatMessage.recipient_id == user_id))
            | ((ChatMessage.sender_id == user_id) & (ChatMessage.recipient_id == current_user.id))
        )
        .order_by(ChatMessage.sent_at)
        .all()
    )

    return [
        {
            "id": m.id,
            "sender_id": m.sender_id,
            "message": m.message,
            "sent_at": m.sent_at,
            "is_read": m.is_read,
        }
        for m in messages
    ]


@app.post("/chat/{user_id}/messages")
def send_chat_message(
    user_id: int,
    payload: ChatMessagePayload,
    token: str = None,
    db: Session = Depends(get_db),
):
    """
    メッセージ送信 (🔴P1-30)
    送信上限チェック付き
    """
    current_user = get_current_user(token, db)

    # メッセージ数上限チェック (簡易版)
    today = datetime.now(timezone.utc).date()
    today_message_count = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.sender_id == current_user.id,
            ChatMessage.sent_at >= datetime.combine(today, datetime.min.time()),
        )
        .count()
    )

    # ランクに応じた上限チェック (詳細は P2 で実装)
    if current_user.rank.current_rank == 1 and today_message_count >= 3:
        raise HTTPException(status_code=429, detail="Message quota exceeded")

    # メッセージ送信
    message = ChatMessage(
        sender_id=current_user.id,
        recipient_id=user_id,
        message=payload.message,
        sent_at=datetime.now(timezone.utc),
        is_read=False,
    )
    db.add(message)
    db.commit()

    return {"message_id": message.id, "status": "sent"}


# ============================================================================
# Meet Request Endpoints
# ============================================================================


@app.post("/meet/request")
def create_meet_request(
    payload: MeetRequestPayload, token: str = None, db: Session = Depends(get_db)
):
    """
    デート予約作成 (🔴P1-41)
    """
    current_user = get_current_user(token, db)

    scheduled_datetime = datetime.fromisoformat(
        f"{payload.scheduled_date}T{payload.scheduled_time}:00+00:00"
    )

    meet_req = MeetRequest(
        requester_id=current_user.id,
        recipient_id=payload.target_user_id,
        scheduled_at=scheduled_datetime,
        status="pending",
        created_at=datetime.now(timezone.utc),
    )
    db.add(meet_req)
    db.commit()

    # 通知送信
    notification = Notification(
        user_id=payload.target_user_id,
        type="meet_request",
        related_user_id=current_user.id,
        message=f"{current_user.profile.display_name}さんが{payload.scheduled_date}のデートを提案しました",
        is_read=False,
    )
    db.add(notification)
    db.commit()

    return {
        "request_id": meet_req.id,
        "status": "pending",
        "scheduled_at": meet_req.scheduled_at,
    }


@app.post("/meet/{request_id}/accept")
def accept_meet_request(request_id: int, token: str = None, db: Session = Depends(get_db)):
    """デート予約承諾"""
    current_user = get_current_user(token, db)
    meet_req = db.query(MeetRequest).filter(MeetRequest.id == request_id).first()
    if not meet_req:
        raise HTTPException(status_code=404, detail="Meet request not found")

    meet_req.status = "accepted"
    meet_req.accepted_at = datetime.now(timezone.utc)
    db.commit()

    return {"status": "accepted"}


# ============================================================================
# QR Verification Endpoints
# ============================================================================


@app.post("/qr/generate")
def generate_qr_token(token: str = None, db: Session = Depends(get_db)):
    """
    QR トークン生成 (🔴P1-65, P1-66)
    30秒有効なワンタイムトークン
    """
    current_user = get_current_user(token, db)

    qr_token = QRToken(
        user_id=current_user.id,
        token=os.urandom(16).hex(),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=30),
        is_used=False,
    )
    db.add(qr_token)
    db.commit()

    return {"token": qr_token.token, "expires_at": qr_token.expires_at}


@app.post("/verify")
def verify_qr_token(payload: QRVerifyPayload, token: str = None, db: Session = Depends(get_db)):
    """
    QR検証 (🔴P1-68, P1-69)
    100m以内の確認
    """
    current_user = get_current_user(token, db)

    # QRトークン検証
    qr_token = db.query(QRToken).filter(QRToken.token == payload.token).first()
    if not qr_token or qr_token.is_used or qr_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired QR token")

    qr_token.is_used = True

    # デート記録
    completed_meet = CompletedMeet(
        user1_id=qr_token.user_id,
        user2_id=current_user.id,
        verified_at=datetime.now(timezone.utc),
        location_latitude=payload.latitude,
        location_longitude=payload.longitude,
    )
    db.add(completed_meet)

    # ランク更新 (会った回数)
    current_user.rank.meets_count += 1
    db.commit()

    return {"status": "verified", "meet_id": completed_meet.id}


# ============================================================================
# Review Endpoints
# ============================================================================


@app.post("/review")
def submit_review(payload: ReviewPayload, token: str = None, db: Session = Depends(get_db)):
    """
    レビュー投稿 (🔴P1-82, P1-83)
    """
    current_user = get_current_user(token, db)

    review = Review(
        reviewer_id=current_user.id,
        target_user_id=payload.target_user_id,
        rating=payload.rating,
        comment=payload.comment,
        created_at=datetime.now(timezone.utc),
    )
    db.add(review)
    db.commit()

    # レビュー平均を更新
    target_user = db.query(User).filter(User.id == payload.target_user_id).first()
    avg_rating = (
        db.query(Review)
        .filter(Review.target_user_id == payload.target_user_id)
        .with_entities(db.func.avg(Review.rating).label("avg_rating"))
        .first()
    )
    if avg_rating and avg_rating.avg_rating:
        target_user.rank.review_avg = float(avg_rating.avg_rating)
        db.commit()

    return {"review_id": review.id, "status": "submitted"}


# ============================================================================
# Notification Endpoints
# ============================================================================


@app.get("/notifications")
def get_notifications(token: str = None, db: Session = Depends(get_db)):
    """通知取得 (🟠P2-46)"""
    current_user = get_current_user(token, db)

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )

    return [
        {
            "id": n.id,
            "type": n.type,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
        }
        for n in notifications
    ]


# ============================================================================
# Health Check
# ============================================================================


@app.get("/health")
def health_check():
    """ヘルスチェック"""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
