from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user_id
from app.dependencies import get_attempt_repo, get_recommendation_service
from app.repositories.attempt_repository import AttemptRepository
from app.schemas.recommendation import WeaknessProfileResponse
from app.services.recommendation_service import RecommendationService

router = APIRouter(prefix="/recommend", tags=["recommendations"])


@router.get("/review")
async def get_recommendations(
    limit: int = Query(default=10, le=50),
    rec_type: str | None = Query(default=None, alias="type"),
    user_id: str = Depends(get_current_user_id),
    service: RecommendationService = Depends(get_recommendation_service),
):
    return await service.get_recommendations(user_id, limit, rec_type)


@router.post("/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: str,
    user_id: str = Depends(get_current_user_id),
    service: RecommendationService = Depends(get_recommendation_service),
):
    await service.dismiss(recommendation_id, user_id)
    return {"status": "dismissed"}


@router.get("/weakness", response_model=WeaknessProfileResponse)
async def get_weakness_profile(
    user_id: str = Depends(get_current_user_id),
    attempt_repo: AttemptRepository = Depends(get_attempt_repo),
):
    profiles = await attempt_repo.get_weakness_profile(user_id)
    return WeaknessProfileResponse(
        items=[
            {
                "tag": p.tag,
                "total_attempts": p.total_attempts,
                "correct_count": p.correct_count,
                "accuracy_rate": p.accuracy_rate,
                "avg_score": p.avg_score,
            }
            for p in profiles
        ]
    )
