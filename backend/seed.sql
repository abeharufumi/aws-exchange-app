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
-- 男性: ID 1-14 (Rank5: 1, Rank4: 2, Rank3: 3-4, Rank2: 5-7, Rank1: 8-11, Rank0: 12-14)
-- 女性: ID 15-28 (Rank5: 15, Rank4: 16, Rank3: 17-18, Rank2: 19-21, Rank1: 22-25, Rank0: 26-28)
INSERT INTO users (id, gender, phone_number, email, password_hash, status) VALUES
-- 男性 Rank5
(1, 'male', '09001111111', 'kazu@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank4
(2, 'male', '09001111112', 'yuki@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank3
(3, 'male', '09001111113', 'taro@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(4, 'male', '09001111114', 'jiro@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank2
(5, 'male', '09001111115', 'saburo@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(6, 'male', '09001111116', 'masaru@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(7, 'male', '09001111117', 'hideo@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank1
(8, 'male', '09001111118', 'takeshi@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(9, 'male', '09001111119', 'noboru@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(10, 'male', '09001111120', 'shin@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(11, 'male', '09001111121', 'daichi@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 男性 Rank0 (タンク帯)
(12, 'male', '09001111122', 'kaito@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(13, 'male', '09001111123', 'kouki@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(14, 'male', '09001111124', 'sora@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank5
(15, 'female', '09002222222', 'ai@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank4
(16, 'female', '09002222223', 'mei@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank3
(17, 'female', '09002222224', 'yuki_f@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(18, 'female', '09002222225', 'sakura@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank2
(19, 'female', '09002222226', 'yumi@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(20, 'female', '09002222227', 'hanako@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(21, 'female', '09002222228', 'kaori@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank1
(22, 'female', '09002222229', 'tomoe@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(23, 'female', '09002222230', 'chiyo@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(24, 'female', '09002222231', 'asuka@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(25, 'female', '09002222232', 'mika@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
-- 女性 Rank0 (タンク帯)
(26, 'female', '09002222233', 'riko@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(27, 'female', '09002222234', 'hana@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active'),
(28, 'female', '09002222235', 'akane@example.com', '$2b$12$djsm0S/4NwLAVNtoaWjnOOzSNJI0iPRh8vtI92OJXB6Eh1amDLcGK', 'active');

-- プロフィール作成
INSERT INTO user_profiles (user_id, display_name, age, location, bio) VALUES
-- 男性 Rank5
(1, 'Kazu', 35, 'Tokyo', '都内で経営者をしています。週末空いてます。'),
-- 男性 Rank4
(2, 'Yuki', 38, 'Minato', 'アパレル業界で働いています。'),
-- 男性 Rank3
(3, 'Taro', 32, 'Shibuya', 'フリーランスのデザイナーです。'),
(4, 'Jiro', 29, 'Shinjuku', 'IT企業のエンジニア。週末は映画鑑賞。'),
-- 男性 Rank2
(5, 'Saburo', 31, 'Chiyoda', 'マーケティング業務。ランニングが趣味です。'),
(6, 'Masaru', 27, 'Tokyo', 'Web制作の仕事をしています。'),
(7, 'Hideo', 26, 'Shibuya', '営業職です。社交好きです。'),
-- 男性 Rank1
(8, 'Takeshi', 30, 'Minato', '金融関係の仕事。料理が得意。'),
(9, 'Noboru', 28, 'Shinjuku', 'コンサルタント。新しい出会い求めてます。'),
(10, 'Shin', 24, 'Tokyo', '大学院生です。'),
(11, 'Daichi', 25, 'Chiyoda', '新入社員。何でも興味あります。'),
-- 男性 Rank0
(12, 'Kaito', 26, 'Shibuya', 'フリーターです。'),
(13, 'Kouki', 23, 'Minato', '大学4年生。'),
(14, 'Sora', 22, 'Shinjuku', '専門学生。'),
-- 女性 Rank5
(15, 'Ai', 28, 'Tokyo', '美味しいご飯とお酒が好きです！'),
-- 女性 Rank4
(16, 'Mei', 30, 'Minato', 'ファッションブロガー。おしゃれなお店探すのが好き。'),
-- 女性 Rank3
(17, 'Yuki_f', 27, 'Shibuya', '医師です。仕事は忙しいですが週末は自由。'),
(18, 'Sakura', 25, 'Shinjuku', 'CA志望。旅行好きです。'),
-- 女性 Rank2
(19, 'Yumi', 29, 'Chiyoda', 'フリーランスのライター。'),
(20, 'Hanako', 26, 'Shinjuku', 'OLです。新しい出会いを探しています。'),
(21, 'Kaori', 24, 'Tokyo', '大学生。将来は起業を考えてます。'),
-- 女性 Rank1
(22, 'Tomoe', 28, 'Minato', '看護師。子猫ちゃん好きです。'),
(23, 'Chiyo', 23, 'Shibuya', '美容師。ヘアスタイル相談も乗ります。'),
(24, 'Asuka', 22, 'Tokyo', 'デザイン系の大学生。'),
(25, 'Mika', 25, 'Shinjuku', '新卒OL。同年代の男性と仲良くなりたい。'),
-- 女性 Rank0
(26, 'Riko', 21, 'Shibuya', '高等専修学校生。'),
(27, 'Hana', 20, 'Tokyo', 'アパレル販売員。'),
(28, 'Akane', 24, 'Minato', 'フリーター。');

-- ランク作成
INSERT INTO user_ranks (user_id, current_rank, meets_count, reply_rate, review_avg, manner_points) VALUES
-- 男性 Rank5 (最高ランク・VIP会員)
(1, 5, 50, 98.0, 4.9, 100),
-- 男性 Rank4 (プレミアム)
(2, 4, 35, 95.0, 4.8, 100),
-- 男性 Rank3 (経験者・信頼度高)
(3, 3, 15, 92.0, 4.6, 100),
(4, 3, 12, 88.0, 4.4, 100),
-- 男性 Rank2 (通常)
(5, 2, 7, 85.0, 4.2, 100),
(6, 2, 6, 83.0, 4.1, 100),
(7, 2, 8, 86.0, 4.3, 100),
-- 男性 Rank1 (初級)
(8, 1, 3, 75.0, 3.8, 100),
(9, 1, 2, 70.0, 3.5, 100),
(10, 1, 4, 80.0, 4.0, 100),
(11, 1, 1, 60.0, 3.0, 100),
-- 男性 Rank0 (タンク帯)
(12, 0, 0, 0.0, 0.0, 100),
(13, 0, 0, 0.0, 0.0, 100),
(14, 0, 0, 0.0, 0.0, 100),
-- 女性 Rank5 (最高ランク・VIP会員)
(15, 5, 55, 99.0, 4.9, 100),
-- 女性 Rank4 (プレミアム)
(16, 4, 40, 96.0, 4.8, 100),
-- 女性 Rank3 (経験者・信頼度高)
(17, 3, 18, 94.0, 4.7, 100),
(18, 3, 14, 90.0, 4.5, 100),
-- 女性 Rank2 (通常)
(19, 2, 9, 87.0, 4.2, 100),
(20, 2, 5, 82.0, 4.0, 100),
(21, 2, 10, 89.0, 4.4, 100),
-- 女性 Rank1 (初級)
(22, 1, 5, 80.0, 4.1, 100),
(23, 1, 2, 72.0, 3.6, 100),
(24, 1, 3, 75.0, 3.9, 100),
(25, 1, 1, 65.0, 3.2, 100),
-- 女性 Rank0 (タンク帯)
(26, 0, 0, 0.0, 0.0, 100),
(27, 0, 0, 0.0, 0.0, 100),
(28, 0, 0, 0.0, 0.0, 100);

-- マッチング作成（複数パターン）
INSERT INTO matching_requests (id, from_user_id, to_user_id, status, created_at) VALUES
-- Rank5 × Rank5
(1, 1, 15, 'matched', NOW() - INTERVAL '10 days'),
(2, 15, 1, 'matched', NOW() - INTERVAL '10 days'),
-- Rank4 × Rank4
(3, 2, 16, 'matched', NOW() - INTERVAL '8 days'),
(4, 16, 2, 'matched', NOW() - INTERVAL '8 days'),
-- Rank3 × Rank3
(5, 3, 17, 'matched', NOW() - INTERVAL '5 days'),
(6, 17, 3, 'matched', NOW() - INTERVAL '5 days'),
(7, 4, 18, 'matched', NOW() - INTERVAL '3 days'),
(8, 18, 4, 'matched', NOW() - INTERVAL '3 days'),
-- Rank2 × Rank2
(9, 5, 19, 'matched', NOW() - INTERVAL '2 days'),
(10, 19, 5, 'matched', NOW() - INTERVAL '2 days'),
(11, 6, 20, 'matched', NOW() - INTERVAL '1 day'),
(12, 20, 6, 'matched', NOW() - INTERVAL '1 day'),
-- Rank1 × Rank1
(13, 8, 22, 'matched', NOW() - INTERVAL '12 hours'),
(14, 22, 8, 'matched', NOW() - INTERVAL '12 hours'),
(15, 9, 23, 'matched', NOW() - INTERVAL '6 hours'),
(16, 23, 9, 'matched', NOW() - INTERVAL '6 hours'),
-- Rank0 × Rank0
(17, 12, 26, 'pending', NOW() - INTERVAL '2 hours'),
(18, 13, 27, 'pending', NOW() - INTERVAL '1 hour'),
-- 異なるランク間
(19, 7, 21, 'matched', NOW() - INTERVAL '4 hours'),
(20, 21, 7, 'matched', NOW() - INTERVAL '4 hours'),
(21, 11, 25, 'matched', NOW() - INTERVAL '3 hours'),
(22, 25, 11, 'matched', NOW() - INTERVAL '3 hours');

-- チャットメッセージ作成（複数カップル）
INSERT INTO chat_messages (sender_id, receiver_id, message, sent_at, is_read) VALUES
-- Kazu (1) ⇔ Ai (15)
(1, 15, 'こんにちは！一緒にご飯でも行きませんか？', NOW() - INTERVAL '2 hours', true),
(15, 1, 'いいですね！明日はどうですか？', NOW() - INTERVAL '1 hour 50 minutes', true),
(1, 15, '明日19時に渋谷で会いませんか？', NOW() - INTERVAL '1 hour 30 minutes', false),
-- Yuki (2) ⇔ Mei (16)
(2, 16, 'ブログ見させてもらいました！素敵ですね。', NOW() - INTERVAL '3 days', true),
(16, 2, 'ありがとうございます！今度お店紹介してください。', NOW() - INTERVAL '2 days 23 hours', true),
(2, 16, 'もちろん！今週末一緒に行きましょう。', NOW() - INTERVAL '1 day', false),
-- Taro (3) ⇔ Yuki_f (17)
(3, 17, 'はじめまして。デザイナーをしています。', NOW() - INTERVAL '2 days', true),
(17, 3, 'はじめまして。医師です。よろしくお願いします。', NOW() - INTERVAL '1 day 23 hours', true),
-- Jiro (4) ⇔ Sakura (18)
(4, 18, 'CAなんですか！素敵ですね。', NOW() - INTERVAL '1 day', true),
(18, 4, 'ありがとうございます！今度旅行の話聞かせてください。', NOW() - INTERVAL '12 hours', true),
-- Masaru (6) ⇔ Hanako (20)
(6, 20, 'Web制作の仕事をしています。OLさんと仲良くなりたいです。', NOW() - INTERVAL '12 hours', true),
(20, 6, 'いいですね！何か教えてください。', NOW() - INTERVAL '6 hours', true),
-- Hideo (7) ⇔ Chiyo (25)
(7, 25, 'こんにちは！どんな趣味がありますか？', NOW() - INTERVAL '6 hours', true),
(25, 7, '美容師なので、ヘアスタイルの相談も乗ります！', NOW() - INTERVAL '3 hours', false);

-- デート予約作成（複数）
INSERT INTO meet_requests (from_user_id, to_user_id, scheduled_date, scheduled_time, status, created_at) VALUES
(1, 15, CURRENT_DATE + 1, '19:00', 'accepted', NOW()),
(3, 17, CURRENT_DATE + 2, '18:30', 'accepted', NOW()),
(4, 18, CURRENT_DATE + 3, '20:00', 'pending', NOW()),
(6, 20, CURRENT_DATE + 1, '17:00', 'accepted', NOW() - INTERVAL '3 hours'),
(2, 16, CURRENT_DATE + 4, '19:30', 'accepted', NOW());

-- 通知作成（複数ユーザー）
INSERT INTO notifications (user_id, content, type, is_read, created_at) VALUES
-- User 1 (Kazu) への通知
(1, 'Aiさんとマッチングしました！', 'match', true, NOW() - INTERVAL '10 days'),
(1, 'Aiさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '30 minutes'),
(1, '明日19:00に渋谷でお会いします', 'meet', false, NOW() - INTERVAL '1 hour'),
-- User 15 (Ai) への通知
(15, 'Kazuさんとマッチングしました！', 'match', true, NOW() - INTERVAL '10 days'),
(15, 'Kazuさんからメッセージが来ました', 'message', true, NOW() - INTERVAL '1 hour 30 minutes'),
-- User 2 (Yuki) への通知
(2, 'Meiさんとマッチングしました！', 'match', true, NOW() - INTERVAL '8 days'),
(2, 'Meiさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '23 hours'),
-- User 17 (Yuki_f) への通知
(17, 'Taroさんからメッセージが来ました', 'message', true, NOW() - INTERVAL '1 day 23 hours'),
-- User 3 (Taro) への通知
(3, 'Yuki_fさんとマッチングしました！', 'match', true, NOW() - INTERVAL '5 days'),
-- User 4 (Jiro) への通知
(4, 'Sakuraさんとマッチングしました！', 'match', true, NOW() - INTERVAL '3 days'),
(4, 'Sakuraさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '12 hours'),
-- User 6 (Masaru) への通知
(6, 'Hanakoさんとマッチングしました！', 'match', true, NOW() - INTERVAL '12 hours'),
(6, 'Hanakoさんからメッセージが来ました', 'message', false, NOW() - INTERVAL '6 hours'),
-- User 20 (Hanako) への通知
(20, 'Masaruさんとマッチングしました！', 'match', true, NOW() - INTERVAL '12 hours'),
(20, 'Masaruさんからメッセージが来ました', 'message', true, NOW() - INTERVAL '6 hours'),
-- Rank0 ユーザーへの通知
(12, '誰かがあなたを検索中です！', 'notification', false, NOW() - INTERVAL '2 hours'),
(26, '新しいユーザーがアプリに参加しました', 'notification', false, NOW() - INTERVAL '1 hour');

-- アイコンフレームマスタ
INSERT INTO icon_frames (id, name, description, image_url, price_jpy, is_free, rarity) VALUES
(1, 'スタンダード', 'デフォルトのシンプルなフレーム', '/frames/standard.png', 0, true, 'common'),
(2, 'ゴールド', '輝くゴールドのフレーム', '/frames/gold.png', 300, false, 'rare'),
(3, 'シルバー', '上品なシルバーのフレーム', '/frames/silver.png', 200, false, 'uncommon'),
(4, 'ダイヤモンド', '最高級のダイヤモンドフレーム', '/frames/diamond.png', 500, false, 'legendary'),
(5, 'ハート', 'かわいいハートのフレーム', '/frames/heart.png', 100, false, 'common'),
(6, 'スター', '輝くスターのフレーム', '/frames/star.png', 150, false, 'uncommon'),
(7, 'フラワー', '華やかなフラワーフレーム', '/frames/flower.png', 100, false, 'common'),
(8, 'ロイヤル', '王冠をあしらったロイヤルフレーム', '/frames/royal.png', 400, false, 'rare');

-- シーケンスをリセット
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('matching_requests_id_seq', (SELECT MAX(id) FROM matching_requests));
SELECT setval('icon_frames_id_seq', (SELECT MAX(id) FROM icon_frames));

-- 完了メッセージ
DO $$
BEGIN
    RAISE NOTICE '✨ テストデータ投入完了！';
    RAISE NOTICE '👤 ユーザー: 28件（男性14名、女性14名）';
    RAISE NOTICE '  └─ Rank5: 2名（男性1名、女性1名）';
    RAISE NOTICE '  └─ Rank4: 2名（男性1名、女性1名）';
    RAISE NOTICE '  └─ Rank3: 4名（男性2名、女性2名）';
    RAISE NOTICE '  └─ Rank2: 6名（男性3名、女性3名）';
    RAISE NOTICE '  └─ Rank1: 8名（男性4名、女性4名）';
    RAISE NOTICE '  └─ Rank0: 6名（男性3名、女性3名）';
    RAISE NOTICE '💬 チャット: 14件';
    RAISE NOTICE '📅 デート: 5件';
    RAISE NOTICE '🔔 通知: 18件';
    RAISE NOTICE '🔗 マッチング: 22件';
END $$;
