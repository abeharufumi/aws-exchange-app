"""AIチャットボット機能のテーブルを追加するマイグレーション"""

import os
import psycopg2


def main() -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    migration_sql = """
-- =========================================
-- AIコンシェルジュ機能 (AI Chatbot)
-- =========================================

-- AI会話セッション
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックスを作成（既存の場合はエラーを無視）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_chat_sessions_user_id') THEN
        CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_chat_sessions_updated_at') THEN
        CREATE INDEX idx_ai_chat_sessions_updated_at ON ai_chat_sessions(updated_at DESC);
    END IF;
END $$;

-- AIメッセージ履歴
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_chat_messages_session_id') THEN
        CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
    END IF;
END $$;

-- AIナレッジベース (RAG用)
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    content_embedding vector(1024),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_ai_knowledge_base_category') THEN
        CREATE INDEX idx_ai_knowledge_base_category ON ai_knowledge_base(category);
    END IF;
END $$;
"""

    conn = psycopg2.connect(database_url)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            cur.execute(migration_sql)
        conn.commit()
        print("✅ AIチャットボットテーブルのマイグレーションが完了しました")
    except Exception as e:
        conn.rollback()
        print(f"❌ マイグレーション失敗: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
