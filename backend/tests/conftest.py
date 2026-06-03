import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# モジュールインポート前に環境変数をテスト用に上書き
os.environ["DATABASE_URL"] = "postgresql://user:password@127.0.0.1:5432/exchange_test_db"
os.environ["SECRET_KEY"] = "test_super_secret"

# これらは環境変数を上書きした後にインポートする
from main import app
from database import get_db

TEST_DATABASE_URL_NO_DB = "postgresql://user:password@127.0.0.1:5432/exchange_db"
TEST_DATABASE_URL = os.environ["DATABASE_URL"]


@pytest.fixture(scope="session")
def setup_database():
    """セッションの開始時にテスト用データベースを作成し、スキーマを適用する"""
    # テスト用DBを作成（システムDBに接続して実行）
    engine_temp = create_engine(TEST_DATABASE_URL_NO_DB, isolation_level="AUTOCOMMIT")
    with engine_temp.connect() as conn:
        conn.execute(text("DROP DATABASE IF EXISTS exchange_test_db WITH (FORCE)"))
        conn.execute(text("CREATE DATABASE exchange_test_db"))
    engine_temp.dispose()

    # テスト用DBに接続してスキーマを流し込む
    test_engine = create_engine(TEST_DATABASE_URL)
    with test_engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        # schema.sql を適用
        schema_path = os.path.join(os.path.dirname(__file__), "..", "schema.sql")
        with open(schema_path, "r") as f:
            sql_script = f.read()
            # dbapiのカーソルを直接使用して複数文を一度に実行
            raw_conn = conn.connection
            with raw_conn.cursor() as cursor:
                cursor.execute(sql_script)
        conn.commit()

    yield test_engine

    # セッション終了後にテスト用DBを破棄
    test_engine.dispose()

    # engine_temp = create_engine(TEST_DATABASE_URL_NO_DB, isolation_level="AUTOCOMMIT")
    # with engine_temp.connect() as conn:
    #     conn.execute(text("DROP DATABASE IF EXISTS exchange_test_db WITH (FORCE)"))
    # engine_temp.dispose()


@pytest.fixture(scope="function")
def db_session(setup_database):
    """各テスト関数ごとにクリーンなDBセッションを提供する"""
    connection = setup_database.connect()
    transaction = connection.begin()

    # セッションファクトリ
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestingSessionLocal()

    yield session

    session.close()
    # トランザクションをロールバックしてデータベースを元の状態に戻す
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session):
    """DB依存性をオーバーライドしたテストクライアントを提供する"""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
