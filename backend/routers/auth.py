"""
認証関連のエンドポイント
サインアップ、ログイン
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from utils.security import hash_password, verify_password, create_access_token
import execQuery

router = APIRouter(prefix="/auth", tags=["authentication"])


def _normalize_email(email: str) -> str:
    """メールアドレスを認証用に正規化"""
    return (email or "").strip().lower()


class SignupRequest(BaseModel):
    """
    サインアップリクエスト

    Properties:
        email (str): メールアドレス
        password (str): パスワード
        gender (str): 性別 (male/female)
        display_name (str): 表示名
        phone_number (str, optional): 電話番号
    """

    gender: str  # 'male', 'female'
    email: str
    password: str
    display_name: str
    phone_number: Optional[str] = None  # オプショナル


class LoginRequest(BaseModel):
    """ログインリクエスト"""

    email: str
    password: str


class UserInfo(BaseModel):
    """
    ユーザー情報レスポンス

    Properties:
        id: ユーザーID
        email: メールアドレス
        gender: 性別 (male/female)
        displayName: 表示名
        avatarUrl: アバター画像URL（オプション）
    """

    id: int
    email: str
    gender: str
    displayName: str
    avatarUrl: Optional[str] = None


class TokenResponse(BaseModel):
    """
    トークンレスポンス

    Properties:
        access_token: JWTアクセストークン
        token_type: トークンタイプ (bearer)
        user: ユーザー情報
    """

    access_token: str
    token_type: str = "bearer"
    user: UserInfo


@router.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    """
    サインアップ (🔴P1-03)
    新規ユーザー登録 + 自動ログイン

    Parameters:
        email (str): メールアドレス
        password (str): パスワード
        gender (str): 性別 (male/female)
        display_name (str): 表示名
        phone_number (str, optional): 電話番号。未指定の場合は自動生成

    Returns:
        TokenResponse: アクセストークン + ユーザー情報
    """
    import uuid

    normalized_email = _normalize_email(payload.email)
    if not normalized_email or "@" not in normalized_email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    if payload.gender not in ("male", "female"):
        raise HTTPException(status_code=400, detail="Invalid gender")

    if len(payload.password or "") < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    # 既存ユーザーチェック
    query = """
        SELECT * FROM users WHERE LOWER(email) = LOWER(?)
    """
    map_params = [normalized_email]
    results = execQuery.execute_select(query, map_params, db)

    if results:
        raise HTTPException(status_code=400, detail="Email already registered")

    # phone_numberが指定されていない場合は自動生成
    phone_number = payload.phone_number or str(uuid.uuid4())[:15]

    # ユーザー作成
    hashed_password = hash_password(payload.password)
    user_query = """
        INSERT INTO users (gender, phone_number, email, password_hash, status)
        VALUES (?, ?, ?, ?, ?)
        RETURNING id
    """
    user_params = [payload.gender, phone_number, normalized_email, hashed_password, "active"]
    user_id = execQuery.execute_insert(user_query, user_params, db)

    # プロフィール作成
    profile_query = """
        INSERT INTO user_profiles (user_id, display_name, age, location, bio)
        VALUES (?, ?, ?, ?, ?)
    """
    profile_params = [user_id, payload.display_name, None, None, ""]
    execQuery.execute_insert(profile_query, profile_params, db)

    # ランク初期化
    rank_query = """
        INSERT INTO user_ranks (user_id, current_rank, meets_count, reply_rate, review_avg, manner_points)
        VALUES (?, ?, ?, ?, ?, ?)
    """
    rank_params = [user_id, 1, 0, 0.0, 0.0, 100]
    execQuery.execute_insert(rank_query, rank_params, db)

    # ユーザー情報を取得
    select_query = """
        SELECT u.id, u.email, u.gender, up.display_name, up.avatar_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = ?
    """
    select_params = [user_id]
    user_rows = execQuery.execute_select(select_query, select_params, db)

    if not user_rows:
        raise HTTPException(status_code=500, detail="Failed to retrieve user info")

    user_row = user_rows[0]

    # トークン生成
    access_token = create_access_token(user_id)
    return TokenResponse(
        access_token=access_token,
        user=UserInfo(
            id=user_row["id"],
            email=user_row["email"],
            gender=user_row["gender"],
            displayName=user_row["display_name"],
            avatarUrl=user_row["avatar_url"],
        ),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    ログイン (🔴P1-02)
    メールアドレスとパスワードで認証

    Parameters:
        email (str): メールアドレス
        password (str): パスワード

    Returns:
        TokenResponse: アクセストークン + ユーザー情報
    """
    normalized_email = _normalize_email(payload.email)
    if not normalized_email or "@" not in normalized_email:
        raise HTTPException(status_code=400, detail="Invalid email format")

    if len(payload.password or "") == 0:
        raise HTTPException(status_code=400, detail="Password is required")

    query = """
        SELECT u.id, u.email, u.gender, u.password_hash, u.status, up.display_name, up.avatar_url
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE LOWER(u.email) = LOWER(?)
    """
    map_params = [normalized_email]
    results = execQuery.execute_select(query, map_params, db)

    if not results:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    row = results[0]
    user_id = row["id"]
    password_hash = row["password_hash"]
    status = row["status"]

    if not password_hash or not isinstance(password_hash, str):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        is_valid_password = verify_password(payload.password, password_hash)
    except Exception:
        is_valid_password = False

    if not is_valid_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")

    # トークン生成
    access_token = create_access_token(user_id)
    return TokenResponse(
        access_token=access_token,
        user=UserInfo(
            id=row["id"],
            email=row["email"],
            gender=row["gender"],
            displayName=row["display_name"],
            avatarUrl=row["avatar_url"],
        ),
    )


@router.post("/logout")
def logout():
    """
    ログアウト
    クライアント側でトークンを破棄する方式のため、サーバー側は成功レスポンスのみ返す
    """

    return {"status": "ok"}
