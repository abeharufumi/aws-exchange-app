from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import logging
import asyncio

from sqlalchemy.orm import Session
from database import get_db
from utils.dependencies import get_current_user
from utils.bedrock_client import generate_streaming_response, generate_embedding_for_query
from execQuery import execute_select, execute_insert, execute_update

router = APIRouter(prefix="/api/chatbot", tags=["chatbot"])
logger = logging.getLogger(__name__)


class ChatSessionCreate(BaseModel):
    title: str = "新しいチャット"


class ChatSessionResponse(BaseModel):
    id: str
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime


class ChatMessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    created_at: datetime


class ChatMessageRequest(BaseModel):
    session_id: str
    message: str


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["id"]
    rows = execute_select(
        "SELECT id, user_id, title, created_at, updated_at FROM ai_chat_sessions WHERE user_id = ? ORDER BY updated_at DESC",
        [user_id],
        db,
    )
    return [
        ChatSessionResponse(
            id=str(row["id"]),
            user_id=row["user_id"],
            title=row["title"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        for row in rows
    ]


@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(
    req: ChatSessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]
    # INSERT & RETURNING
    # execute_insert returns row[0] by default if returns_rows=True, but we want multiple columns.
    # To be safe and compatible with execQuery, we can use execute_insert and then SELECT, or just raw db.execute

    # execute_insert returns row[0] -> let's just insert then select it locally or just use _execute_query
    from execQuery import _execute_query

    result = _execute_query(
        "INSERT INTO ai_chat_sessions (user_id, title) VALUES (?, ?) RETURNING id, user_id, title, created_at, updated_at",
        [user_id, req.title],
        db,
    )
    db.commit()
    row = result.fetchone()
    if row:
        return ChatSessionResponse(
            id=str(row[0]), user_id=row[1], title=row[2], created_at=row[3], updated_at=row[4]
        )
    raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/sessions/{session_id}", response_model=List[ChatMessageResponse])
def get_session_messages(
    session_id: str, current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    user_id = current_user["id"]

    sessions = execute_select(
        "SELECT id FROM ai_chat_sessions WHERE id = CAST(? AS UUID) AND user_id = ?",
        [session_id, user_id],
        db,
    )
    if not sessions:
        raise HTTPException(status_code=403, detail="Not authorized to access this session")

    rows = execute_select(
        "SELECT id, session_id, role, content, created_at FROM ai_chat_messages WHERE session_id = CAST(? AS UUID) ORDER BY id ASC",
        [session_id],
        db,
    )
    return [
        ChatMessageResponse(
            id=row["id"],
            session_id=str(row["session_id"]),
            role=row["role"],
            content=row["content"],
            created_at=row["created_at"],
        )
        for row in rows
    ]


@router.post("/message")
async def send_message(
    req: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["id"]
    session_id = req.session_id
    user_message = req.message

    sessions = execute_select(
        "SELECT id FROM ai_chat_sessions WHERE id = CAST(? AS UUID) AND user_id = ?",
        [session_id, user_id],
        db,
    )
    if not sessions:
        raise HTTPException(status_code=403, detail="Not authorized")

    execute_insert(
        "INSERT INTO ai_chat_messages (session_id, role, content) VALUES (CAST(? AS UUID), 'user', ?)",
        [session_id, user_message],
        db,
    )

    history_rows = execute_select(
        "SELECT role, content FROM ai_chat_messages WHERE session_id = CAST(? AS UUID) ORDER BY id DESC LIMIT 10",
        [session_id],
        db,
    )
    history_rows.reverse()

    # ユーザープロフィールから自己紹介を取得
    user_info = execute_select(
        "SELECT p.bio FROM user_profiles p WHERE p.user_id = ?", [user_id], db
    )
    user_bio = user_info[0].get("bio", "未設定") if user_info else "未設定"

    messages_for_bedrock = []
    for h in history_rows:
        bedrock_role = "user" if h["role"] == "user" else "assistant"
        messages_for_bedrock.append({"role": bedrock_role, "content": [{"text": h["content"]}]})

    query_vector = generate_embedding_for_query(user_message)
    rag_context = ""
    if query_vector:
        vector_str = "[" + ",".join(map(str, query_vector)) + "]"
        kb_rows = execute_select(
            """
            SELECT title, content 
            FROM ai_knowledge_base 
            WHERE is_active = TRUE
            ORDER BY content_embedding <=> CAST(? AS vector)
            LIMIT 3
            """,
            [vector_str],
            db,
        )
        if kb_rows:
            rag_context = "【参考情報（システム知識）】\\n" + "\\n".join(
                [f"- {r['title']}: {r['content']}" for r in kb_rows]
            )

    system_prompt = f"""あなたはマッチングアプリ「AWS Exchange」の優秀なAIコンシェルジュです。
親切で丁寧、かつ少しフランクなトーンでユーザーをサポートしてください。
質問に答えるときは、以下の参考情報がある場合はそれを元に回答してください。

{rag_context}

また、ユーザーの現在のプロフィール情報は以下の通りです。アドバイスを求められた際に活用してください。
【ユーザーのプロフィール】
自己紹介: {user_bio}
"""

    async def event_generator():
        full_response = ""
        try:
            async for chunk in generate_streaming_response(messages_for_bedrock, system_prompt):
                full_response += chunk
                yield chunk

            def _save_response():
                execute_insert(
                    "INSERT INTO ai_chat_messages (session_id, role, content) VALUES (CAST(? AS UUID), 'assistant', ?)",
                    [session_id, full_response],
                    db,
                )
                execute_update(
                    "UPDATE ai_chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = CAST(? AS UUID)",
                    [session_id],
                    db,
                )

            await asyncio.to_thread(_save_response)

        except Exception as e:
            logger.error(f"Error in event_generator: {e}")
            yield f"Error: {e}"

    return StreamingResponse(event_generator(), media_type="text/plain")
