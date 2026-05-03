-- Test Data Seeder for AWS Exchange App
-- テスト用データを投入するSQLスクリプト
-- 実行方法: psql -U postgres -d aws_exchange_app -f seed.sql

-- 既存データをクリア
TRUNCATE TABLE notifications, reviews, completed_meets, meet_requests, 
               chat_messages, matching_requests, footprints, 
               user_ranks, user_profiles, users 
RESTART IDENTITY CASCADE;

-- ユーザー作成
-- パスワードは全て "password" のハッシュ値
-- 男性: ID 1-12 (Rank3: 1-2, Rank2: 3-5, Rank1: 6-9, Rank0: 10-12)
-- 女性: ID 13-24 (Rank3: 13-14, Rank2: 15-17, Rank1: 18-21, Rank0: 22-24)
INSERT INTO users (id, gender, phone_number, email, password_hash, status) VALUES
-- 男性 Rank3
(1, 'male', '09001111111', 'kazu@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(2, 'male', '09001111112', 'yuki@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank2
(3, 'male', '09001111113', 'taro@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(4, 'male', '09001111114', 'jiro@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(5, 'male', '09001111115', 'saburo@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank1
(6, 'male', '09001111116', 'masaru@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(7, 'male', '09001111117', 'hideo@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(8, 'male', '09001111118', 'takeshi@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(9, 'male', '09001111119', 'noboru@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank0 (タンク帯)
(10, 'male', '09001111120', 'shin@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(11, 'male', '09001111121', 'daichi@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(12, 'male', '09001111122', 'kaito@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank3
(13, 'female', '09002222222', 'ai@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(14, 'female', '09002222223', 'mei@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank2
(15, 'female', '09002222224', 'yuki_f@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(16, 'female', '09002222225', 'sakura@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(17, 'female', '09002222226', 'yumi@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank1
(18, 'female', '09002222227', 'hanako@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(19, 'female', '09002222228', 'kaori@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(20, 'female', '09002222229', 'tomoe@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(21, 'female', '09002222230', 'chiyo@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank0 (タンク帯)
(22, 'female', '09002222231', 'asuka@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(23, 'female', '09002222232', 'mika@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(24, 'female', '09002222233', 'riko@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active');

-- プロフィール作成
INSERT INTO user_profiles (user_id, display_name, age, location, bio) VALUES
-- 男性 Rank3
(1, 'Kazu', 35, 'Tokyo', '都内で経営者をしています。週末空いてます。'),
(2, 'Yuki', 38, 'Minato', 'アパレル業界で働いています。'),
-- 男性 Rank2
(3, 'Taro', 32, 'Shibuya', 'フリーランスのデザイナーです。'),
(4, 'Jiro', 29, 'Shinjuku', 'IT企業のエンジニア。週末は映画鑑賞。'),
(5, 'Saburo', 31, 'Chiyoda', 'マーケティング業務。ランニングが趣味です。'),
-- 男性 Rank1
(6, 'Masaru', 27, 'Tokyo', 'Web制作の仕事をしています。'),
(7, 'Hideo', 26, 'Shibuya', '営業職です。社交好きです。'),
(8, 'Takeshi', 30, 'Minato', '金融関係の仕事。料理が得意。'),
(9, 'Noboru', 28, 'Shinjuku', 'コンサルタント。新しい出会い求めてます。'),
-- 男性 Rank0
(10, 'Shin', 24, 'Tokyo', '大学院生です。'),
(11, 'Daichi', 25, 'Chiyoda', '新入社員。何でも興味あります。'),
(12, 'Kaito', 26, 'Shibuya', 'フリーターです。'),
-- 女性 Rank3
(13, 'Ai', 28, 'Tokyo', '美味しいご飯とお酒が好きです！'),
(14, 'Mei', 30, 'Minato', 'ファッションブロガー。おしゃれなお店探すのが好き。'),
-- 女性 Rank2
(15, 'Yuki_f', 27, 'Shibuya', '医師です。仕事は忙しいですが週末は自由。'),
(16, 'Sakura', 25, 'Shinjuku', 'CA志望。旅行好きです。'),
(17, 'Yumi', 29, 'Chiyoda', 'フリーランスのライター。'),
-- 女性 Rank1
(18, 'Hanako', 26, 'Shinjuku', 'OLです。新しい出会いを探しています。'),
(19, 'Kaori', 24, 'Tokyo', '大学生。将来は起業を考えてます。'),
(20, 'Tomoe', 28, 'Minato', '看護師。子猫ちゃん好きです。'),
(21, 'Chiyo', 23, 'Shibuya', '美容師。ヘアスタイル相談も乗ります。'),
-- 女性 Rank0
(22, 'Asuka', 22, 'Tokyo', 'デザイン系の大学生。'),
(23, 'Mika', 25, 'Shinjuku', '新卒OL。同年代の男性と仲良くなりたい。'),
(24, 'Riko', 21, 'Shibuya', '高等専修学校生。');

-- ランク作成
INSERT INTO user_ranks (user_id, current_rank, meets_count, reply_rate, review_avg, manner_points) VALUES
-- 男性 Rank3 (経験者・信頼度高)
(1, 3, 15, 92.0, 4.6, 100),
(2, 3, 12, 88.0, 4.4, 100),
-- 男性 Rank2 (通常)
(3, 2, 7, 85.0, 4.2, 100),
(4, 2, 6, 83.0, 4.1, 100),
(5, 2, 8, 86.0, 4.3, 100),
-- 男性 Rank1 (初級)
(6, 1, 3, 75.0, 3.8, 100),
(7, 1, 2, 70.0, 3.5, 100),
(8, 1, 4, 80.0, 4.0, 100),
(9, 1, 1, 60.0, 3.0, 100),
-- 男性 Rank0 (タンク帯)
(10, 0, 0, 0.0, 0.0, 100),
(11, 0, 0, 0.0, 0.0, 100),
(12, 0, 0, 0.0, 0.0, 100),
-- 女性 Rank3 (経験者・信頼度高)
(13, 3, 18, 94.0, 4.7, 100),
(14, 3, 14, 90.0, 4.5, 100),
-- 女性 Rank2 (通常)
(15, 2, 9, 87.0, 4.2, 100),
(16, 2, 5, 82.0, 4.0, 100),
(17, 2, 10, 89.0, 4.4, 100),
-- 女性 Rank1 (初級)
(18, 1, 5, 80.0, 4.1, 100),
(19, 1, 2, 72.0, 3.6, 100),
(20, 1, 3, 75.0, 3.9, 100),
(21, 1, 1, 65.0, 3.2, 100),
-- 女性 Rank0 (タンク帯)
(22, 0, 0, 0.0, 0.0, 100),
(23, 0, 0, 0.0, 0.0, 100),
(24, 0, 0, 0.0, 0.0, 100);

-- マッチング作成（複数パターン）
INSERT INTO matching_requests (id, from_user_id, to_user_id, status, created_at) VALUES
-- Rank3 × Rank3
(1, 1, 13, 'matched', NOW() - INTERVAL '5 days'),
(2, 13, 1, 'matched', NOW() - INTERVAL '5 days'),
(3, 2, 14, 'matched', NOW() - INTERVAL '3 days'),
(4, 14, 2, 'matched', NOW() - INTERVAL '3 days'),
-- Rank2 × Rank2
(5, 3, 15, 'matched', NOW() - INTERVAL '2 days'),
(6, 15, 3, 'matched', NOW() - INTERVAL '2 days'),
(7, 4, 16, 'matched', NOW() - INTERVAL '1 day'),
(8, 16, 4, 'matched', NOW() - INTERVAL '1 day'),
-- Rank1 × Rank1
(9, 6, 18, 'matched', NOW() - INTERVAL '12 hours'),
(10, 18, 6, 'matched', NOW() - INTERVAL '12 hours'),
(11, 7, 19, 'matched', NOW() - INTERVAL '6 hours'),
(12, 19, 7, 'matched', NOW() - INTERVAL '6 hours'),
-- Rank0 × Rank0
(13, 10, 22, 'pending', NOW() - INTERVAL '2 hours'),
(14, 11, 23, 'pending', NOW() - INTERVAL '1 hour'),
-- 異なるランク間
(15, 5, 17, 'matched', NOW() - INTERVAL '4 hours'),
(16, 17, 5, 'matched', NOW() - INTERVAL '4 hours');

-- チャットメッセージ作成（複数カップル）
INSERT INTO chat_messages (sender_id, receiver_id, message, sent_at, is_read) VALUES
-- Kazu (1) ⇔ Ai (13)
(1, 13, 'こんにちは！一緒にご飯でも行きませんか？', NOW() - INTERVAL '2 hours', true),
(13, 1, 'いいですね！明日はどうですか？', NOW() - INTERVAL '1 hour 50 minutes', true),
(1, 13, '明日19時に渋谷で会いませんか？', NOW() - INTERVAL '1 hour 30 minutes', false),
-- Yuki (2) ⇔ Mei (14)
(2, 14, 'ブログ見させてもらいました！素敵ですね。', NOW() - INTERVAL '3 days', true),
(14, 2, 'ありがとうございます！今度お店紹介してください。', NOW() - INTERVAL '2 days 23 hours', true),
(2, 14, 'もちろん！今週末一緒に行きましょう。', NOW() - INTERVAL '1 day', false),
-- Taro (3) ⇔ Yuki_f (15)
(3, 15, 'はじめまして。デザイナーをしています。', NOW() - INTERVAL '2 days', true),
(15, 3, 'はじめまして。医師です。よろしくお願いします。', NOW() - INTERVAL '1 day 23 hours', true),
-- Jiro (4) ⇔ Sakura (16)
(4, 16, 'CAなんですか！素敵ですね。', NOW() - INTERVAL '1 day', true),
(16, 4, 'ありがとうございます！今度旅行の話聞かせてください。', NOW() - INTERVAL '12 hours', true),
-- Masaru (6) ⇔ Hanako (18)
(6, 18, 'Web制作の仕事をしています。OLさんと仲良くなりたいです。', NOW() - INTERVAL '12 hours', true),
(18, 6, 'いいですね！何か教えてください。', NOW() - INTERVAL '6 hours', true),
-- Hideo (7) ⇔ Kaori (19)
(7, 19, 'こんにちは！どんな趣味がありますか？', NOW() - INTERVAL '6 hours', true),
(19, 7, '大学で経営学を勉強中です。起業家の話聞きたいです。', NOW() - INTERVAL '3 hours', false);

-- デート予約作成（複数）
INSERT INTO meet_requests (from_user_id, to_user_id, scheduled_date, scheduled_time, status, created_at) VALUES
(1, 13, CURRENT_DATE + 1, '19:00', 'accepted', NOW()),
(3, 15, CURRENT_DATE + 2, '18:30', 'accepted', NOW()),
(4, 16, CURRENT_DATE + 3, '20:00', 'pending', NOW()),
(6, 18, CURRENT_DATE + 1, '17:00', 'accepted', NOW() - INTERVAL '3 hours'),
(2, 14, CURRENT_DATE + 4, '19:30', 'accepted', NOW());

-- 通知作成（複数ユーザー）
INSERT INTO notifications (user_id, content, type, is_read, created_at) VALUES
-- User 1 (Kazu) への通知
(1, 'Aiさんとマッチングしました！', 'match', true, NOW() - INTERVAL '5 days'),
(1, 'Aiさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '30 minutes'),
(1, '明日19:00に渋谷でお会いします', 'meet', false, NOW() - INTERVAL '1 hour'),
-- User 13 (Ai) への通知
(13, 'Kazuさんとマッチングしました！', 'match', true, NOW() - INTERVAL '5 days'),
(13, 'Kazuさんからメッセージが来ました', 'message', true, NOW() - INTERVAL '1 hour 30 minutes'),
-- User 2 (Yuki) への通知
(2, 'Meiさんとマッチングしました！', 'match', true, NOW() - INTERVAL '3 days'),
(2, 'Meiさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '23 hours'),
-- User 15 (Yuki_f) への通知
(15, 'Taroさんからメッセージが来ました', 'message', true, NOW() - INTERVAL '1 day 23 hours'),
-- User 3 (Taro) への通知
(3, 'Yuki_fさんとマッチングしました！', 'match', true, NOW() - INTERVAL '2 days'),
-- User 4 (Jiro) への通知
(4, 'Sakuraさんとマッチングしました！', 'match', true, NOW() - INTERVAL '1 day'),
(4, 'Sakuraさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '12 hours'),
-- User 6 (Masaru) への通知
(6, 'Hanakoさんとマッチングしました！', 'match', true, NOW() - INTERVAL '12 hours'),
(6, 'Hanakoさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '6 hours'),
-- User 18 (Hanako) への通知
(18, 'Masaruさんとマッチングしました！', 'match', true, NOW() - INTERVAL '12 hours'),
(18, 'Masaruさんからメッセージが来ました', 'message', true, NOW() - INTERVAL '6 hours'),
-- Rank0 ユーザーへの通知
(10, '誰かがあなたを検索中です！', 'notification', false, NOW() - INTERVAL '2 hours'),
(22, '新しいユーザーがアプリに参加しました', 'notification', false, NOW() - INTERVAL '1 hour');

-- シーケンスをリセット
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('matching_requests_id_seq', (SELECT MAX(id) FROM matching_requests));

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✨ テストデータ投入完了！';
    RAISE NOTICE '👤 ユーザー: 24件（男性12名、女性12名）';
    RAISE NOTICE '  └─ Rank3: 4名（男性2名、女性2名）';
    RAISE NOTICE '  └─ Rank2: 6名（男性3名、女性3名）';
    RAISE NOTICE '  └─ Rank1: 8名（男性4名、女性4名）';
    RAISE NOTICE '  └─ Rank0: 6名（男性3名、女性3名）';
    RAISE NOTICE '💬 チャット: 14件';
    RAISE NOTICE '📅 デート: 5件';
    RAISE NOTICE '🔔 通知: 14件';
    RAISE NOTICE '🔗 マッチング: 16件';
END $$;
