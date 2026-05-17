from fastapi import APIRouter, Depends

from app.core.security import get_current_user_id
from app.dependencies import get_course_service
from app.schemas.course import CourseListResponse
from app.schemas.lesson import (
    LessonDetailResponse,
    LessonListResponse,
    SubmitLessonRequest,
    SubmitLessonResponse,
)
from app.services.course_service import CourseService

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=CourseListResponse)
async def list_courses(
    user_id: str = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service),
):
    return await service.list_courses(user_id)


@router.get("/{course_id}/lessons", response_model=LessonListResponse)
async def get_lessons(
    course_id: str,
    user_id: str = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service),
):
    return await service.get_lessons(user_id, course_id)


@router.get("/lessons/{lesson_id}", response_model=LessonDetailResponse)
async def get_lesson_detail(
    lesson_id: str,
    user_id: str = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service),
):
    return await service.get_lesson_detail(user_id, lesson_id)


@router.post("/lessons/{lesson_id}/submit", response_model=SubmitLessonResponse)
async def submit_lesson(
    lesson_id: str,
    req: SubmitLessonRequest,
    user_id: str = Depends(get_current_user_id),
    service: CourseService = Depends(get_course_service),
):
    return await service.submit_lesson(user_id, lesson_id, req)
