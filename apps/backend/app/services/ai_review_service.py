import uuid
from datetime import datetime, timezone

from app.core.exceptions import AIServiceError, NotFoundError
from app.repositories.problem_repository import ProblemRepository
from app.services.bedrock_service import BedrockService


REVIEW_SYSTEM_PROMPT = """あなたはプログラミング教育の専門家です。
学習者のレベル: {level}

以下の観点でコードレビューしてください:
1. 正確性: コードが問題の要件を満たしているか
2. 効率性: 時間・空間計算量は適切か
3. 可読性: 変数名、構造は適切か
4. ベストプラクティス: {language}の慣習に沿っているか
5. 改善点: 具体的な改善案（コード例付き）

学習者のレベルに合わせた説明をしてください。
- beginner: 基本的な概念から丁寧に
- intermediate: ポイントを絞って
- advanced: 高度な最適化やデザインパターンにも言及"""


class AIReviewService:
    def __init__(self, bedrock: BedrockService, problem_repo: ProblemRepository):
        self.bedrock = bedrock
        self.problem_repo = problem_repo

    async def request_review(
        self,
        user_id: str,
        code: str,
        problem_description: str,
        language: str = "python",
        user_level: str = "beginner",
    ) -> str:
        """レビューを非同期で開始し、task_idを返す"""
        task_id = str(uuid.uuid4())
        await self.problem_repo.create_async_task(
            task_id=task_id,
            user_id=user_id,
            task_type="ai_review",
            input_data={
                "code": code,
                "problem_description": problem_description,
                "language": language,
                "user_level": user_level,
            },
        )

        # レビュー実行（本番ではSQSワーカーで処理）
        await self._execute_review(task_id, code, problem_description, language, user_level)
        return task_id

    async def _execute_review(
        self,
        task_id: str,
        code: str,
        problem_description: str,
        language: str,
        user_level: str,
    ) -> None:
        try:
            await self.problem_repo.update_task_status(task_id, "processing")

            system_prompt = REVIEW_SYSTEM_PROMPT.format(level=user_level, language=language)
            user_message = f"""## 問題
{problem_description}

## 提出コード ({language})
```{language}
{code}
```"""

            review = await self.bedrock.invoke(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.3,
            )

            await self.problem_repo.update_task_result(
                task_id=task_id,
                status="completed",
                result_data={"review": review},
            )
        except Exception as e:
            await self.problem_repo.update_task_result(
                task_id=task_id,
                status="failed",
                error_message=str(e),
            )

    async def get_review_result(self, task_id: str, user_id: str) -> dict:
        task = await self.problem_repo.get_async_task(task_id, user_id)
        if not task:
            raise NotFoundError("タスク")

        result = {
            "task_id": str(task.id),
            "status": task.status.value,
        }
        if task.result_data:
            result["review"] = task.result_data.get("review")
        if task.error_message:
            result["error_message"] = task.error_message

        return result
