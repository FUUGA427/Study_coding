from pydantic import BaseModel


class LessonResponse(BaseModel):
    id: str
    course_id: str
    title: str
    description: str | None
    lesson_type: str
    difficulty: str
    sort_order: int
    tags: list[str]
    max_score: int
    pass_score: int

    model_config = {"from_attributes": True}


class LessonDetailResponse(LessonResponse):
    content: dict


class LessonProgressResponse(BaseModel):
    lesson_id: str
    status: str
    best_score: int
    attempt_count: int


class LessonListResponse(BaseModel):
    lessons: list[LessonResponse]
    progress: dict[str, LessonProgressResponse] = {}


class SubmitLessonRequest(BaseModel):
    submitted_code: str | None = None
    answer: dict | None = None
    time_spent_seconds: int | None = None


class SubmitLessonResponse(BaseModel):
    submission_id: str
    is_correct: bool
    score: int
    ai_review_task_id: str | None = None
