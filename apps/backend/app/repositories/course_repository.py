from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.course import Course
from app.models.lesson import Lesson
from app.models.progress import CourseProgress, LessonProgress, ProgressStatus


class CourseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_published(self) -> list[Course]:
        stmt = (
            select(Course)
            .where(Course.is_published == True)
            .order_by(Course.sort_order)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_id(self, course_id: str) -> Course | None:
        stmt = (
            select(Course)
            .options(selectinload(Course.lessons))
            .where(Course.id == course_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_course_progress(self, user_id: str, course_id: str) -> CourseProgress | None:
        stmt = select(CourseProgress).where(
            CourseProgress.user_id == user_id,
            CourseProgress.course_id == course_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_course_progress(self, user_id: str) -> list[CourseProgress]:
        stmt = select(CourseProgress).where(CourseProgress.user_id == user_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_lessons_by_course(self, course_id: str) -> list[Lesson]:
        stmt = (
            select(Lesson)
            .where(Lesson.course_id == course_id, Lesson.is_published == True)
            .order_by(Lesson.sort_order)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_lesson_by_id(self, lesson_id: str) -> Lesson | None:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_lesson_progress(self, user_id: str, lesson_id: str) -> LessonProgress | None:
        stmt = select(LessonProgress).where(
            LessonProgress.user_id == user_id,
            LessonProgress.lesson_id == lesson_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_lesson_progress_for_course(
        self, user_id: str, course_id: str
    ) -> list[LessonProgress]:
        stmt = (
            select(LessonProgress)
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .where(
                LessonProgress.user_id == user_id,
                Lesson.course_id == course_id,
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def upsert_lesson_progress(
        self,
        user_id: str,
        lesson_id: str,
        score: int,
        is_correct: bool,
    ) -> LessonProgress:
        progress = await self.get_lesson_progress(user_id, lesson_id)
        from datetime import datetime, timezone

        now = datetime.now(timezone.utc)

        if progress is None:
            progress = LessonProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                status=ProgressStatus.completed if is_correct else ProgressStatus.in_progress,
                best_score=score,
                attempt_count=1,
                last_attempted_at=now,
                completed_at=now if is_correct else None,
            )
            self.db.add(progress)
        else:
            progress.attempt_count += 1
            progress.last_attempted_at = now
            if score > progress.best_score:
                progress.best_score = score
            if is_correct and progress.status != ProgressStatus.completed:
                progress.status = ProgressStatus.completed
                progress.completed_at = now

        await self.db.flush()
        return progress

    async def update_course_progress(self, user_id: str, course_id: str) -> CourseProgress:
        """レッスン完了数からコース進捗を再計算"""
        lessons = await self.get_lessons_by_course(course_id)
        progress_list = await self.get_lesson_progress_for_course(user_id, course_id)

        total = len(lessons)
        completed = sum(1 for p in progress_list if p.status == ProgressStatus.completed)
        pct = (completed / total * 100) if total > 0 else 0

        course_progress = await self.get_course_progress(user_id, course_id)
        from datetime import datetime, timezone
        from decimal import Decimal

        now = datetime.now(timezone.utc)

        if course_progress is None:
            course_progress = CourseProgress(
                user_id=user_id,
                course_id=course_id,
                status=ProgressStatus.in_progress,
                progress_pct=Decimal(str(round(pct, 2))),
                started_at=now,
            )
            self.db.add(course_progress)
        else:
            course_progress.progress_pct = Decimal(str(round(pct, 2)))

        if pct >= 100:
            course_progress.status = ProgressStatus.completed
            course_progress.completed_at = now

        await self.db.flush()
        return course_progress
