from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class RecommendationItem(BaseModel):
    id: str
    recommendation_type: str
    problem_source: str
    lesson_id: str | None
    generated_problem_id: str | None
    priority_score: Decimal
    score_breakdown: dict
    reason: str | None
    lesson_title: str | None = None

    model_config = {"from_attributes": True}


class RecommendationListResponse(BaseModel):
    items: list[RecommendationItem]


class WeaknessItem(BaseModel):
    tag: str
    total_attempts: int
    correct_count: int
    accuracy_rate: Decimal
    avg_score: Decimal

    model_config = {"from_attributes": True}


class WeaknessProfileResponse(BaseModel):
    items: list[WeaknessItem]
