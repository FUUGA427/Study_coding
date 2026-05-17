from datetime import datetime

from app.core.exceptions import NotFoundError
from app.repositories.attempt_repository import AttemptRepository
from app.schemas.history import AttemptDetail, AttemptSummary, HistoryListResponse


class HistoryService:
    def __init__(self, attempt_repo: AttemptRepository):
        self.attempt_repo = attempt_repo

    async def get_history(
        self,
        user_id: str,
        limit: int = 20,
        cursor: str | None = None,
    ) -> HistoryListResponse:
        cursor_dt = datetime.fromisoformat(cursor) if cursor else None
        attempts = await self.attempt_repo.get_user_attempts(user_id, limit, cursor_dt)

        has_next = len(attempts) > limit
        items = attempts[:limit]

        next_cursor = None
        if has_next and items:
            next_cursor = items[-1].attempted_at.isoformat()

        return HistoryListResponse(
            items=[
                AttemptSummary(
                    id=str(a.id),
                    problem_source=a.problem_source.value,
                    lesson_id=str(a.lesson_id) if a.lesson_id else None,
                    generated_problem_id=(
                        str(a.generated_problem_id) if a.generated_problem_id else None
                    ),
                    lesson_title=a.lesson.title if a.lesson else None,
                    is_correct=a.is_correct,
                    score=a.score,
                    attempted_at=a.attempted_at,
                )
                for a in items
            ],
            next_cursor=next_cursor,
        )

    async def get_attempt_detail(self, user_id: str, attempt_id: str) -> AttemptDetail:
        attempt = await self.attempt_repo.get_attempt(attempt_id, user_id)
        if not attempt:
            raise NotFoundError("学習履歴")

        problem_content = None
        if attempt.lesson:
            problem_content = attempt.lesson.content
        elif attempt.generated_problem:
            problem_content = attempt.generated_problem.content

        return AttemptDetail(
            id=str(attempt.id),
            problem_source=attempt.problem_source.value,
            lesson_id=str(attempt.lesson_id) if attempt.lesson_id else None,
            generated_problem_id=(
                str(attempt.generated_problem_id) if attempt.generated_problem_id else None
            ),
            lesson_title=attempt.lesson.title if attempt.lesson else None,
            is_correct=attempt.is_correct,
            score=attempt.score,
            attempted_at=attempt.attempted_at,
            submitted_code=attempt.submitted_code,
            answer=attempt.answer,
            ai_review=attempt.ai_review,
            time_spent_seconds=attempt.time_spent_seconds,
            problem_content=problem_content,
        )
