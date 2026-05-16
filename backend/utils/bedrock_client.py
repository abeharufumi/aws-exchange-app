import boto3
import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

# Titan Embeddings V2 モデルID
EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"

def get_boto3_client():
    """Boto3クライアントを初期化（AWSの認証情報は環境変数から自動読み込みされます）"""
    return boto3.client(service_name="bedrock-runtime", region_name="ap-northeast-1")

def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Amazon Titan V2 を使用してテキストからベクトル（Embeddings）を生成する
    """
    if not text or len(text.strip()) == 0:
        return None

    client = get_boto3_client()

    try:
        # リクエストボディの構築
        body = json.dumps({
            "inputText": text,
            "dimensions": 1024, # 1024次元（pgvectorと合わせる）
            "normalize": True
        })

        # Bedrock API を呼び出し
        response = client.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body
        )

        # レスポンスの解析
        response_body = json.loads(response.get('body').read())
        embedding = response_body.get('embedding')
        return embedding

    except Exception as e:
        logger.error(f"Error generating embedding for text: {e}")
        return None
