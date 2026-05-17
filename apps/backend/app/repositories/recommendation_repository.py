from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recommendation import (
    RecommendationStatus,
    RecommendationType,
    ReviewRecommendation,
)


class RecommendationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        rec_type: str | None = None,
    ) -> list[ReviewRecommendation]:
        conditions = [
            ReviewRecommendation.user_id == user_id,
            ReviewRecommendation.status == RecommendationStatus.pending,
        ]
        # 期限切れを除外
        now = datetime.now(timezone.utc)
        conditions.append(
            (ReviewRecommendation.expires_at.is_(None))
            | (ReviewRecommendation.expires_at > now)
        )

        if rec_type:
            conditions.append(ReviewRecommendation.recommendation_type == rec_type)

        stmt = (
            select(ReviewRecommendation)
            .where(and_(*conditions))
            .order_by(ReviewRecommendation.priority_score.desc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def save_recommendation(
        self,
        user_id: str,
        recommendation_type: str,
        problem_source: str,
        priority_score: float,
        score_breakdown: dict,
        lesson_id: str | None = None,
        generated_problem_id: str | None = None,
        reason: str | None = None,
        expires_at: datetime | None = None,
    ) -> ReviewRecommendation:
        rec = ReviewRecommendation(
            user_id=user_id,
            recommendation_type=recommendation_type,
            problem_source=problem_source,
            lesson_id=lesson_id,
            generated_problem_id=generated_problem_id,
            priority_score=Decimal(str(round(priority_score, 2))),
            score_breakdown=score_breakdown,
            reason=reason,
            expires_at=expires_at,
        )
        self.db.add(rec)
        await self.db.flush()
        return rec

    async def dismiss(self, recommendation_id: str, user_id: str) -> bool:
        now = datetime.now(timezone.utc)
        stmt = (
            update(ReviewRecommendation)
            .where(
                ReviewRecommendation.id == recommendation_id,
                ReviewRecommendation.user_id == user_id,
            )
            .values(status=RecommendationStatus.dismissed, acted_at=now)
        )
        result = await self.db.execute(stmt)
        return result.rowcount > 0

    async def mark_attempted(self, recommendation_id: str, user_id: str) -> None:
        now = datetime.now(timezone.utc)
        stmt = (
            update(ReviewRecommendation)
            .where(
                ReviewRecommendation.id == recommendation_id,
                ReviewRecommendation.user_id == user_id,
            )
            .values(status=RecommendationStatus.attempted, acted_at=now)
        )
        await self.db.execute(stmt)

    async def delete_expired(self) -> int:
        """期限切れレコメンドを削除（バッチ用）"""
        now = datetime.now(timezone.utc)
        stmt = (
            update(ReviewRecommendation)
            .where(
                ReviewRecommendation.expires_at < now,
                ReviewRecommendation.status == RecommendationStatus.pending,
            )
            .values(status=RecommendationStatus.dismissed)
        )
        result = await self.db.execute(stmt)
        return result.rowcount
