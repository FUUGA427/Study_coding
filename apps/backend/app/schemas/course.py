from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class CourseResponse(BaseModel):
    id: str
    title: str
    description: str | None
    level: str
    sort_order: int
    is_published: bool
    prerequisite_course_id: str | None = None

    model_config = {"from_attributes": True}


class CourseWithProgressResponse(CourseResponse):
    progress_status: str = "not_started"
    progress_pct: Decimal = Decimal("0.00")
    is_unlocked: bool = False


class CourseListResponse(BaseModel):
    courses: list[CourseWithProgressResponse]
