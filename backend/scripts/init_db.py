"""RDSにschema.sqlとseed.sqlを適用する初期化スクリプト"""

import os
from pathlib import Path

import psycopg2


def main() -> None:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is required")

    root = Path(__file__).resolve().parent.parent
    schema_sql = (root / "schema.sql").read_text(encoding="utf-8")
    seed_sql = (root / "seed.sql").read_text(encoding="utf-8")

    conn = psycopg2.connect(database_url)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            cur.execute(schema_sql)
            cur.execute(seed_sql)
        conn.commit()
        print("✅ schema.sql と seed.sql の適用が完了しました")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
