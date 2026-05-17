from fastapi import APIRouter, Depends

from app.core.rate_limit import rate_limit_ai
from app.core.security import get_current_user_id
from app.dependencies import get_ai_review_service
from app.schemas.ai_review import CodeReviewRequest, CodeReviewResponse, CodeReviewResult
from app.services.ai_review_service import AIReviewService

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/review", response_model=CodeReviewResponse, status_code=202)
async def request_review(
    req: CodeReviewRequest,
    user_id: str = Depends(get_current_user_id),
    service: AIReviewService = Depends(get_ai_review_service),
):
    await rate_limit_ai(user_id)
    task_id = await service.request_review(
        user_id=user_id,
        code=req.code,
        problem_description=req.problem_description,
        language=req.language,
    )
    return CodeReviewResponse(task_id=task_id)


@router.get("/review/{task_id}", response_model=CodeReviewResult)
async def get_review(
    task_id: str,
    user_id: str = Depends(get_current_user_id),
    service: AIReviewService = Depends(get_ai_review_service),
):
    return await service.get_review_result(task_id, user_id)
