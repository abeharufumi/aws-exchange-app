"""
SQLAlchemy ORM Models for AWS Exchange App
Phase 1 (🔴P1) Implementation

このファイルには以下のP1機能を実装：
- ログイン・マッチング・チャット
- QR会検証
- 基本レビュー・ランク1-2
- 本人確認フロー
"""

from sqlalchemy import (
    Column,
    Integer,
    BigInteger,
    String,
    Text,
    Boolean,
    DateTime,
    Numeric,
    ForeignKey,
    UniqueConstraint,
    Index,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime, timezone


class User(Base):
    """ユーザー基本情報 (🔴P1-01)"""

    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    gender = Column(String(10), nullable=False)  # 'male', 'female'
    phone_number = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    last_login = Column(DateTime)
    status = Column(String(20), default="active")  # 'active', 'suspended', 'deleted'

    # リレーション
    profile = relationship(
        "UserProfile", uselist=False, back_populates="user", cascade="all, delete-orphan"
    )
    rank = relationship(
        "UserRank", uselist=False, back_populates="user", cascade="all, delete-orphan"
    )

    # マッチング関連
    sent_matching_requests = relationship(
        "MatchingRequest", foreign_keys="MatchingRequest.requester_id", back_populates="requester"
    )
    received_matching_requests = relationship(
        "MatchingRequest", foreign_keys="MatchingRequest.recipient_id", back_populates="recipient"
    )

    # チャット関連
    sent_messages = relationship(
        "ChatMessage", foreign_keys="ChatMessage.sender_id", back_populates="sender"
    )

    # デート関連
    proposed_meets = relationship(
        "MeetRequest", foreign_keys="MeetRequest.proposer_id", back_populates="proposer"
    )
    received_meets = relationship(
        "MeetRequest", foreign_keys="MeetRequest.respondent_id", back_populates="respondent"
    )

    # QR検証関連
    issued_qr_tokens = relationship(
        "QRToken", foreign_keys="QRToken.issued_by_user_id", back_populates="issued_by_user"
    )
    verified_qr_tokens = relationship(
        "QRToken", foreign_keys="QRToken.verified_by_user_id", back_populates="verified_by_user"
    )

    # 完了デート関連
    completed_meets_a = relationship(
        "CompletedMeet", foreign_keys="CompletedMeet.user_a_id", back_populates="user_a"
    )
    completed_meets_b = relationship(
        "CompletedMeet", foreign_keys="CompletedMeet.user_b_id", back_populates="user_b"
    )

    # レビュー関連
    sent_reviews = relationship(
        "Review", foreign_keys="Review.reviewer_id", back_populates="reviewer"
    )
    received_reviews = relationship(
        "Review", foreign_keys="Review.reviewed_user_id", back_populates="reviewed_user"
    )

    # 通知関連
    notifications = relationship(
        "Notification", back_populates="user", cascade="all, delete-orphan"
    )

    # 足跡関連
    sent_footprints = relationship(
        "Footprint", foreign_keys="Footprint.visitor_id", back_populates="visitor"
    )
    received_footprints = relationship(
        "Footprint", foreign_keys="Footprint.visited_user_id", back_populates="visited_user"
    )


class UserProfile(Base):
    """ユーザープロフィール (🔴P1-16)"""

    __tablename__ = "user_profiles"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    display_name = Column(String(50), index=True)
    age = Column(Integer)
    location = Column(String(100), index=True)  # 都市
    bio = Column(Text)
    avatar_url = Column(String(255))
    icon_frame_id = Column(Integer)  # アイコンフレーム（P2で実装）
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="profile")


class UserRank(Base):
    """ユーザーランク（現在のランク状態） (🔴P1-111, 🔴P1-112)"""

    __tablename__ = "user_ranks"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    current_rank = Column(Integer, default=1)  # 1-5
    meets_count = Column(Integer, default=0)  # 会った回数
    reply_rate = Column(Numeric(5, 2), default=0)  # 返信率 (%)
    review_avg = Column(Numeric(3, 2), default=0)  # レビュー平均評価
    manner_points = Column(Integer, default=100)  # マナー点
    last_rank_update = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    promoted_at = Column(DateTime)
    demoted_at = Column(DateTime)

    user = relationship("User", back_populates="rank")


