"""init schema

Revision ID: 0001_init
Revises:
Create Date: 2026-05-17

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


ENUMS: list[tuple[str, tuple[str, ...]]] = [
    ("course_level", ("beginner", "intermediate", "advanced")),
    ("lesson_type", ("quiz", "coding", "reading")),
    ("difficulty", ("easy", "medium", "hard")),
    ("progress_status", ("not_started", "in_progress", "completed")),
    ("generation_status", ("pending", "generating", "completed", "failed")),
    ("problem_source", ("fixed", "generated")),
    ("recommendation_type", ("retry", "similar", "weakness", "forgetting")),
    ("recommendation_status", ("pending", "viewed", "attempted", "dismissed")),
    ("task_status", ("pending", "processing", "completed", "failed")),
]


def _enum(name: str) -> postgresql.ENUM:
    """既に CREATE TYPE 済みの enum をカラム定義で参照するためのヘルパー"""
    return postgresql.ENUM(name=name, create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    for name, values in ENUMS:
        postgresql.ENUM(*values, name=name).create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("username", sa.String(100), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "courses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("level", _enum("course_level"), nullable=False),
        sa.Column(
            "prerequisite_course_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id"),
            nullable=True,
        ),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "is_published", sa.Boolean, nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_courses_level", "courses", ["level"])

    op.create_table(
        "lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "course_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("lesson_type", _enum("lesson_type"), nullable=False),
        sa.Column("difficulty", _enum("difficulty"), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default="0"),
        sa.Column("content", postgresql.JSONB, nullable=False),
        sa.Column("max_score", sa.Integer, nullable=False, server_default="100"),
        sa.Column("pass_score", sa.Integer, nullable=False, server_default="60"),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(50)),
            nullable=False,
            server_default=sa.text("'{}'::varchar[]"),
        ),
        sa.Column(
            "is_published", sa.Boolean, nullable=False, server_default=sa.text("false")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_lessons_course_id", "lessons", ["course_id"])

    op.create_table(
        "submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("submitted_code", sa.Text, nullable=True),
        sa.Column("answer", postgresql.JSONB, nullable=True),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_correct", sa.Boolean, nullable=False),
        sa.Column("ai_review", sa.Text, nullable=True),
        sa.Column("ai_review_requested_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ai_review_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("execution_time_ms", sa.Integer, nullable=True),
        sa.Column(
            "submitted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_submissions_user_id", "submissions", ["user_id"])

    op.create_table(
        "lesson_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", _enum("progress_status"), nullable=False),
        sa.Column("best_score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("attempt_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("last_attempted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "user_id", "lesson_id", name="uq_lesson_progress_user_lesson"
        ),
    )
    op.create_index("ix_lesson_progress_user_id", "lesson_progress", ["user_id"])

    op.create_table(
        "course_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "course_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("courses.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", _enum("progress_status"), nullable=False),
        sa.Column(
            "progress_pct", sa.Numeric(5, 2), nullable=False, server_default="0.00"
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint(
            "user_id", "course_id", name="uq_course_progress_user_course"
        ),
    )
    op.create_index("ix_course_progress_user_id", "course_progress", ["user_id"])

    op.create_table(
        "generated_problems",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("problem_type", _enum("lesson_type"), nullable=False),
        sa.Column("difficulty", _enum("difficulty"), nullable=False),
        sa.Column(
            "tags",
            postgresql.ARRAY(sa.String(50)),
            nullable=False,
            server_default=sa.text("'{}'::varchar[]"),
        ),
        sa.Column("content", postgresql.JSONB, nullable=False),
        sa.Column("generation_prompt", sa.Text, nullable=True),
        sa.Column("generation_status", _enum("generation_status"), nullable=False),
        sa.Column(
            "source_lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id"),
            nullable=True,
        ),
        sa.Column("bedrock_request_id", sa.String(100), nullable=True),
        sa.Column("model_id", sa.String(100), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index(
        "ix_generated_problems_user_id", "generated_problems", ["user_id"]
    )
    op.create_index(
        "ix_generated_problems_status",
        "generated_problems",
        ["generation_status"],
    )

    op.create_table(
        "problem_attempts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("problem_source", _enum("problem_source"), nullable=False),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id"),
            nullable=True,
        ),
        sa.Column(
            "generated_problem_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("generated_problems.id"),
            nullable=True,
        ),
        sa.Column("submitted_code", sa.Text, nullable=True),
        sa.Column("answer", postgresql.JSONB, nullable=True),
        sa.Column("score", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_correct", sa.Boolean, nullable=False),
        sa.Column("ai_review", sa.Text, nullable=True),
        sa.Column("time_spent_seconds", sa.Integer, nullable=True),
        sa.Column(
            "attempted_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "(problem_source = 'fixed' AND lesson_id IS NOT NULL) OR "
            "(problem_source = 'generated' AND generated_problem_id IS NOT NULL)",
            name="chk_problem_ref",
        ),
    )
    op.create_index("ix_problem_attempts_user_id", "problem_attempts", ["user_id"])

    op.create_table(
        "review_recommendations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "recommendation_type", _enum("recommendation_type"), nullable=False
        ),
        sa.Column("problem_source", _enum("problem_source"), nullable=False),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("lessons.id"),
            nullable=True,
        ),
        sa.Column(
            "generated_problem_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("generated_problems.id"),
            nullable=True,
        ),
        sa.Column(
            "priority_score", sa.Numeric(6, 2), nullable=False, server_default="0.00"
        ),
        sa.Column(
            "score_breakdown",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("reason", sa.Text, nullable=True),
        sa.Column("status", _enum("recommendation_status"), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("acted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_review_recommendations_user_id", "review_recommendations", ["user_id"]
    )

    op.create_table(
        "user_weakness_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("tag", sa.String(50), nullable=False),
        sa.Column("total_attempts", sa.Integer, nullable=False, server_default="0"),
        sa.Column("correct_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column(
            "accuracy_rate", sa.Numeric(5, 2), nullable=False, server_default="0.00"
        ),
        sa.Column(
            "avg_score", sa.Numeric(5, 2), nullable=False, server_default="0.00"
        ),
        sa.Column("last_attempted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("user_id", "tag", name="uq_weakness_user_tag"),
    )
    op.create_index(
        "ix_user_weakness_profiles_user_id",
        "user_weakness_profiles",
        ["user_id"],
    )

    op.create_table(
        "learning_streaks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("streak_date", sa.Date, nullable=False),
        sa.Column("problems_solved", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_score", sa.Integer, nullable=False, server_default="0"),
        sa.UniqueConstraint("user_id", "streak_date", name="uq_streak_user_date"),
    )

    op.create_table(
        "async_tasks",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("task_type", sa.String(50), nullable=False),
        sa.Column("status", _enum("task_status"), nullable=False),
        sa.Column(
            "input_data",
            postgresql.JSONB,
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("result_data", postgresql.JSONB, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_async_tasks_user_id", "async_tasks", ["user_id"])


def downgrade() -> None:
    op.drop_table("async_tasks")
    op.drop_table("learning_streaks")
    op.drop_table("user_weakness_profiles")
    op.drop_table("review_recommendations")
    op.drop_table("problem_attempts")
    op.drop_table("generated_problems")
    op.drop_table("course_progress")
    op.drop_table("lesson_progress")
    op.drop_table("submissions")
    op.drop_table("lessons")
    op.drop_table("courses")
    op.drop_table("users")

    bind = op.get_bind()
    for name, _ in reversed(ENUMS):
        postgresql.ENUM(name=name).drop(bind, checkfirst=True)
