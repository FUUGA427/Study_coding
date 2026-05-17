from datetime import datetime

from pydantic import BaseModel, Field


class GenerateProblemRequest(BaseModel):
    problem_type: str = Field(pattern="^(quiz|coding)$")
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    tags: list[str] = Field(default_factory=list, max_length=5)
    source_lesson_id: str | None = None


class GenerateProblemResponse(BaseModel):
    task_id: str
    status: str = "pending"
    message: str = "問題を生成中です"


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    problem: dict | None = None
    error_message: str | None = None


class SubmitPracticeRequest(BaseModel):
    problem_id: str
    submitted_code: str | None = None
    answer: dict | None = None
    time_spent_seconds: int | None = None


class SubmitPracticeResponse(BaseModel):
    is_correct: bool
    score: int
    ai_review: str | None = None
    ai_review_task_id: str | None = None
