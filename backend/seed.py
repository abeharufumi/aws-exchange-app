from database import SessionLocal, engine
import models
from datetime import datetime, timezone

# DBセッション作成
db = SessionLocal()

print("💥 データベースを完全リセットします...")

try:
    # 1. すべてのテーブルを削除 (ドロップ)
    # これにより、次に create_all した時に新しい columns (comment等) が反映されます
    models.Base.metadata.drop_all(bind=engine)
    print("✅ 旧テーブル削除完了")

    # 2. テーブルを再作成
    models.Base.metadata.create_all(bind=engine)
    print("✅ 新テーブル作成完了")

except Exception as e:
    print(f"⚠️ リセット中にエラー: {e}")

print("🌱 テストデータ投入中...")

# ユーザー作成
user1 = models.User(
    username="kazu_t",
    email="kazu@example.com",
    hashed_password="hashed_secret",
    rank=5,
    meet_count=10,
    total_score=50,
    review_count=10,
    is_verified=True,
    comment="都内で経営者をしています。週末空いてます。",
)

user2 = models.User(
    username="recipient",
    email="recipient@example.com",
    hashed_password="hashed_secret",
    rank=1,
    comment="登録したてです。",
)

user3 = models.User(
    username="ai_chan",
    email="ai@example.com",
    hashed_password="hashed_secret",
    rank=3,
    meet_count=5,
    total_score=15,
    review_count=5,
    comment="美味しいご飯とお酒が好きです！",
)

db.add_all([user1, user2, user3])
db.commit()

print("✨ 初期データ投入完了！")
db.close()
