"""
アイコンフレーム購入・管理エンドポイント
フレーム一覧取得、購入、装備管理
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from database import get_db
from utils.dependencies import get_current_user
import execQuery

router = APIRouter(prefix="/api/icon-frames", tags=["icon-frames"])


class IconFrameItem(BaseModel):
    """アイコンフレームアイテム"""

    id: int
    name: str
    description: Optional[str] = None
    image_url: str
    price_jpy: int  # 価格（円）。無料フレームは 0
    is_free: bool  # 無料フレームかどうか
    rarity: str  # 'common', 'rare', 'epic', 'legendary'
    is_owned: bool  # 所有済みかどうか（購入済みまたは無料）
    is_equipped: bool  # 現在装備中かどうか


class PurchaseResponse(BaseModel):
    """購入レスポンス"""

    purchase_id: int
    frame_id: int
    frame_name: str
    price_jpy: int
    status: str  # 'purchased': 購入成功, 'already_owned': 既に所有済み


class EquipResponse(BaseModel):
    """装備レスポンス"""

    frame_id: int
    status: str  # 'equipped': 装備成功


@router.get("", response_model=List[IconFrameItem])
def list_icon_frames(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """利用可能なアイコンフレーム一覧を取得（所有済み・装備中フラグ付き）"""
    user_id = current_user["id"]

    # 現在の装備フレームIDを取得
    profile_rows = execQuery.execute_select(
        "SELECT icon_frame_id FROM user_profiles WHERE user_id = ?",
        [user_id],
        db,
    )
    equipped_frame_id = profile_rows[0]["icon_frame_id"] if profile_rows else None

    # 全フレーム一覧 + 所有済みフラグ（無料フレームは常に所有済み）
    rows = execQuery.execute_select(
        """
        SELECT f.id, f.name, f.description, f.image_url, f.price_jpy, f.is_free, f.rarity,
               CASE WHEN p.id IS NOT NULL OR f.is_free = TRUE THEN TRUE ELSE FALSE END AS is_owned
        FROM icon_frames f
        LEFT JOIN icon_frame_purchases p
            ON p.frame_id = f.id AND p.user_id = ? AND p.payment_status = 'completed'
        ORDER BY f.price_jpy ASC, f.id ASC
        """,
        [user_id],
        db,
    )

    result = []
    for row in rows:
        result.append(
            IconFrameItem(
                id=row["id"],
                name=row["name"],
                description=row.get("description"),
                image_url=row["image_url"],
                price_jpy=row["price_jpy"],
                is_free=bool(row["is_free"]),
                rarity=row["rarity"],
                is_owned=bool(row["is_owned"]),
                is_equipped=(equipped_frame_id == row["id"]),
            )
        )
    return result


@router.get("/my-frames", response_model=List[IconFrameItem])
def my_icon_frames(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """所有済みアイコンフレーム一覧を取得（無料フレーム含む）"""
    user_id = current_user["id"]

    profile_rows = execQuery.execute_select(
        "SELECT icon_frame_id FROM user_profiles WHERE user_id = ?",
        [user_id],
        db,
    )
    equipped_frame_id = profile_rows[0]["icon_frame_id"] if profile_rows else None

    rows = execQuery.execute_select(
        """
        SELECT DISTINCT f.id, f.name, f.description, f.image_url, f.price_jpy, f.is_free, f.rarity
        FROM icon_frames f
        WHERE f.is_free = TRUE
           OR EXISTS (
               SELECT 1 FROM icon_frame_purchases p
               WHERE p.frame_id = f.id AND p.user_id = ? AND p.payment_status = 'completed'
           )
        ORDER BY f.price_jpy ASC, f.id ASC
        """,
        [user_id],
        db,
    )

    result = []
    for row in rows:
        result.append(
            IconFrameItem(
                id=row["id"],
                name=row["name"],
                description=row.get("description"),
                image_url=row["image_url"],
                price_jpy=row["price_jpy"],
                is_free=bool(row["is_free"]),
                rarity=row["rarity"],
                is_owned=True,
                is_equipped=(equipped_frame_id == row["id"]),
            )
        )
    return result


@router.post("/purchase/{frame_id}", response_model=PurchaseResponse)
def purchase_icon_frame(
    frame_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """アイコンフレームを購入"""
    user_id = current_user["id"]

    # フレーム存在確認
    frame_rows = execQuery.execute_select(
        "SELECT id, name, price_jpy, is_free FROM icon_frames WHERE id = ?",
        [frame_id],
        db,
    )
    if not frame_rows:
        raise HTTPException(status_code=404, detail="フレームが見つかりません")

    frame = frame_rows[0]

    # 無料フレームは購入不要
    if frame["is_free"]:
        raise HTTPException(
            status_code=400,
            detail="このフレームは無料です。装備するだけで使用できます",
        )

    # 既に所有済みか確認
    existing = execQuery.execute_select(
        """
        SELECT id FROM icon_frame_purchases
        WHERE user_id = ? AND frame_id = ? AND payment_status = 'completed'
        """,
        [user_id, frame_id],
        db,
    )
    if existing:
        return PurchaseResponse(
            purchase_id=existing[0]["id"],
            frame_id=frame_id,
            frame_name=frame["name"],
            price_jpy=frame["price_jpy"],
            status="already_owned",
        )

    # 購入記録を挿入（RETURNING id で purchase_id を取得）
    purchase_id = execQuery.execute_insert(
        """
        INSERT INTO icon_frame_purchases (user_id, frame_id, purchased_at, price_jpy, payment_status)
        VALUES (?, ?, NOW(), ?, 'completed')
        RETURNING id
        """,
        [user_id, frame_id, frame["price_jpy"]],
        db,
    )

    return PurchaseResponse(
        purchase_id=purchase_id or 0,
        frame_id=frame_id,
        frame_name=frame["name"],
        price_jpy=frame["price_jpy"],
        status="purchased",
    )


@router.post("/equip/{frame_id}", response_model=EquipResponse)
def equip_icon_frame(
    frame_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """アイコンフレームを装備（user_profiles.icon_frame_id を更新）"""
    user_id = current_user["id"]

    # フレーム存在確認
    frame_rows = execQuery.execute_select(
        "SELECT id, is_free FROM icon_frames WHERE id = ?",
        [frame_id],
        db,
    )
    if not frame_rows:
        raise HTTPException(status_code=404, detail="フレームが見つかりません")

    frame = frame_rows[0]

    # 所有確認（無料フレームはスキップ）
    if not frame["is_free"]:
        owned = execQuery.execute_select(
            """
            SELECT id FROM icon_frame_purchases
            WHERE user_id = ? AND frame_id = ? AND payment_status = 'completed'
            """,
            [user_id, frame_id],
            db,
        )
        if not owned:
            raise HTTPException(
                status_code=403,
                detail="このフレームを所有していません。先に購入してください",
            )

    # 装備更新
    execQuery.execute_update(
        "UPDATE user_profiles SET icon_frame_id = ? WHERE user_id = ?",
        [frame_id, user_id],
        db,
    )

    return EquipResponse(frame_id=frame_id, status="equipped")
