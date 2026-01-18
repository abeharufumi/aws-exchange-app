# データベース設計

## 推奨 DB：PostgreSQL

### 選択理由

| 項目                     | PostgreSQL               | MySQL            | Firebase       | 評価                  |
| ------------------------ | ------------------------ | ---------------- | -------------- | --------------------- |
| **初期コスト**           | 低（$5-15/月）           | 低（$5-10/月）   | 無料           | ほぼ同等              |
| **スケール時コスト**     | 中（$50-200/月@10k DAU） | 中（$50-150/月） | 高（$500+/月） | 🔴P1-P3 まで耐える    |
| **トランザクション強度** | ⭐⭐⭐⭐⭐               | ⭐⭐⭐⭐         | ⭐⭐           | **金銭計算必須**      |
| **複雑クエリ対応**       | ⭐⭐⭐⭐⭐               | ⭐⭐⭐⭐         | ⭐⭐⭐         | 返信率計算が複雑      |
| **JSON 柔軟性**          | JSONB 対応               | JSON 対応        | 標準機能       | 将来拡張に有利        |
| **ランク判定ロジック**   | 複雑な条件判定得意       | 中程度           | 弱い           | **P1 ランク機能必須** |

**結論**：PostgreSQL（AWS RDS または DigitalOcean）推奨。初期月 5-10 ドル、10,000 ユーザー時で月 50-80 ドル。

---

## 推奨テーブル構造

