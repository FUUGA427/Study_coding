from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.course_repository import CourseRepository
from app.repositories.problem_repository import ProblemRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.repositories.user_repository import UserRepository
from app.services.ai_review_service import AIReviewService
from app.services.auth_service import AuthService
from app.services.bedrock_service import BedrockService
from app.services.course_service import CourseService
from app.services.history_service import HistoryService
from app.services.problem_generation_service import ProblemGenerationService
from app.services.recommendation_service import RecommendationService


# --- Repositories ---


def get_user_repo(db: AsyncSession = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_course_repo(db: AsyncSession = Depends(get_db)) -> CourseRepository:
    return CourseRepository(db)


def get_problem_repo(db: AsyncSession = Depends(get_db)) -> ProblemRepository:
    return ProblemRepository(db)


def get_attempt_repo(db: AsyncSession = Depends(get_db)) -> AttemptRepository:
    return AttemptRepository(db)


def get_recommendation_repo(db: AsyncSession = Depends(get_db)) -> RecommendationRepository:
    return RecommendationRepository(db)


# --- Services ---


def get_bedrock_service() -> BedrockService:
    return BedrockService()


def get_auth_service(user_repo: UserRepository = Depends(get_user_repo)) -> AuthService:
    return AuthService(user_repo)


def get_course_service(
    course_repo: CourseRepository = Depends(get_course_repo),
    attempt_repo: AttemptRepository = Depends(get_attempt_repo),
) -> CourseService:
    return CourseService(course_repo, attempt_repo)


def get_problem_generation_service(
    bedrock: BedrockService = Depends(get_bedrock_service),
    problem_repo: ProblemRepository = Depends(get_problem_repo),
) -> ProblemGenerationService:
    return ProblemGenerationService(bedrock, problem_repo)


def get_ai_review_service(
    bedrock: BedrockService = Depends(get_bedrock_service),
    problem_repo: ProblemRepository = Depends(get_problem_repo),
) -> AIReviewService:
    return AIReviewService(bedrock, problem_repo)


def get_history_service(
    attempt_repo: AttemptRepository = Depends(get_attempt_repo),
) -> HistoryService:
    return HistoryService(attempt_repo)


def get_recommendation_service(
    attempt_repo: AttemptRepository = Depends(get_attempt_repo),
    recommendation_repo: RecommendationRepository = Depends(get_recommendation_repo),
    bedrock: BedrockService = Depends(get_bedrock_service),
) -> RecommendationService:
    return RecommendationService(attempt_repo, recommendation_repo, bedrock)
