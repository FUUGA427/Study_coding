from fastapi import APIRouter, Depends, Query

from app.core.security import get_current_user_id
from app.dependencies import get_history_service
from app.schemas.history import AttemptDetail, HistoryListResponse
from app.services.history_service import HistoryService

router = APIRouter(prefix="/history", tags=["history"])


@router.get("", response_model=HistoryListResponse)
async def get_history(
    limit: int = Query(default=20, le=100),
    cursor: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
    service: HistoryService = Depends(get_history_service),
):
    return await service.get_history(user_id, limit, cursor)


@router.get("/{attempt_id}", response_model=AttemptDetail)
async def get_attempt_detail(
    attempt_id: str,
    user_id: str = Depends(get_current_user_id),
    service: HistoryService = Depends(get_history_service),
):
    return await service.get_attempt_detail(user_id, attempt_id)