```sql
-- 1. ユーザー基本情報
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    gender VARCHAR(10),  -- 'male', 'female'
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'  -- 'active', 'suspended', 'deleted'
);

-- 2. ユーザープロフィール
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(50),
    age INT,
    location VARCHAR(100),  -- 都市
    bio TEXT,
    avatar_url VARCHAR(255),
    icon_frame_id INT,  -- アイコンフレーム
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 3. ユーザーランク（現在のランク状態）
CREATE TABLE user_ranks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_rank INT DEFAULT 1,  -- 1-5
    meets_count INT DEFAULT 0,  -- 会った回数
    reply_rate DECIMAL(5,2) DEFAULT 0,  -- 返信率 (%)
    review_avg DECIMAL(3,2) DEFAULT 0,  -- レビュー平均評価
    manner_points INT DEFAULT 100,  -- マナー点
    last_rank_update TIMESTAMP DEFAULT NOW(),
    promoted_at TIMESTAMP,
    demoted_at TIMESTAMP
);

-- 4. 返信数追跡（返信率計算用）
CREATE TABLE matching_replies (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    accepted_count INT DEFAULT 0,  -- マッチング承諾数
    replied_count INT DEFAULT 0,  -- 返信した数
    period_date DATE,  -- 集計期間（日付）
    UNIQUE(user_id, period_date)
);

-- 5. マッチング依頼
CREATE TABLE matching_requests (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    recipient_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    initial_message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'expired'
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
    INDEX(requester_id, created_at),
    INDEX(recipient_id, status)
);

-- 6. チャット（マッチング後）
CREATE TABLE chat_messages (
    id BIGSERIAL PRIMARY KEY,
    matching_id BIGINT NOT NULL,  -- matching_requests.id
    sender_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE,
    INDEX(matching_id, created_at),
    INDEX(sender_id, created_at)
);

-- 7. 約束（デート申し込み）
CREATE TABLE meet_requests (
    id BIGSERIAL PRIMARY KEY,
    matching_id BIGINT NOT NULL,
    proposer_id BIGINT REFERENCES users(id),  -- デートを申し込んだ側
    respondent_id BIGINT REFERENCES users(id),  -- 受け取り側
    scheduled_at TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'accepted', 'rejected', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT NOW(),
    responded_at TIMESTAMP,
    completed_at TIMESTAMP,
    proposer_location JSONB,  -- {"lat": 35.6762, "lng": 139.7674}
    respondent_location JSONB,
    INDEX(respondent_id, status),
    INDEX(scheduled_at)
);

-- 8. QRトークン（一時的）
CREATE TABLE qr_tokens (
    id BIGSERIAL PRIMARY KEY,
    meet_request_id BIGINT UNIQUE REFERENCES meet_requests(id),
    token_hash VARCHAR(255),
    issued_by_user_id BIGINT REFERENCES users(id),
    issued_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 seconds',
    verified_at TIMESTAMP,
    verified_by_user_id BIGINT,
    is_used BOOLEAN DEFAULT FALSE
);

-- 9. 完了したデート
CREATE TABLE completed_meets (
    id BIGSERIAL PRIMARY KEY,
    meet_request_id BIGINT UNIQUE REFERENCES meet_requests(id),
    user_a_id BIGINT REFERENCES users(id),
    user_b_id BIGINT REFERENCES users(id),
    completed_at TIMESTAMP DEFAULT NOW(),
    is_reported BOOLEAN DEFAULT FALSE,  -- ドタキャン報告
    INDEX(user_a_id, completed_at),
    INDEX(user_b_id, completed_at)
);

-- 10. レビュー
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    meet_id BIGINT REFERENCES completed_meets(id),
    reviewer_id BIGINT REFERENCES users(id),
    reviewed_user_id BIGINT REFERENCES users(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    points_multiplier DECIMAL(3,2),  -- 1.0, 0.1等
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(meet_id, reviewer_id),
    INDEX(reviewed_user_id)
);

-- 11. 通知
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),  -- 'matching_request', 'matching_accept', 'meet_request', 'footprint', etc
    related_user_id BIGINT,  -- 相手ユーザーID
    related_object_id BIGINT,  -- 関連オブジェクトID
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX(user_id, created_at)
);

-- 12. 足跡
CREATE TABLE footprints (
    id BIGSERIAL PRIMARY KEY,
    visitor_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    visited_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    visited_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(visitor_id, visited_user_id),  -- 同一ユーザーの重複排除
    INDEX(visited_user_id, visited_at)
);

-- 13. ブースト購入
CREATE TABLE boost_purchases (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    activated_at TIMESTAMP,
    expires_at TIMESTAMP,  -- 30分後
    price_jpy INT,  -- 課金額
    payment_status VARCHAR(20),  -- 'pending', 'completed', 'failed'
    INDEX(user_id, expires_at)
);

-- 14. プレミアム購読
CREATE TABLE premium_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP,  -- NULL=継続中
    status VARCHAR(20),  -- 'active', 'expired', 'cancelled'
    monthly_price_jpy INT DEFAULT 980,
    last_charge_at TIMESTAMP,
    next_charge_at TIMESTAMP,
    INDEX(user_id, status)
);

-- 15. ギフト
CREATE TABLE gifts (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT REFERENCES users(id),
    recipient_id BIGINT REFERENCES users(id),
    gift_item_id INT,  -- アイテム種別
    sent_at TIMESTAMP DEFAULT NOW(),
    received_at TIMESTAMP,
    is_opened BOOLEAN DEFAULT FALSE,
    price_jpy INT,
    INDEX(recipient_id, received_at)
);

-- 16. 投げ銭/ギフト取引履歴
CREATE TABLE tipping_transactions (
    id BIGSERIAL PRIMARY KEY,
    sender_user_id BIGINT REFERENCES users(id),
    recipient_user_id BIGINT REFERENCES users(id),
    live_stream_id BIGINT,  -- 配信セッションID（NULLでもOK）
    amount_jpy INT,
    status VARCHAR(20) DEFAULT 'completed',  -- 'completed', 'refunded'
    occurred_at TIMESTAMP DEFAULT NOW(),
    settled_at TIMESTAMP,
    creator_revenue_jpy INT,  -- 70%のみ
    platform_revenue_jpy INT,  -- 30%
    INDEX(recipient_user_id, occurred_at)
);

-- 17. ライブ配信
CREATE TABLE live_streams (
    id BIGSERIAL PRIMARY KEY,
    broadcaster_id BIGINT REFERENCES users(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    title VARCHAR(255),
    viewer_count INT DEFAULT 0,
    status VARCHAR(20),  -- 'live', 'ended', 'archived'
    total_tipping_jpy INT DEFAULT 0,
    INDEX(broadcaster_id, started_at)
);

-- 18. ファンクラブ会員（月額課金）
CREATE TABLE fanclub_memberships (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    creator_id BIGINT REFERENCES users(id),  -- ファンクラブの所有者
    joined_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,  -- NULL=継続中
    status VARCHAR(20) DEFAULT 'active',  -- 'active', 'expired', 'cancelled'
    monthly_price_jpy INT DEFAULT 500,
    next_charge_at TIMESTAMP,
    INDEX(creator_id, joined_at),
    UNIQUE(member_id, creator_id)
);

-- 19. 通話チケット（Rank5男性向け販売）
CREATE TABLE call_tickets (
    id BIGSERIAL PRIMARY KEY,
    seller_id BIGINT REFERENCES users(id),
    ticket_duration_minutes INT,  -- 5, 10, 15分等
    price_jpy INT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX(seller_id)
);

-- 20. 通話チケット購入履歴
CREATE TABLE call_ticket_purchases (
    id BIGSERIAL PRIMARY KEY,
    buyer_id BIGINT REFERENCES users(id),
    ticket_id BIGINT REFERENCES call_tickets(id),
    purchased_at TIMESTAMP DEFAULT NOW(),
    used_at TIMESTAMP,
    amount_jpy INT,
    seller_id BIGINT REFERENCES users(id),  -- denormalize for analytics
    INDEX(buyer_id),
    INDEX(seller_id, used_at)
);

-- 21. 月次売上集計（P3向け）
CREATE TABLE monthly_revenue (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    year_month DATE,  -- '2026-01-01'形式で月を表現
    boost_revenue_jpy INT DEFAULT 0,
    premium_revenue_jpy INT DEFAULT 0,
    fanclub_revenue_jpy INT DEFAULT 0,
    gift_revenue_jpy INT DEFAULT 0,
    tipping_revenue_jpy INT DEFAULT 0,
    ticket_revenue_jpy INT DEFAULT 0,
    total_revenue_jpy INT DEFAULT 0,
    creator_payout_70_jpy INT,  -- 70%
    platform_payout_30_jpy INT,  -- 30%
    settled_at TIMESTAMP,
    UNIQUE(user_id, year_month)
);

-- 22. ユーザー統計（KPI追跡）
CREATE TABLE user_statistics (
    id BIGSERIAL PRIMARY KEY,
    date DATE,
    dau INT,  -- Daily Active Users
    matched_pairs INT,  -- その日のマッチング成功数
    completed_meets INT,  -- その日のデート完了数
    total_users INT,  -- 累計ユーザー数
    avg_arpu DECIMAL(10,2),  -- 平均ARPU
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(date)
);
```

