import asyncio
import json
import logging

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        self._client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            config=Config(
                retries={"max_attempts": 3, "mode": "adaptive"},
                read_timeout=60,
                connect_timeout=5,
            ),
        )
        self.model_id = settings.BEDROCK_MODEL_ID
        self.max_tokens = settings.BEDROCK_MAX_TOKENS

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def invoke(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int | None = None,
        temperature: float = 0.7,
    ) -> str:
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._invoke_sync,
            system_prompt,
            user_message,
            max_tokens or self.max_tokens,
            temperature,
        )

    def _invoke_sync(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        body = json.dumps(
            {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_message}],
            }
        )

        try:
            response = self._client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
            result = json.loads(response["body"].read())
            return result["content"][0]["text"]

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            logger.error("Bedrock error: %s - %s", error_code, str(e))
            raise

    async def invoke_json(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
    ) -> dict:
        """JSON出力を期待する呼び出し"""
        raw = await self.invoke(
            system_prompt=system_prompt
            + "\n\nYou MUST respond with valid JSON only. No markdown fences, no explanation.",
            user_message=user_message,
            temperature=temperature,
        )

        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            logger.error("Failed to parse Bedrock JSON: %s", raw[:300])
            raise ValueError("AI応答のJSON解析に失敗しました")
