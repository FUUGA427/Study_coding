import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app.core.exceptions import NotFoundError
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.services.bedrock_service import BedrockService


@dataclass
class ScoringWeights:
    incorrect: float = 50.0
    low_score: float = 30.0
    days_elapsed_rate: float = 3.0  # 日数あたり（上限20）
    weakness_tag: float = 20.0
    recently_solved: float = -30.0
    mastered: float = -40.0


@dataclass
class ScoredCandidate:
    recommendation_type: str
    problem_source: str
    lesson_id: str | None
    generated_problem_id: str | None
    priority_score: float
    score_breakdown: dict = field(default_factory=dict)
    reason: str | None = None


class RecommendationService:
    def __init__(
        self,
        attempt_repo: AttemptRepository,
        recommendation_repo: RecommendationRepository,
        bedrock: BedrockService,
    ):
        self.attempt_repo = attempt_repo
        self.recommendation_repo = recommendation_repo
        self.bedrock = bedrock
        self.weights = ScoringWeights()

    async def get_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        rec_type: str | None = None,
    ) -> dict:
        # キャッシュ済みレコメンドを返す
        cached = await self.recommendation_repo.get_active_recommendations(
            user_id, limit, rec_type
        )
        if cached:
            return {
                "items": [
                    {
                        "id": str(r.id),
                        "recommendation_type": r.recommendation_type.value,
                        "problem_source": r.problem_source.value,
                        "lesson_id": str(r.lesson_id) if r.lesson_id else None,
                        "generated_problem_id": (
                            str(r.generated_problem_id) if r.generated_problem_id else None
                        ),
                        "priority_score": r.priority_score,
                        "score_breakdown": r.score_breakdown,
                        "reason": r.reason,
                    }
                    for r in cached
                ]
            }

        # 再計算
        candidates = await self._calculate(user_id)

        # 上位をDB保存
        expires = datetime.now(timezone.utc) + timedelta(hours=6)
        for c in candidates[:20]:
            await self.recommendation_repo.save_recommendation(
                user_id=user_id,
                recommendation_type=c.recommendation_type,
                problem_source=c.problem_source,
                priority_score=c.priority_score,
                score_breakdown=c.score_breakdown,
                lesson_id=c.lesson_id,
                generated_problem_id=c.generated_problem_id,
                reason=c.reason,
                expires_at=expires,
            )

        filtered = candidates
        if rec_type:
            filtered = [c for c in candidates if c.recommendation_type == rec_type]

        return {
            "items": [
                {
                    "id": None,
                    "recommendation_type": c.recommendation_type,
                    "problem_source": c.problem_source,
                    "lesson_id": c.lesson_id,
                    "generated_problem_id": c.generated_problem_id,
                    "priority_score": Decimal(str(round(c.priority_score, 2))),
                    "score_breakdown": c.score_breakdown,
                    "reason": c.reason,
                }
                for c in filtered[:limit]
            ]
        }

    async def _calculate(self, user_id: str) -> list[ScoredCandidate]:
        now = datetime.now(timezone.utc)
        candidates: list[ScoredCandidate] = []

        incorrect, weakness_profile, stale = await asyncio.gather(
            self.attempt_repo.get_incorrect_attempts(
                user_id, since=now - timedelta(days=30)
            ),
            self.attempt_repo.get_weakness_profile(user_id),
            self.attempt_repo.get_stale_attempts(user_id, days_threshold=7),
        )

        # retry候補
        seen = set()
        for attempt in incorrect:
            key = str(attempt.lesson_id or attempt.generated_problem_id)
            if key in seen:
                continue
            seen.add(key)

            breakdown = {}
            score = 0.0

            breakdown["incorrect"] = self.weights.incorrect
            score += self.weights.incorrect

            if attempt.score < 60:
                breakdown["low_score"] = self.weights.low_score
                score += self.weights.low_score

            days = (now - attempt.attempted_at).days
            days_bonus = min(days * self.weights.days_elapsed_rate, 20.0)
            breakdown["days_elapsed"] = days_bonus
            score += days_bonus

            if days < 1:
                breakdown["recently_solved"] = self.weights.recently_solved
                score += self.weights.recently_solved

            candidates.append(
                ScoredCandidate(
                    recommendation_type="retry",
                    problem_source=attempt.problem_source.value,
                    lesson_id=str(attempt.lesson_id) if attempt.lesson_id else None,
                    generated_problem_id=(
                        str(attempt.generated_problem_id) if attempt.generated_problem_id else None
                    ),
                    priority_score=score,
                    score_breakdown=breakdown,
                )
            )

        # forgetting候補
        for attempt in stale:
            key = str(attempt.lesson_id or attempt.generated_problem_id)
            if key in seen:
                continue
            seen.add(key)

            days = (now - attempt.attempted_at).days
            if days >= 14:
                forgetting_score = 40.0
            elif days >= 7:
                forgetting_score = 25.0
            else:
                forgetting_score = 10.0

            breakdown = {"forgetting_curve": forgetting_score}
            candidates.append(
                ScoredCandidate(
                    recommendation_type="forgetting",
                    problem_source=attempt.problem_source.value,
                    lesson_id=str(attempt.lesson_id) if attempt.lesson_id else None,
                    generated_problem_id=(
                        str(attempt.generated_problem_id) if attempt.generated_problem_id else None
                    ),
                    priority_score=forgetting_score,
                    score_breakdown=breakdown,
                )
            )

        # weakness候補
        for profile in weakness_profile:
            if float(profile.accuracy_rate) >= 80.0:
                continue

            weakness_severity = (100.0 - float(profile.accuracy_rate)) * 0.5
            breakdown = {
                "weakness_severity": weakness_severity,
                "weakness_tag": self.weights.weakness_tag,
            }
            score = weakness_severity + self.weights.weakness_tag

            candidates.append(
                ScoredCandidate(
                    recommendation_type="weakness",
                    problem_source="generated",
                    lesson_id=None,
                    generated_problem_id=None,
                    priority_score=score,
                    score_breakdown=breakdown,
                    reason=f"「{profile.tag}」の正答率が{profile.accuracy_rate:.0f}%です",
                )
            )

        candidates.sort(key=lambda c: c.priority_score, reverse=True)
        return candidates

    async def dismiss(self, recommendation_id: str, user_id: str) -> None:
        success = await self.recommendation_repo.dismiss(recommendation_id, user_id)
        if not success:
            raise NotFoundError("レコメンド")