---

## 維持費見積もり（AWS RDS PostgreSQL）

| ユーザー数         | インスタンス                   | 月額コスト | 備考                |
| ------------------ | ------------------------------ | ---------- | ------------------- |
| **初期段階**（P1） | db.t3.micro（1GB）             | $10        | 無料枠外            |
| **5,000 DAU**      | db.t3.small（2GB）             | $25        | 1 ヶ月 500 万行程度 |
| **10,000 DAU**     | db.t3.small（2GB）+ EBS 100GB  | $50        | ターゲットスケール  |
| **20,000 DAU**     | db.t3.medium（4GB）+ EBS 200GB | $100       | P3 展開時           |

### 総コスト（初年度）

- **P1（1-3 ヶ月）**：$10/月 × 3 = $30
- **P2（3-6 ヶ月）**：$25/月 × 3 = $75
- **P3（6-12 ヶ月）**：$50/月 × 6 = $300
- **年間合計**：約$400（4 万円）

---

## スケーリング戦略（10k→50k DAU）

| フェーズ         | 対応策                                                 |
| ---------------- | ------------------------------------------------------ |
| **10k DAU 時点** | マスターのみ、EBS 自動拡張                             |
| **20k DAU**      | 読み取りレプリカ追加（分析・通知用）                   |
| **50k DAU**      | シャーディング（ユーザー ID 別）またはインスタンス分離 |
