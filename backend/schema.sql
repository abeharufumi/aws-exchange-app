-- AWS Exchange App Database Schema
-- テーブル定義スクリプト
-- 実行方法: psql -U postgres -d aws_exchange_app -f schema.sql

-- 既存のテーブルを削除（開発環境のみ）
DROP TABLE IF EXISTS user_statistics CASCADE;
DROP TABLE IF EXISTS monthly_revenue CASCADE;
DROP TABLE IF EXISTS tipping_transactions CASCADE;
DROP TABLE IF EXISTS gifts CASCADE;
DROP TABLE IF EXISTS call_ticket_purchases CASCADE;
DROP TABLE IF EXISTS call_tickets CASCADE;
DROP TABLE IF EXISTS fanclub_memberships CASCADE;
DROP TABLE IF EXISTS live_streams CASCADE;
DROP TABLE IF EXISTS boost_display_logs CASCADE;
DROP TABLE IF EXISTS message_quotas CASCADE;
DROP TABLE IF EXISTS icon_frame_purchases CASCADE;
DROP TABLE IF EXISTS icon_frames CASCADE;
DROP TABLE IF EXISTS receive_filters CASCADE;
DROP TABLE IF EXISTS premium_subscriptions CASCADE;
DROP TABLE IF EXISTS boost_purchases CASCADE;
DROP TABLE IF EXISTS footprints CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS completed_meets CASCADE;
DROP TABLE IF EXISTS qr_tokens CASCADE;
DROP TABLE IF EXISTS meet_requests CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS matching_requests CASCADE;
DROP TABLE IF EXISTS matching_replies CASCADE;
DROP TABLE IF EXISTS user_ranks CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- Phase 1 (🔴P1) テーブル - MVP機能
-- ============================================================================

-- ユーザー基本情報
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    gender VARCHAR(10) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- ユーザープロフィール
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    age INTEGER,
    location VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(255),
    icon_frame_id INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_profiles_display_name ON user_profiles(display_name);
CREATE INDEX idx_user_profiles_location ON user_profiles(location);

-- ユーザーランク
CREATE TABLE user_ranks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_rank INTEGER DEFAULT 1,
    meets_count INTEGER DEFAULT 0,
    reply_rate NUMERIC(5, 2) DEFAULT 0,
    review_avg NUMERIC(3, 2) DEFAULT 0,
    manner_points INTEGER DEFAULT 100,
    last_rank_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    promoted_at TIMESTAMP,
    demoted_at TIMESTAMP
);

-- 返信数追跡（返信率計算用）
CREATE TABLE matching_replies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accepted_count INTEGER DEFAULT 0,
    replied_count INTEGER DEFAULT 0,
    period_date TIMESTAMP NOT NULL,
    UNIQUE(user_id, period_date)
);

CREATE INDEX idx_matching_replies_user_id ON matching_replies(user_id);

-- マッチング依頼
CREATE TABLE matching_requests (
    id BIGSERIAL PRIMARY KEY,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matching_requests_from_user ON matching_requests(from_user_id);
CREATE INDEX idx_matching_requests_to_user ON matching_requests(to_user_id);
CREATE INDEX idx_matching_requests_status ON matching_requests(status);

-- チャットメッセージ
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_chat_messages_sent_at ON chat_messages(sent_at);

-- デート予約
CREATE TABLE meet_requests (
    id BIGSERIAL PRIMARY KEY,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    meet_latitude DOUBLE PRECISION NOT NULL DEFAULT 33.589886,
    meet_longitude DOUBLE PRECISION NOT NULL DEFAULT 130.420685,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    qr_token_a VARCHAR(255),
    qr_token_b VARCHAR(255),
    qr_scanned_at TIMESTAMP
);

CREATE INDEX idx_meet_requests_from_user ON meet_requests(from_user_id);
CREATE INDEX idx_meet_requests_to_user ON meet_requests(to_user_id);
CREATE INDEX idx_meet_requests_status ON meet_requests(status);

-- 完了したデート
CREATE TABLE completed_meets (
    id BIGSERIAL PRIMARY KEY,
    meet_request_id BIGINT UNIQUE NOT NULL REFERENCES meet_requests(id) ON DELETE CASCADE,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- レビュー
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    meet_request_id BIGINT REFERENCES meet_requests(id) ON DELETE CASCADE,
    reviewer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE UNIQUE INDEX idx_reviews_meet_request_id_reviewer_id
ON reviews(meet_request_id, reviewer_id)
WHERE meet_request_id IS NOT NULL;

-- 通知
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    content TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- 足跡
CREATE TABLE footprints (
    id BIGSERIAL PRIMARY KEY,
    visitor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visited_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(visitor_id, visited_id)
);

CREATE INDEX idx_footprints_visitor ON footprints(visitor_id);
CREATE INDEX idx_footprints_visited ON footprints(visited_id);

-- ============================================================================
-- Phase 2 (🟠P2) テーブル - 拡大機能
-- ============================================================================

-- ブースト購入
CREATE TABLE boost_purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,
    price_jpy INTEGER NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending'
);

CREATE INDEX idx_boost_purchases_user_id ON boost_purchases(user_id);
CREATE INDEX idx_boost_purchases_expires_at ON boost_purchases(expires_at);

-- プレミアム購読
CREATE TABLE premium_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    monthly_price_jpy INTEGER DEFAULT 980,
    last_charge_at TIMESTAMP,
    next_charge_at TIMESTAMP
);

