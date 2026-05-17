import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.async_task import AsyncTask, TaskStatus
from app.models.generated_problem import GeneratedProblem, GenerationStatus
from app.models.lesson import Lesson


class ProblemRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_lesson(self, lesson_id: str) -> Lesson | None:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_generated_problem(self, problem_id: str) -> GeneratedProblem | None:
        stmt = select(GeneratedProblem).where(GeneratedProblem.id == problem_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def save_generated_problem(
        self,
        user_id: str,
        problem_type: str,
        difficulty: str,
        tags: list[str],
        content: dict,
        source_lesson_id: str | None = None,
        generation_prompt: str | None = None,
        model_id: str | None = None,
    ) -> str:
        problem = GeneratedProblem(
            user_id=user_id,
            problem_type=problem_type,
            difficulty=difficulty,
            tags=tags,
            content=content,
            generation_status=GenerationStatus.completed,
            source_lesson_id=source_lesson_id,
            generation_prompt=generation_prompt,
            model_id=model_id,
        )
        self.db.add(problem)
        await self.db.flush()
        return str(problem.id)

    async def create_async_task(
        self,
        task_id: str,
        user_id: str,
        task_type: str,
        input_data: dict,
    ) -> AsyncTask:
        task = AsyncTask(
            id=uuid.UUID(task_id),
            user_id=user_id,
            task_type=task_type,
            input_data=input_data,
        )
        self.db.add(task)
        await self.db.flush()
        return task

    async def get_async_task(self, task_id: str, user_id: str) -> AsyncTask | None:
        stmt = select(AsyncTask).where(
            AsyncTask.id == task_id,
            AsyncTask.user_id == user_id,
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_task_status(self, task_id: str, status: str) -> None:
        now = datetime.now(timezone.utc)
        values: dict = {"status": status}
        if status == "processing":
            values["started_at"] = now
        stmt = update(AsyncTask).where(AsyncTask.id == task_id).values(**values)
        await self.db.execute(stmt)

    async def update_task_result(
        self,
        task_id: str,
        status: str,
        result_data: dict | None = None,
        error_message: str | None = None,
    ) -> None:
        now = datetime.now(timezone.utc)
        values: dict = {"status": status, "completed_at": now}
        if result_data:
            values["result_data"] = result_data
        if error_message:
            values["error_message"] = error_message
        stmt = update(AsyncTask).where(AsyncTask.id == task_id).values(**values)
        await self.db.execute(stmt)
