from fastapi import APIRouter, Depends

from app.core.rate_limit import rate_limit_ai
from app.core.security import get_current_user_id
from app.dependencies import get_problem_generation_service
from app.schemas.practice import (
    GenerateProblemRequest,
    GenerateProblemResponse,
    TaskStatusResponse,
)
from app.services.problem_generation_service import ProblemGenerationService

router = APIRouter(prefix="/practice", tags=["practice"])


@router.post("/generate", response_model=GenerateProblemResponse, status_code=202)
async def generate_problem(
    req: GenerateProblemRequest,
    user_id: str = Depends(get_current_user_id),
    service: ProblemGenerationService = Depends(get_problem_generation_service),
):
    await rate_limit_ai(user_id)
    task_id = await service.enqueue_generation(
        user_id=user_id,
        problem_type=req.problem_type,
        difficulty=req.difficulty,
        tags=req.tags,
        source_lesson_id=req.source_lesson_id,
    )
    return GenerateProblemResponse(task_id=task_id)


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_status(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ProblemGenerationService = Depends(get_problem_generation_service),
):
    result = await service.get_task_status(task_id, user_id)
    if result is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    return result
