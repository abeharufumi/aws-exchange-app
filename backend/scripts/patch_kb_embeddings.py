import sys
import os
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from execQuery import execute_select, execute_update
from utils.bedrock_client import generate_embedding_for_query
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    db = SessionLocal()
    try:
        rows = execute_select("SELECT id, title, content FROM ai_knowledge_base WHERE content_embedding IS NULL", [], db)

        if not rows:
            logger.info("No knowledge base entries require an embedding at this time.")
            return

        for row in rows:
            row_id = row['id']
            title = row['title']
            content = row['content']
            
            logger.info(f"Generating embedding for KB id={row_id} ...")
            text_to_embed = f"{title}\\n{content}"
            embedding = generate_embedding_for_query(text_to_embed)

            if embedding:
                vector_str = "[" + ",".join(map(str, embedding)) + "]"
                execute_update(
                    "UPDATE ai_knowledge_base SET content_embedding = CAST(? AS vector) WHERE id = ?",
                    [vector_str, row_id],
                    db
                )
                logger.info(f"Update successful for KB id={row_id}")
            else:
                logger.warning(f"Failed to generate embedding for KB id={row_id}")
            
            time.sleep(1)

        logger.info("Done.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