CREATE INDEX idx_premium_subscriptions_status ON premium_subscriptions(status);

-- 受信フィルター設定
CREATE TABLE receive_filters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    block_rank1 BOOLEAN DEFAULT FALSE,
    block_rank2 BOOLEAN DEFAULT FALSE,
    block_rank3 BOOLEAN DEFAULT FALSE,
    tribute_filter_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- アイコンフレーム
CREATE TABLE icon_frames (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    price_jpy INTEGER NOT NULL,
    is_free BOOLEAN DEFAULT FALSE,
    rarity VARCHAR(20) DEFAULT 'common',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- アイコンフレーム購入履歴
CREATE TABLE icon_frame_purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    frame_id BIGINT NOT NULL REFERENCES icon_frames(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    price_jpy INTEGER NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending'
);

CREATE INDEX idx_icon_frame_purchases_user ON icon_frame_purchases(user_id);

-- メッセージ送信上限追跡
CREATE TABLE message_quotas (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quota_date DATE NOT NULL,
    base_quota INTEGER NOT NULL,
    boost_quota INTEGER DEFAULT 0,
    premium_quota INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, quota_date)
);

CREATE INDEX idx_message_quotas_user_id ON message_quotas(user_id);

-- ブースト表示順位ログ
CREATE TABLE boost_display_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    boost_id BIGINT REFERENCES boost_purchases(id),
    display_rank VARCHAR(20) NOT NULL,
    display_position INTEGER,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_boost_display_logs_user ON boost_display_logs(user_id);

-- ============================================================================
-- Phase 3 (🟡P3) テーブル - 収益化機能
-- ============================================================================

-- ライブ配信
CREATE TABLE live_streams (
    id BIGSERIAL PRIMARY KEY,
    broadcaster_id BIGINT NOT NULL REFERENCES users(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    title VARCHAR(255),
    viewer_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'live',
    total_tipping_jpy INTEGER DEFAULT 0
);

CREATE INDEX idx_live_streams_broadcaster ON live_streams(broadcaster_id);

-- ファンクラブ会員
CREATE TABLE fanclub_memberships (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id BIGINT NOT NULL REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active',
    monthly_price_jpy INTEGER DEFAULT 500,
    next_charge_at TIMESTAMP,
    UNIQUE(member_id, creator_id)
);

CREATE INDEX idx_fanclub_memberships_creator ON fanclub_memberships(creator_id);

-- 通話チケット
CREATE TABLE call_tickets (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT NOT NULL REFERENCES users(id),
    ticket_duration_minutes INTEGER NOT NULL,
    price_jpy INTEGER NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_tickets_seller ON call_tickets(seller_id);

-- 通話チケット購入履歴
CREATE TABLE call_ticket_purchases (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT NOT NULL REFERENCES users(id),
    ticket_id BIGINT NOT NULL REFERENCES call_tickets(id),
    seller_id BIGINT NOT NULL REFERENCES users(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP,
    amount_jpy INTEGER NOT NULL
);

CREATE INDEX idx_call_ticket_purchases_buyer ON call_ticket_purchases(buyer_id);

-- ギフト
CREATE TABLE gifts (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id),
    recipient_id BIGINT NOT NULL REFERENCES users(id),
    gift_item_id INTEGER NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    received_at TIMESTAMP,
    is_opened BOOLEAN DEFAULT FALSE,
    price_jpy INTEGER NOT NULL
);

CREATE INDEX idx_gifts_recipient ON gifts(recipient_id);

-- 投げ銭/ギフト取引履歴
CREATE TABLE tipping_transactions (
    id BIGSERIAL PRIMARY KEY,
    sender_user_id BIGINT NOT NULL REFERENCES users(id),
    recipient_user_id BIGINT NOT NULL REFERENCES users(id),
    live_stream_id BIGINT REFERENCES live_streams(id),
    amount_jpy INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP,
    creator_revenue_jpy INTEGER,
    platform_revenue_jpy INTEGER
);

CREATE INDEX idx_tipping_transactions_recipient ON tipping_transactions(recipient_user_id);

-- 月次売上集計
CREATE TABLE monthly_revenue (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    year_month VARCHAR(7) NOT NULL,
    boost_revenue_jpy INTEGER DEFAULT 0,
    premium_revenue_jpy INTEGER DEFAULT 0,
    fanclub_revenue_jpy INTEGER DEFAULT 0,
    gift_revenue_jpy INTEGER DEFAULT 0,
    tipping_revenue_jpy INTEGER DEFAULT 0,
    ticket_revenue_jpy INTEGER DEFAULT 0,
    total_revenue_jpy INTEGER DEFAULT 0,
    creator_payout_70_jpy INTEGER,
    platform_payout_30_jpy INTEGER,
    settled_at TIMESTAMP,
    UNIQUE(user_id, year_month)
);

-- ユーザー統計（KPI追跡）
CREATE TABLE user_statistics (
    id BIGSERIAL PRIMARY KEY,
    date DATE UNIQUE NOT NULL,
    dau INTEGER DEFAULT 0,
    matched_pairs INTEGER DEFAULT 0,
    completed_meets INTEGER DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    avg_arpu NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_statistics_date ON user_statistics(date);

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✅ スキーマ作成完了！';
    RAISE NOTICE '📊 テーブル数: 31個';
    RAISE NOTICE '🔴 P1テーブル: 11個';
    RAISE NOTICE '🟠 P2テーブル: 8個';
    RAISE NOTICE '🟡 P3テーブル: 12個';
END $$;
