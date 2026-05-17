from decimal import Decimal

from app.core.exceptions import ForbiddenError, NotFoundError
from app.models.progress import ProgressStatus
from app.repositories.course_repository import CourseRepository
from app.schemas.course import CourseListResponse, CourseWithProgressResponse
from app.schemas.lesson import (
    LessonDetailResponse,
    LessonListResponse,
    LessonProgressResponse,
    LessonResponse,
    SubmitLessonRequest,
    SubmitLessonResponse,
)
from app.repositories.attempt_repository import AttemptRepository


class CourseService:
    def __init__(self, course_repo: CourseRepository, attempt_repo: AttemptRepository):
        self.course_repo = course_repo
        self.attempt_repo = attempt_repo

    async def list_courses(self, user_id: str) -> CourseListResponse:
        courses = await self.course_repo.get_all_published()
        progress_list = await self.course_repo.get_all_course_progress(user_id)
        progress_map = {str(p.course_id): p for p in progress_list}

        # 解放判定用: 前提コースのクリア状況
        completed_ids = {
            str(p.course_id)
            for p in progress_list
            if p.status == ProgressStatus.completed
        }

        result = []
        for course in courses:
            cp = progress_map.get(str(course.id))
            is_unlocked = True
            if course.prerequisite_course_id:
                is_unlocked = str(course.prerequisite_course_id) in completed_ids

            result.append(
                CourseWithProgressResponse(
                    id=str(course.id),
                    title=course.title,
                    description=course.description,
                    level=course.level.value,
                    sort_order=course.sort_order,
                    is_published=course.is_published,
                    prerequisite_course_id=(
                        str(course.prerequisite_course_id)
                        if course.prerequisite_course_id
                        else None
                    ),
                    progress_status=cp.status.value if cp else "not_started",
                    progress_pct=cp.progress_pct if cp else Decimal("0.00"),
                    is_unlocked=is_unlocked,
                )
            )

        return CourseListResponse(courses=result)

    async def get_lessons(self, user_id: str, course_id: str) -> LessonListResponse:
        course = await self.course_repo.get_by_id(course_id)
        if not course:
            raise NotFoundError("コース")

        lessons = await self.course_repo.get_lessons_by_course(course_id)
        progress_list = await self.course_repo.get_lesson_progress_for_course(user_id, course_id)
        progress_map = {str(p.lesson_id): p for p in progress_list}

        lesson_responses = [
            LessonResponse(
                id=str(l.id),
                course_id=str(l.course_id),
                title=l.title,
                description=l.description,
                lesson_type=l.lesson_type.value,
                difficulty=l.difficulty.value,
                sort_order=l.sort_order,
                tags=l.tags or [],
                max_score=l.max_score,
                pass_score=l.pass_score,
            )
            for l in lessons
        ]

        progress_responses = {
            lid: LessonProgressResponse(
                lesson_id=lid,
                status=p.status.value,
                best_score=p.best_score,
                attempt_count=p.attempt_count,
            )
            for lid, p in progress_map.items()
        }

        return LessonListResponse(lessons=lesson_responses, progress=progress_responses)

    async def get_lesson_detail(self, user_id: str, lesson_id: str) -> LessonDetailResponse:
        lesson = await self.course_repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundError("レッスン")

        return LessonDetailResponse(
            id=str(lesson.id),
            course_id=str(lesson.course_id),
            title=lesson.title,
            description=lesson.description,
            lesson_type=lesson.lesson_type.value,
            difficulty=lesson.difficulty.value,
            sort_order=lesson.sort_order,
            tags=lesson.tags or [],
            max_score=lesson.max_score,
            pass_score=lesson.pass_score,
            content=lesson.content,
        )

    async def submit_lesson(
        self, user_id: str, lesson_id: str, req: SubmitLessonRequest
    ) -> SubmitLessonResponse:
        lesson = await self.course_repo.get_lesson_by_id(lesson_id)
        if not lesson:
            raise NotFoundError("レッスン")

        # 採点
        is_correct, score = self._grade(lesson, req)

        # 提出保存
        submission = await self.attempt_repo.create_submission(
            user_id=user_id,
            lesson_id=lesson_id,
            is_correct=is_correct,
            score=score,
            submitted_code=req.submitted_code,
            answer=req.answer,
        )

        # 履歴記録
        await self.attempt_repo.create_attempt(
            user_id=user_id,
            problem_source="fixed",
            lesson_id=lesson_id,
            is_correct=is_correct,
            score=score,
            submitted_code=req.submitted_code,
            answer=req.answer,
            time_spent_seconds=req.time_spent_seconds,
        )

        # 進捗更新
        await self.course_repo.upsert_lesson_progress(user_id, lesson_id, score, is_correct)
        await self.course_repo.update_course_progress(user_id, str(lesson.course_id))

        # 苦手プロファイル更新
        for tag in lesson.tags or []:
            await self.attempt_repo.update_weakness_profile(user_id, tag, is_correct, score)

        # ストリーク記録
        await self.attempt_repo.record_streak(user_id, score)

        return SubmitLessonResponse(
            submission_id=str(submission.id),
            is_correct=is_correct,
            score=score,
        )

    def _grade(self, lesson, req: SubmitLessonRequest) -> tuple[bool, int]:
        """採点ロジック（クイズ/コーディング共通）"""
        content = lesson.content

        if lesson.lesson_type.value == "quiz":
            correct_index = content.get("correct_index")
            user_answer = (req.answer or {}).get("selected_index")
            is_correct = correct_index == user_answer
            score = lesson.max_score if is_correct else 0
            return is_correct, score

        if lesson.lesson_type.value == "coding":
            # コーディング問題は簡易採点（本番ではDocker sandbox実行）
            # テストケースの通過率でスコアを算出
            test_cases = content.get("test_cases", [])
            if not test_cases:
                return True, lesson.max_score

            # TODO: サンドボックス実行による本格採点
            # 現段階では提出があれば部分点
            score = lesson.max_score // 2 if req.submitted_code else 0
            is_correct = score >= lesson.pass_score
            return is_correct, score

        return False, 0
