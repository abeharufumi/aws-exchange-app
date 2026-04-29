"""
Database connection configuration for AWS Exchange App
PostgreSQL connection setup using SQLAlchemy
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# 環境変数からDB接続情報を取得
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://user:password@localhost:5432/exchange_db",
)

# PostgreSQL接続エンジン作成
engine = create_engine(
    DATABASE_URL,
    echo=False,  # SQLログ（本番環境はFalse固定）
    pool_pre_ping=True,  # 接続確認
    pool_size=10,
    max_overflow=20,
)

# セッションファクトリ
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """依存性注入用：データベースセッション取得"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
