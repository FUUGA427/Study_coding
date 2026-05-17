from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.learning_streak import LearningStreak
from app.models.problem_attempt import ProblemAttempt
from app.models.submission import Submission
from app.models.weakness_profile import UserWeaknessProfile


class AttemptRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---- Problem Attempts ----

    async def create_attempt(
        self,
        user_id: str,
        problem_source: str,
        is_correct: bool,
        score: int,
        lesson_id: str | None = None,
        generated_problem_id: str | None = None,
        submitted_code: str | None = None,
        answer: dict | None = None,
        ai_review: str | None = None,
        time_spent_seconds: int | None = None,
    ) -> ProblemAttempt:
        attempt = ProblemAttempt(
            user_id=user_id,
            problem_source=problem_source,
            lesson_id=lesson_id,
            generated_problem_id=generated_problem_id,
            submitted_code=submitted_code,
            answer=answer,
            score=score,
            is_correct=is_correct,
            ai_review=ai_review,
            time_spent_seconds=time_spent_seconds,
        )
        self.db.add(attempt)
        await self.db.flush()
        return attempt

    async def get_attempt(self, attempt_id: str, user_id: str) -> ProblemAttempt | None:
        stmt = select(ProblemAttempt).where(
            ProblemAttempt.id == attempt_id,
            ProblemAttempt.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_attempts(
        self,
        user_id: str,
        limit: int = 20,
        cursor: datetime | None = None,
    ) -> list[ProblemAttempt]:
        conditions = [ProblemAttempt.user_id == user_id]
        if cursor:
            conditions.append(ProblemAttempt.attempted_at < cursor)

        stmt = (
            select(ProblemAttempt)
            .where(and_(*conditions))
            .order_by(ProblemAttempt.attempted_at.desc())
            .limit(limit + 1)  # 次ページ判定用に+1
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_incorrect_attempts(
        self,
        user_id: str,
        since: datetime | None = None,
    ) -> list[ProblemAttempt]:
        conditions = [
            ProblemAttempt.user_id == user_id,
            ProblemAttempt.is_correct == False,
        ]
        if since:
            conditions.append(ProblemAttempt.attempted_at >= since)

        stmt = (
            select(ProblemAttempt)
            .where(and_(*conditions))
            .order_by(ProblemAttempt.attempted_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_stale_attempts(
        self,
        user_id: str,
        days_threshold: int = 7,
    ) -> list[ProblemAttempt]:
        threshold = datetime.now(timezone.utc) - timedelta(days=days_threshold)
        stmt = (
            select(ProblemAttempt)
            .where(
                and_(
                    ProblemAttempt.user_id == user_id,
                    ProblemAttempt.is_correct == True,
                    ProblemAttempt.attempted_at < threshold,
                )
            )
            .order_by(ProblemAttempt.attempted_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ---- Weakness Profile ----

    async def get_weakness_profile(self, user_id: str) -> list[UserWeaknessProfile]:
        stmt = (
            select(UserWeaknessProfile)
            .where(UserWeaknessProfile.user_id == user_id)
            .order_by(UserWeaknessProfile.accuracy_rate.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_weakness_profile(
        self,
        user_id: str,
        tag: str,
        is_correct: bool,
        score: int,
    ) -> None:
        stmt = select(UserWeaknessProfile).where(
            and_(
                UserWeaknessProfile.user_id == user_id,
                UserWeaknessProfile.tag == tag,
            )
        )
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()
        now = datetime.now(timezone.utc)

        if profile is None:
            profile = UserWeaknessProfile(
                user_id=user_id,
                tag=tag,
                total_attempts=1,
                correct_count=1 if is_correct else 0,
                accuracy_rate=Decimal("100.00") if is_correct else Decimal("0.00"),
                avg_score=Decimal(str(score)),
                last_attempted_at=now,
            )
            self.db.add(profile)
        else:
            profile.total_attempts += 1
            if is_correct:
                profile.correct_count += 1
            profile.accuracy_rate = Decimal(
                str(round(profile.correct_count / profile.total_attempts * 100, 2))
            )
            prev_total = profile.avg_score * (profile.total_attempts - 1)
            profile.avg_score = Decimal(
                str(round(float(prev_total + score) / profile.total_attempts, 2))
            )
            profile.last_attempted_at = now

        await self.db.flush()

    # ---- Submissions (固定問題用) ----

    async def create_submission(
        self,
        user_id: str,
        lesson_id: str,
        is_correct: bool,
        score: int,
        submitted_code: str | None = None,
        answer: dict | None = None,
        execution_time_ms: int | None = None,
    ) -> Submission:
        submission = Submission(
            user_id=user_id,
            lesson_id=lesson_id,
            submitted_code=submitted_code,
            answer=answer,
            score=score,
            is_correct=is_correct,
            execution_time_ms=execution_time_ms,
        )
        self.db.add(submission)
        await self.db.flush()
        return submission

    # ---- Learning Streak ----

    async def record_streak(self, user_id: str, score: int) -> None:
        today = datetime.now(timezone.utc).date()
        stmt = select(LearningStreak).where(
            and_(
                LearningStreak.user_id == user_id,
                LearningStreak.streak_date == today,
            )
        )
        result = await self.db.execute(stmt)
        streak = result.scalar_one_or_none()

        if streak is None:
            streak = LearningStreak(
                user_id=user_id,
                streak_date=today,
                problems_solved=1,
                total_score=score,
            )
            self.db.add(streak)
        else:
            streak.problems_solved += 1
            streak.total_score += score

        await self.db.flush()
