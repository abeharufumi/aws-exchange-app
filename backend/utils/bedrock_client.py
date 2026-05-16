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