class MatchingReplies(Base):
    """返信数追跡（返信率計算用） (🔴P1-31, 🔴P1-32)"""

    __tablename__ = "matching_replies"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    accepted_count = Column(Integer, default=0)  # マッチング承諾数
    replied_count = Column(Integer, default=0)  # 返信した数
    period_date = Column(DateTime, nullable=False)  # 集計期間

    __table_args__ = (UniqueConstraint("user_id", "period_date", name="uq_user_period"),)


class MatchingRequest(Base):
    """マッチング依頼 (🔴P1-17, 🔴P1-19)"""

    __tablename__ = "matching_requests"

    id = Column(BigInteger, primary_key=True, index=True)
    requester_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    recipient_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    initial_message = Column(Text, nullable=False)
    status = Column(String(20), default="pending")  # 'pending', 'accepted', 'rejected', 'expired'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    responded_at = Column(DateTime)
    expires_at = Column(DateTime, nullable=False, index=True)

    requester = relationship(
        "User", foreign_keys=[requester_id], back_populates="sent_matching_requests"
    )
    recipient = relationship(
        "User", foreign_keys=[recipient_id], back_populates="received_matching_requests"
    )
    chat_messages = relationship(
        "ChatMessage", back_populates="matching", cascade="all, delete-orphan"
    )
    meet_request = relationship(
        "MeetRequest", uselist=False, back_populates="matching", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_requester_created", "requester_id", "created_at"),
        Index("idx_recipient_status", "recipient_id", "status"),
    )


