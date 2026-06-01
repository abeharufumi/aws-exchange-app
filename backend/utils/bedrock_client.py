import boto3
import json
import logging
from typing import List, Optional

from utils.prompts import TAG_EXTRACTION_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

EMBEDDING_MODEL_ID = "amazon.titan-embed-text-v2:0"
NOVA_MODEL_ID = "apac.amazon.nova-lite-v1:0"


def get_boto3_client():
    return boto3.client(service_name="bedrock-runtime", region_name="ap-northeast-1")


def extract_tags_for_embedding(bio: str) -> str:
    client = get_boto3_client()
    try:
        body = json.dumps(
            {
                "schemaVersion": "messages-v1",
                "system": [{"text": TAG_EXTRACTION_SYSTEM_PROMPT}],
                "messages": [{"role": "user", "content": [{"text": bio}]}],
                "inferenceConfig": {"maxTokens": 50, "temperature": 0.0},
            }
        )
        response = client.invoke_model(
            modelId=NOVA_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body,
        )
        response_body = json.loads(response.get("body").read())
        output_text = (
            response_body.get("output", {})
            .get("message", {})
            .get("content", [{}])[0]
            .get("text", "")
        )
        return output_text.strip()
    except Exception as e:
        logger.error(f"Error extracting tags: {e}")
        return ""


def generate_embedding(text: str) -> Optional[List[float]]:
    if not text or len(text.strip()) == 0:
        return None

    # ONLY embed the tags, so Titan doesn't get distracted by grammar and mood!
    extracted_tags = extract_tags_for_embedding(text)
    optimized_text = extracted_tags if extracted_tags else text
    logger.info(f"Optimized text for embedding: {optimized_text}")

    client = get_boto3_client()
    try:
        body = json.dumps({"inputText": optimized_text, "dimensions": 1024, "normalize": True})
        response = client.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body,
        )
        response_body = json.loads(response.get("body").read())
        return response_body.get("embedding")
    except Exception as e:
        logger.error(f"Error generating embedding: {e}")
        return None


import asyncio

async def generate_streaming_response(messages: list, system_prompt: str = ""):
    """
    Nova-lite などのモデルを使用して、ストリーミング応答を生成します。
    """
    # asyncio.to_threadを使ってboto3の同期呼び出しを非同期にラップすることもできますが、
    # ジェネレータ内でのブロッキングを避けるためには必要です。
    client = get_boto3_client()
    
    def _invoke():
        body_dict = {
            "schemaVersion": "messages-v1",
            "messages": messages,
            "inferenceConfig": {"maxTokens": 1000, "temperature": 0.5},
        }
        if system_prompt:
            body_dict["system"] = [{"text": system_prompt}]
            
        return client.invoke_model_with_response_stream(
            modelId=NOVA_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body_dict),
        )

    try:
        response = await asyncio.to_thread(_invoke)
        # response["body"] はストリームイベントのイテレータ
        for event in response.get("body"):
            chunk_bytes = event.get("chunk", {}).get("bytes")
            if chunk_bytes:
                chunk = json.loads(chunk_bytes.decode("utf-8"))
                if "contentBlockDelta" in chunk:
                    text_delta = chunk["contentBlockDelta"].get("delta", {}).get("text", "")
                    if text_delta:
                        yield text_delta
            # 小さな遅延を入れて非同期ループに制御を返す
            await asyncio.sleep(0.01)
            
    except Exception as e:
        logger.error(f"Error streaming response: {e}")
        yield f"【エラーが発生しました】{str(e)}"


def generate_embedding_for_query(text: str) -> Optional[List[float]]:
    """
    RAGなどのクエリ用にテキストを直接ベクトル化します。
    プロフィール用の extract_tags_for_embedding は経由しません。
    """
    if not text or len(text.strip()) == 0:
        return None

    client = get_boto3_client()
    try:
        body = json.dumps({"inputText": text, "dimensions": 1024, "normalize": True})
        response = client.invoke_model(
            modelId=EMBEDDING_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=body,
        )
        response_body = json.loads(response.get("body").read())
        return response_body.get("embedding")
    except Exception as e:
        logger.error(f"Error generating embedding for query: {e}")
        return None
