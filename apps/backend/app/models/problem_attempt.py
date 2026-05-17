import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin


class ProblemSource(str, enum.Enum):
    fixed = "fixed"
    generated = "generated"


class ProblemAttempt(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "problem_attempts"
    __table_args__ = (
        CheckConstraint(
            "(problem_source = 'fixed' AND lesson_id IS NOT NULL) OR "
            "(problem_source = 'generated' AND generated_problem_id IS NOT NULL)",
            name="chk_problem_ref",
        ),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    problem_source: Mapped[ProblemSource] = mapped_column(
        Enum(ProblemSource, name="problem_source"), nullable=False
    )
    lesson_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("lessons.id"), nullable=True
    )
    generated_problem_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("generated_problems.id"), nullable=True
    )
    submitted_code: Mapped[str | None] = mapped_column(Text)
    answer: Mapped[dict | None] = mapped_column(JSONB)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    ai_review: Mapped[str | None] = mapped_column(Text)
    time_spent_seconds: Mapped[int | None] = mapped_column(Integer)
    attempted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="now()", nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="problem_attempts")
    lesson = relationship("Lesson", lazy="selectin")
    generated_problem = relationship("GeneratedProblem", lazy="selectin")