class ChatMessage(Base):
    """チャット（マッチング後） (🔴P1-23, 🔴P1-30)"""

    __tablename__ = "chat_messages"

    id = Column(BigInteger, primary_key=True, index=True)
    matching_id = Column(
        BigInteger,
        ForeignKey("matching_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    message_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_read = Column(Boolean, default=False)

    matching = relationship("MatchingRequest", back_populates="chat_messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")

    __table_args__ = (Index("idx_matching_created", "matching_id", "created_at"),)


class MeetRequest(Base):
    """約束（デート申し込み） (🔴P1-39, 🔴P1-41)"""

    __tablename__ = "meet_requests"

    id = Column(BigInteger, primary_key=True, index=True)
    matching_id = Column(
        BigInteger, ForeignKey("matching_requests.id", ondelete="CASCADE"), nullable=False
    )
    proposer_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    respondent_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    scheduled_at = Column(DateTime, nullable=False, index=True)
    status = Column(
        String(20), default="pending"
    )  # 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime)
    completed_at = Column(DateTime)
    proposer_location = Column(JSON)  # {"lat": 35.6762, "lng": 139.7674}
    respondent_location = Column(JSON)

    matching = relationship("MatchingRequest", back_populates="meet_request")
    proposer = relationship("User", foreign_keys=[proposer_id], back_populates="proposed_meets")
    respondent = relationship("User", foreign_keys=[respondent_id], back_populates="received_meets")
    qr_token = relationship(
        "QRToken", uselist=False, back_populates="meet_request", cascade="all, delete-orphan"
    )
    completed_meet = relationship(
        "CompletedMeet", uselist=False, back_populates="meet_request", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("idx_respondent_status", "respondent_id", "status"),
        Index("idx_scheduled", "scheduled_at"),
    )


class QRToken(Base):
    """QRトークン（一時的） (🔴P1-65, 🔴P1-66)"""

    __tablename__ = "qr_tokens"

    id = Column(BigInteger, primary_key=True, index=True)
    meet_request_id = Column(
        BigInteger, ForeignKey("meet_requests.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    token_hash = Column(String(255), nullable=False)
    issued_by_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    issued_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime, nullable=False)
    verified_at = Column(DateTime)
    verified_by_user_id = Column(BigInteger, ForeignKey("users.id"))
    is_used = Column(Boolean, default=False)

    meet_request = relationship("MeetRequest", back_populates="qr_token")
    issued_by_user = relationship(
        "User", foreign_keys=[issued_by_user_id], back_populates="issued_qr_tokens"
    )
    verified_by_user = relationship(
        "User", foreign_keys=[verified_by_user_id], back_populates="verified_qr_tokens"
    )


class CompletedMeet(Base):
    """完了したデート (🔴P1-69)"""

    __tablename__ = "completed_meets"

    id = Column(BigInteger, primary_key=True, index=True)
    meet_request_id = Column(
        BigInteger, ForeignKey("meet_requests.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    user_a_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    user_b_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    is_reported = Column(Boolean, default=False)  # ドタキャン報告

    meet_request = relationship("MeetRequest", back_populates="completed_meet")
    user_a = relationship("User", foreign_keys=[user_a_id], back_populates="completed_meets_a")
    user_b = relationship("User", foreign_keys=[user_b_id], back_populates="completed_meets_b")
    reviews = relationship("Review", back_populates="meet", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_user_a_completed", "user_a_id", "completed_at"),
        Index("idx_user_b_completed", "user_b_id", "completed_at"),
    )


class Review(Base):
    """レビュー (🔴P1-80, 🔴P1-83)"""

    __tablename__ = "reviews"

    id = Column(BigInteger, primary_key=True, index=True)
    meet_id = Column(
        BigInteger, ForeignKey("completed_meets.id", ondelete="CASCADE"), nullable=False
    )
    reviewer_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewed_user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text)
    points_multiplier = Column(Numeric(3, 2))  # 1.0, 0.1等
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    meet = relationship("CompletedMeet", back_populates="reviews")
    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="sent_reviews")
    reviewed_user = relationship(
        "User", foreign_keys=[reviewed_user_id], back_populates="received_reviews"
    )

    __table_args__ = (UniqueConstraint("meet_id", "reviewer_id", name="uq_meet_reviewer"),)


class Notification(Base):
    """通知 (🔴P1-44, 🟠P2-01)"""

    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    type = Column(
        String(50), nullable=False
    )  # 'matching_request', 'matching_accept', 'meet_request', 'footprint', etc
    related_user_id = Column(BigInteger)  # 相手ユーザーID
    related_object_id = Column(BigInteger)  # 関連オブジェクトID
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="notifications")


class Footprint(Base):
    """足跡 (🟠P2-17, 🟠P2-29)"""

    __tablename__ = "footprints"

    id = Column(BigInteger, primary_key=True, index=True)
    visitor_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visited_user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    visited_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    visitor = relationship("User", foreign_keys=[visitor_id], back_populates="sent_footprints")
    visited_user = relationship(
        "User", foreign_keys=[visited_user_id], back_populates="received_footprints"
    )

    __table_args__ = (UniqueConstraint("visitor_id", "visited_user_id", name="uq_visitor_visited"),)


# ============================================================================
# フェーズ 2 (🟠P2) テーブル
# ============================================================================
# ブースト・プレミアム・足跡詳細・受信設定等


class BoostPurchase(Base):
    """ブースト購入 (🟠P2-15, 🟠P2-53)"""

    __tablename__ = "boost_purchases"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    purchased_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    activated_at = Column(DateTime)
    expires_at = Column(DateTime, index=True)  # 30分後
    price_jpy = Column(Integer, nullable=False)  # 課金額
    payment_status = Column(String(20), default="pending")  # 'pending', 'completed', 'failed'

    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (Index("idx_user_expires", "user_id", "expires_at"),)


class PremiumSubscription(Base):
    """プレミアム購読 (🟠P2-14)"""

    __tablename__ = "premium_subscriptions"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ends_at = Column(DateTime)  # NULL=継続中
    status = Column(String(20), default="active")  # 'active', 'expired', 'cancelled'
    monthly_price_jpy = Column(Integer, default=980)
    last_charge_at = Column(DateTime)
    next_charge_at = Column(DateTime)

    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (Index("idx_user_status", "user_id", "status"),)


class ReceiveFilter(Base):
    """受信フィルター設定 (🟠P2-30, 🟠P2-32)"""

    __tablename__ = "receive_filters"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # 女性向けフィルター
    block_rank1 = Column(Boolean, default=False)  # Rank1 ブロック (R2+のみ受信)
    block_rank2 = Column(Boolean, default=False)  # Rank2 以下ブロック (R3+のみ受信)
    block_rank3 = Column(Boolean, default=False)  # Rank3 以下ブロック (R4+のみ受信)

    # 男性向けフィルター
    tribute_filter_enabled = Column(Boolean, default=False)  # ギフト贈答者のみ受信

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", foreign_keys=[user_id])


class IconFrame(Base):
    """アイコンフレーム (🟠P2-16, 🟠P2-41)"""

    __tablename__ = "icon_frames"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    image_url = Column(String(255), nullable=False)
    price_jpy = Column(Integer, nullable=False)  # 有料フレームの場合
    is_free = Column(Boolean, default=False)  # 無料フレーム
    rarity = Column(String(20), default="common")  # 'common', 'rare', 'epic', 'legendary'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 購入履歴
    purchases = relationship(
        "IconFramePurchase", back_populates="frame", cascade="all, delete-orphan"
    )


class IconFramePurchase(Base):
    """アイコンフレーム購入履歴 (🟠P2-16, 🟠P2-74)"""

    __tablename__ = "icon_frame_purchases"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    frame_id = Column(BigInteger, ForeignKey("icon_frames.id"), nullable=False)
    purchased_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    price_jpy = Column(Integer, nullable=False)
    payment_status = Column(String(20), default="pending")  # 'pending', 'completed', 'failed'

    user = relationship("User", foreign_keys=[user_id])
    frame = relationship("IconFrame", back_populates="purchases")

    __table_args__ = (Index("idx_user_purchased", "user_id", "purchased_at"),)


class MessageQuota(Base):
    """メッセージ送信上限追跡 (🟠P2-05～P2-13)"""

    __tablename__ = "message_quotas"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    quota_date = Column(DateTime, nullable=False)  # その日の日付

    # P1基本制限値
    base_quota = Column(Integer, nullable=False)  # Rank別の基本値

    # P2追加分
    boost_quota = Column(Integer, default=0)  # ブーストで追加された分
    premium_quota = Column(Integer, default=0)  # プレミアムで追加された分

    # 使用状況
    used_count = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (UniqueConstraint("user_id", "quota_date", name="uq_user_quota_date"),)


class BoostDisplayLog(Base):
    """ブースト表示順位ログ (🟠P2-57, 🟠P2-78～P2-81)"""

    __tablename__ = "boost_display_logs"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(
        BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    boost_id = Column(BigInteger, ForeignKey("boost_purchases.id"))

    # 表示順位
    display_rank = Column(String(20), nullable=False)  # 'God', 'PR', 'High', 'Mid', 'Low'
    display_position = Column(Integer)  # 表示順序（1位, 2位等）

    # ブースト期間
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)

    # インプレッション数
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    boost = relationship("BoostPurchase", foreign_keys=[boost_id])

    __table_args__ = (Index("idx_user_start_time", "user_id", "start_time"),)


# ============================================================================
# フェーズ 3 (🟡P3) テーブル
# ============================================================================
# ライブ配信・ファンクラブ・通話チケット・ギフト・投げ銭・月次決済


class LiveStream(Base):
    """ライブ配信 (🟡P3-02, 🟡P3-14, 🟡P3-43)"""

    __tablename__ = "live_streams"

    id = Column(BigInteger, primary_key=True, index=True)
    broadcaster_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    ended_at = Column(DateTime)
    title = Column(String(255))
    viewer_count = Column(Integer, default=0)
    status = Column(String(20), default="live")  # 'live', 'ended', 'archived'
    total_tipping_jpy = Column(Integer, default=0)

    broadcaster = relationship("User", foreign_keys=[broadcaster_id])
    tipping_transactions = relationship(
        "TippingTransaction", back_populates="live_stream", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_broadcaster_started", "broadcaster_id", "started_at"),)


class FanclubMembership(Base):
    """ファンクラブ会員（月額課金） (🟡P3-08, 🟡P3-49)"""

    __tablename__ = "fanclub_memberships"

    id = Column(BigInteger, primary_key=True, index=True)
    member_id = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    creator_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime)  # NULL=継続中
    status = Column(String(20), default="active")  # 'active', 'expired', 'cancelled'
    monthly_price_jpy = Column(Integer, default=500)
    next_charge_at = Column(DateTime)

    member = relationship("User", foreign_keys=[member_id])
    creator = relationship("User", foreign_keys=[creator_id])

    __table_args__ = (
        UniqueConstraint("member_id", "creator_id", name="uq_member_creator"),
        Index("idx_creator_joined", "creator_id", "joined_at"),
    )


class CallTicket(Base):
    """通話チケット（Rank5男性向け販売） (🟡P3-53, 🟡P3-22)"""

    __tablename__ = "call_tickets"

    id = Column(BigInteger, primary_key=True, index=True)
    seller_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    ticket_duration_minutes = Column(Integer, nullable=False)  # 5, 10, 15分等
    price_jpy = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    seller = relationship("User", foreign_keys=[seller_id])
    purchases = relationship(
        "CallTicketPurchase", back_populates="ticket", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("idx_seller_available", "seller_id", "is_available"),)


class CallTicketPurchase(Base):
    """通話チケット購入履歴 (🟡P3-25, 🟡P3-55)"""

    __tablename__ = "call_ticket_purchases"

    id = Column(BigInteger, primary_key=True, index=True)
    buyer_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    ticket_id = Column(BigInteger, ForeignKey("call_tickets.id"), nullable=False)
    seller_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    purchased_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    used_at = Column(DateTime)
    amount_jpy = Column(Integer, nullable=False)

    buyer = relationship("User", foreign_keys=[buyer_id])
    ticket = relationship("CallTicket", back_populates="purchases")
    seller = relationship("User", foreign_keys=[seller_id])

    __table_args__ = (
        Index("idx_buyer_used", "buyer_id", "used_at"),
        Index("idx_seller_used", "seller_id", "used_at"),
    )


class Gift(Base):
    """ギフト (🟡P3-27, 🟡P3-30, 🟡P3-35)"""

    __tablename__ = "gifts"

    id = Column(BigInteger, primary_key=True, index=True)
    sender_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    gift_item_id = Column(Integer, nullable=False)  # アイテム種別
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    received_at = Column(DateTime)
    is_opened = Column(Boolean, default=False)
    price_jpy = Column(Integer, nullable=False)

    sender = relationship("User", foreign_keys=[sender_id])
    recipient = relationship("User", foreign_keys=[recipient_id])

    __table_args__ = (Index("idx_recipient_received", "recipient_id", "received_at"),)


class TippingTransaction(Base):
    """投げ銭/ギフト取引履歴 (🟡P3-16, 🟡P3-18, 🟡P3-21)"""

    __tablename__ = "tipping_transactions"

    id = Column(BigInteger, primary_key=True, index=True)
    sender_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    recipient_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    live_stream_id = Column(BigInteger, ForeignKey("live_streams.id"))
    amount_jpy = Column(Integer, nullable=False)
    status = Column(String(20), default="completed")  # 'completed', 'refunded'
    occurred_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    settled_at = Column(DateTime)
    creator_revenue_jpy = Column(Integer)  # 70%のみ
    platform_revenue_jpy = Column(Integer)  # 30%

    sender = relationship("User", foreign_keys=[sender_user_id])
    recipient = relationship("User", foreign_keys=[recipient_user_id])
    live_stream = relationship("LiveStream", back_populates="tipping_transactions")

    __table_args__ = (Index("idx_recipient_occurred", "recipient_user_id", "occurred_at"),)


class MonthlyRevenue(Base):
    """月次売上集計（P3向け） (🟡P3-56, 🟡P3-62)"""

    __tablename__ = "monthly_revenue"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    year_month = Column(String(7), nullable=False)  # '2026-01'形式で月を表現

    # 収入源別集計
    boost_revenue_jpy = Column(Integer, default=0)
    premium_revenue_jpy = Column(Integer, default=0)
    fanclub_revenue_jpy = Column(Integer, default=0)
    gift_revenue_jpy = Column(Integer, default=0)
    tipping_revenue_jpy = Column(Integer, default=0)
    ticket_revenue_jpy = Column(Integer, default=0)

    # 合計・分配
    total_revenue_jpy = Column(Integer, default=0)
    creator_payout_70_jpy = Column(Integer)  # 70%
    platform_payout_30_jpy = Column(Integer)  # 30%
    settled_at = Column(DateTime)

    user = relationship("User", foreign_keys=[user_id])

    __table_args__ = (UniqueConstraint("user_id", "year_month", name="uq_user_year_month"),)


class UserStatistics(Base):
    """ユーザー統計（KPI追跡） (🟡P3-62, 🔴P1-102)"""

    __tablename__ = "user_statistics"

    id = Column(BigInteger, primary_key=True, index=True)
    date = Column(String(10), nullable=False, index=True)  # '2026-01-18'形式
    dau = Column(Integer, default=0)  # Daily Active Users
    matched_pairs = Column(Integer, default=0)  # その日のマッチング成功数
    completed_meets = Column(Integer, default=0)  # その日のデート完了数
    total_users = Column(Integer, default=0)  # 累計ユーザー数
    avg_arpu = Column(Numeric(10, 2), default=0)  # 平均ARPU
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (UniqueConstraint("date", name="uq_date"),)
