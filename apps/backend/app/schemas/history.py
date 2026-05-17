from datetime import datetime

from pydantic import BaseModel


class AttemptSummary(BaseModel):
    id: str
    problem_source: str
    lesson_id: str | None
    generated_problem_id: str | None
    lesson_title: str | None = None
    is_correct: bool
    score: int
    attempted_at: datetime

    model_config = {"from_attributes": True}


class AttemptDetail(AttemptSummary):
    submitted_code: str | None
    answer: dict | None
    ai_review: str | None
    time_spent_seconds: int | None
    problem_content: dict | None = None


class HistoryListResponse(BaseModel):
    items: list[AttemptSummary]
    next_cursor: str | None = None
