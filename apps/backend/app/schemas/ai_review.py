from pydantic import BaseModel


class CodeReviewRequest(BaseModel):
    code: str
    problem_description: str
    language: str = "python"


class CodeReviewResponse(BaseModel):
    task_id: str
    status: str = "pending"
    message: str = "コードレビューを実行中です"


class CodeReviewResult(BaseModel):
    task_id: str
    status: str
    review: str | None = None
    error_message: str | None = None
