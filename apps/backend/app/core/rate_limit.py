import redis.asyncio as redis

from app.config import settings
from app.core.exceptions import RateLimitError

_pool: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _pool


async def rate_limit_ai(user_id: str) -> None:
    """AI系APIのレート制限。超過時は RateLimitError を送出。"""
    r = await get_redis()

    # 分単位
    minute_key = f"ratelimit:ai:{user_id}:minute"
    minute_count = await r.incr(minute_key)
    if minute_count == 1:
        await r.expire(minute_key, 60)
    if minute_count > settings.AI_RATE_LIMIT_PER_MINUTE:
        raise RateLimitError(
            f"AI機能のリクエスト上限に達しました（{settings.AI_RATE_LIMIT_PER_MINUTE}回/分）"
        )

    # 時間単位
    hour_key = f"ratelimit:ai:{user_id}:hour"
    hour_count = await r.incr(hour_key)
    if hour_count == 1:
        await r.expire(hour_key, 3600)
    if hour_count > settings.AI_RATE_LIMIT_PER_HOUR:
        raise RateLimitError(
            f"AI機能のリクエスト上限に達しました（{settings.AI_RATE_LIMIT_PER_HOUR}回/時間）"
        )
