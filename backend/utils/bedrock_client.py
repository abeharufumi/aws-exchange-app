import boto3
import json
import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
NOVA_MODEL_ID = "apac.amazon.nova-lite-v1:0"

def get_boto3_client():
    return boto3.client(service_name="bedrock-runtime", region_name="ap-northeast-1")

def extract_tags_for_embedding(bio: str) -> str:
    client = get_boto3_client()
    try:
        body = json.dumps({
            "schemaVersion": "messages-v1",
            "system": [
                {
                    "text": "あなたは自己紹介文から属性タグを抽出するシステムです。入力された文章のみに基づき、5〜10個の抽象化・標準化されたキーワード（例「IT」「エンジニア」「学生」「趣味」など）をカンマ区切りで出力してください。文章にない情報を勝手に追加しないでください。"
                }
            ],
            "messages": [
                {
                    "role": "user",
                    "content": [{"text": bio}]
                }
            ],
            "inferenceConfig": {
                "maxTokens": 50,
                "temperature": 0.0
            }
        })
        response = client.invoke_model(
            modelId=NOVA_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body
        )
        response_body = json.loads(response.get('body').read())
        output_text = response_body.get('output', {}).get('message', {}).get('content', [{}])[0].get('text', '')
        return output_text.strip()
    except Exception as e:
        logger.error(f"Error extracting tags: {e}")
        return ""

def generate_embedding(text: str) -> Optional[List[float]]:
    if not text or len(text.strip()) == 0:
        return None

    extracted_tags = extract_tags_for_embedding(text)
    optimized_text = f"{extracted_tags}, {text}" if extracted_tags else text
    logger.info(f"Optimized text for embedding: {optimized_text}")

    client = get_boto3_client()
    try:
        body = json.dumps({
            "inputText": optimized_text,
            "dimensions": 1024,
            "normalize": True
        })
        response = client.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body
        )
        response_body = json.loads(response.get('body').read())
        return response_body.get('embedding')
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return None
