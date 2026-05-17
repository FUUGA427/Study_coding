from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    course_progress = relationship("CourseProgress", back_populates="user", lazy="selectin")
    submissions = relationship("Submission", back_populates="user", lazy="noload")
    problem_attempts = relationship("ProblemAttempt", back_populates="user", lazy="noload")
    weakness_profiles = relationship(
        "UserWeaknessProfile", back_populates="user", lazy="noload"
    )
