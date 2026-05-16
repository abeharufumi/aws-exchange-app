import logging
from utils.bedrock_client import generate_embedding
import base64
import json

logger = logging.getLogger(__name__)

def update_bio_embedding_task(user_id: int, bio: str, db):
    """
    Background Task として実行されるエンベディング生成とDB更新処理。
    """
    logger.info(f"Starting embedding generation task for use_id={user_id}")
    
    embedding = generate_embedding(bio)
    if not embedding:
        logger.warning(f"Failed to generate embedding for bio of user_id={user_id}")
        return
    
    # pgvector に挿入するためのフォーマット '[0.1, 0.2, ...]'
    embedding_str = f"[{','.join(map(str, embedding))}]"
    
    # SQLを直接実行するか execQuery を通して実行
    try:
        from execQuery import execute_update
        query = "UPDATE user_profiles SET bio_embedding = ?::vector WHERE user_id = ?"
        execute_update(query, [embedding_str, user_id], db)
        logger.info(f"Successfully updated bio_embedding for user_id={user_id}")
    except Exception as e:
        logger.error(f"Error updating DB with embedding for user_id={user_id}: {e}")
