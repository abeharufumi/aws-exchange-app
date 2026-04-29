"""
共通のクエリ実行モジュール
SQLクエリを実行するための共通関数を提供
"""

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Any, Optional


def _execute_query(query: str, params: Optional[List[Any]], db: Session):
    """
    クエリ実行の共通処理

    Args:
        query: 実行するSQLクエリ（?プレースホルダー）
        params: クエリパラメータのリスト
        db: データベースセッション

    Returns:
        実行結果
    """
    if params is None:
        params = []

    param_dict = {f"param{i+1}": val for i, val in enumerate(params)}

    formatted_query = query
    for i in range(len(params)):
        formatted_query = formatted_query.replace("?", f":param{i+1}", 1)

    return db.execute(text(formatted_query), param_dict)


def execute_select(query: str, params: Optional[List[Any]] = None, db: Session = None):
    """
    SELECTクエリを実行

    Args:
        query: 実行するSQLクエリ
        params: クエリパラメータのリスト
        db: データベースセッション

    Returns:
        クエリ結果のリスト（各行は辞書形式）
    """
    result = _execute_query(query, params, db)
    return [dict(row) for row in result.mappings()]


def execute_insert(query: str, params: Optional[List[Any]] = None, db: Session = None):
    """
    INSERTクエリを実行

    Args:
        query: 実行するSQLクエリ
        params: クエリパラメータのリスト
        db: データベースセッション

    Returns:
        挿入された行のID
    """
    result = _execute_query(query, params, db)
    db.commit()

    if result.returns_rows:
        row = result.fetchone()
        return row[0] if row else None
    return None


def execute_update(query: str, params: Optional[List[Any]] = None, db: Session = None):
    """
    UPDATEクエリを実行

    Args:
        query: 実行するSQLクエリ
        params: クエリパラメータのリスト
        db: データベースセッション

    Returns:
        更新された行数
    """
    result = _execute_query(query, params, db)
    db.commit()
    return result.rowcount


def execute_delete(query: str, params: Optional[List[Any]] = None, db: Session = None):
    """
    DELETEクエリを実行

    Args:
        query: 実行するSQLクエリ
        params: クエリパラメータのリスト
        db: データベースセッション

    Returns:
        削除された行数
    """
    result = _execute_query(query, params, db)
    db.commit()
    return result.rowcount
