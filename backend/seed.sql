-- Test Data Seeder for AWS Exchange App
-- テスト用データを投入するSQLスクリプト
-- 実行方法: psql -U postgres -d aws_exchange_app -f seed.sql

-- 既存データをクリア
TRUNCATE TABLE notifications, reviews, completed_meets, meet_requests, 
               chat_messages, matching_requests, footprints, 
               user_ranks, user_profiles, users 
RESTART IDENTITY CASCADE;

-- ユーザー作成
-- パスワードは全て "password123" のハッシュ値
INSERT INTO users (id, gender, phone_number, email, password_hash, status) VALUES
(1, 'male', '09001111111', 'kazu@example.com', '$2b$12$IJZ7UzkeJ.ydZY0G.4AY4.PgwNwripythh0.NiTOB595Se6KfTdre', 'active'),
(2, 'female', '09002222222', 'ai@example.com', '$2b$12$IJZ7UzkeJ.ydZY0G.4AY4.PgwNwripythh0.NiTOB595Se6KfTdre', 'active'),
(3, 'male', '09003333333', 'taro@example.com', '$2b$12$IJZ7UzkeJ.ydZY0G.4AY4.PgwNwripythh0.NiTOB595Se6KfTdre', 'active'),
(4, 'female', '09004444444', 'hanako@example.com', '$2b$12$IJZ7UzkeJ.ydZY0G.4AY4.PgwNwripythh0.NiTOB595Se6KfTdre', 'active');

-- プロフィール作成
INSERT INTO user_profiles (user_id, display_name, age, location, bio) VALUES
(1, 'Kazu', 35, 'Tokyo', '都内で経営者をしています。週末空いてます。'),
(2, 'Ai', 28, 'Tokyo', '美味しいご飯とお酒が好きです！'),
(3, 'Taro', 32, 'Shibuya', 'フリーランスのデザイナーです。'),
(4, 'Hanako', 26, 'Shinjuku', 'OLです。新しい出会いを探しています。');

-- ランク作成
INSERT INTO user_ranks (user_id, current_rank, meets_count, reply_rate, review_avg, manner_points) VALUES
(1, 3, 5, 85.0, 4.2, 100),
(2, 2, 2, 90.0, 4.5, 100),
(3, 1, 0, 0.0, 0.0, 100),
(4, 2, 3, 88.0, 4.1, 100);

-- マッチング作成（User1 ⇔ User2）
INSERT INTO matching_requests (id, from_user_id, to_user_id, status, created_at) VALUES
(1, 1, 2, 'matched', NOW() - INTERVAL '2 hours'),
(2, 2, 1, 'matched', NOW() - INTERVAL '2 hours');

-- チャットメッセージ作成
INSERT INTO chat_messages (sender_id, receiver_id, message, sent_at, is_read) VALUES
(1, 2, 'こんにちは！一緒にご飯でも行きませんか？', NOW() - INTERVAL '2 hours', true),
(2, 1, 'いいですね！明日はどうですか？', NOW() - INTERVAL '1 hour 50 minutes', true),
(1, 2, '明日19時に渋谷で会いませんか？', NOW() - INTERVAL '1 hour 30 minutes', false);

-- デート予約作成
INSERT INTO meet_requests (from_user_id, to_user_id, scheduled_date, scheduled_time, status, created_at) VALUES
(1, 2, CURRENT_DATE + 1, '19:00', 'accepted', NOW());

-- 通知作成
INSERT INTO notifications (user_id, content, type, is_read, created_at) VALUES
(1, 'Aiさんとマッチングしました！', 'match', false, NOW() - INTERVAL '1 hour'),
(1, 'Aiさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '30 minutes'),
(2, 'Kazuさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '1 hour 30 minutes');

-- シーケンスをリセット
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('matching_requests_id_seq', (SELECT MAX(id) FROM matching_requests));

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✨ テストデータ投入完了！';
    RAISE NOTICE '👤 ユーザー: 4件';
    RAISE NOTICE '💬 チャット: 3件';
    RAISE NOTICE '📅 デート: 1件';
    RAISE NOTICE '🔔 通知: 3件';
END $$;
