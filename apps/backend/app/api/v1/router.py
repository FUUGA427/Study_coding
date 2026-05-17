from fastapi import APIRouter

from app.api.v1 import ai_review, auth, courses, history, practice, recommendations

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(courses.router)
api_router.include_router(practice.router)
api_router.include_router(history.router)
api_router.include_router(recommendations.router)
api_router.include_router(ai_review.router)
