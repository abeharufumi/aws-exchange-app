"""
共通の依存性注入関数
認証、データベースセッションなど
"""

from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from utils.security import verify_token
import execQuery


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> dict:
    """現在のユーザー取得"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")

    query = """
        SELECT * FROM users WHERE id = ?
    """
    map_params = [user_id]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        raise HTTPException(status_code=404, detail="User not found")

    execQuery.execute_update(
        """
            UPDATE users
            SET last_active_at = NOW(),
                presence_status = 'online'
            WHERE id = ?
        """,
        [user_id],
        db,
    )

    return results[0]
