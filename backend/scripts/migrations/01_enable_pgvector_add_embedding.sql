-- ==========================================
-- AIレコメンド機能 (pgvector) マイグレーション
-- レビュー文やプロフィール情報をベクトル化するための機能追加
-- ==========================================

-- 1. pgvector エクステンションの有効化 (AWS RDS for PostgreSQL にも対応)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. user_profiles テーブルにベクトルを保存するカラムを追加
-- Amazon Titan Text Embeddings V2 などの標準次元数 (1024など) に合わせて定義
-- ※次元数が未確定の場合は単に vector と定義するか、1024と固定します
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS bio_embedding vector(1024);

-- 3. （オプション）高速な類似度検索（Cosine Similarity）のためのインデックスを作成
-- データ件数が数万件以上になった際に効果を発揮します
-- CREATE INDEX idx_user_profiles_bio_embedding ON user_profiles USING hnsw (bio_embedding vector_cosine_ops);
