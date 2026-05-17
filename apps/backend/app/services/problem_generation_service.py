import json
import uuid

from app.core.exceptions import AIServiceError, NotFoundError
from app.repositories.problem_repository import ProblemRepository
from app.services.bedrock_service import BedrockService

QUIZ_SYSTEM_PROMPT = """あなたはプログラミング教育の問題作成の専門家です。
指定された条件に基づいて、プログラミングのクイズ問題を1問作成してください。

制約:
- 問題文は明確で曖昧さがないこと
- 選択肢は4つ、紛らわしい誤答を含めること
- 解説は「なぜその答えが正しいか」と「なぜ他が間違いか」を含めること

以下のJSON形式で出力してください:
{
    "question": "問題文",
    "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
    "correct_index": 0,
    "explanation": "解説文",
    "tags": ["関連タグ"]
}"""

CODING_SYSTEM_PROMPT = """あなたはプログラミング教育の問題作成の専門家です。
指定された条件に基づいて、コーディング問題を1問作成してください。

制約:
- 問題文は入出力の形式を明確に記述
- スターターコードは関数シグネチャのみ
- テストケースは最低3つ（通常・エッジ・大入力）
- ヒントは段階的に3つ

以下のJSON形式で出力してください:
{
    "description": "問題文",
    "starter_code": "def solution(...):\\n    pass",
    "test_cases": [
        {"input": "...", "expected_output": "...", "description": "テスト説明"}
    ],
    "language": "python",
    "hints": ["ヒント1", "ヒント2", "ヒント3"],
    "solution": "模範解答コード",
    "tags": ["関連タグ"]
}"""

TAG_TOPICS = {
    "loops": "ループ処理（for, while, ネスト、break/continue）",
    "recursion": "再帰（基本再帰、末尾再帰、分割統治）",
    "arrays": "配列操作（ソート、検索、二次元配列）",
    "strings": "文字列処理（パース、正規表現、Unicode）",
    "trees": "木構造（二分木、探索、走査）",
    "graphs": "グラフ（BFS、DFS、最短経路）",
    "dp": "動的計画法（メモ化、ボトムアップ）",
    "sql_basics": "SQL基礎（SELECT, WHERE, JOIN）",
    "sql_advanced": "SQL応用（サブクエリ、ウィンドウ関数、CTE）",
    "oop": "オブジェクト指向（クラス設計、継承、ポリモーフィズム）",
    "api": "API設計（REST、ステータスコード、認証）",
    "testing": "テスト（単体テスト、モック、TDD）",
}

DIFFICULTY_GUIDANCE = {
    "easy": "初学者向け。基本的な構文や概念を問う。",
    "medium": "中級者向け。複数の概念を組み合わせる。エッジケースの考慮が必要。",
    "hard": "上級者向け。最適化、設計判断、複雑なアルゴリズムを要する。",
}


class ProblemGenerationService:
    def __init__(self, bedrock: BedrockService, problem_repo: ProblemRepository):
        self.bedrock = bedrock
        self.problem_repo = problem_repo

    async def enqueue_generation(
        self,
        user_id: str,
        problem_type: str,
        difficulty: str,
        tags: list[str],
        source_lesson_id: str | None = None,
    ) -> str:
        task_id = str(uuid.uuid4())
        await self.problem_repo.create_async_task(
            task_id=task_id,
            user_id=user_id,
            task_type="problem_generation",
            input_data={
                "problem_type": problem_type,
                "difficulty": difficulty,
                "tags": tags,
                "source_lesson_id": source_lesson_id,
            },
        )

        await self._generate_and_save(
            task_id, user_id, problem_type, difficulty, tags, source_lesson_id
        )
        return task_id

    async def _generate_and_save(
        self,
        task_id: str,
        user_id: str,
        problem_type: str,
        difficulty: str,
        tags: list[str],
        source_lesson_id: str | None,
    ) -> None:
        try:
            await self.problem_repo.update_task_status(task_id, "processing")

            system_prompt = QUIZ_SYSTEM_PROMPT if problem_type == "quiz" else CODING_SYSTEM_PROMPT

            tag_descriptions = [TAG_TOPICS.get(t, t) for t in tags]
            user_message = f"""## 条件
- 難易度: {difficulty} — {DIFFICULTY_GUIDANCE.get(difficulty, '')}
- トピック: {', '.join(tag_descriptions) if tag_descriptions else '自由'}
- 問題タイプ: {problem_type}
"""

            if source_lesson_id:
                source = await self.problem_repo.get_lesson(source_lesson_id)
                if source:
                    user_message += (
                        "\n以下の問題と「同じ概念を問うが、異なるシナリオ」の類題を作成してください。\n"
                        f"\n元の問題:\n{json.dumps(source.content, ensure_ascii=False)}"
                    )

            content = await self.bedrock.invoke_json(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.8,
            )

            if not self._validate(content, problem_type):
                raise ValueError("生成された問題のバリデーションに失敗しました")

            problem_id = await self.problem_repo.save_generated_problem(
                user_id=user_id,
                problem_type=problem_type,
                difficulty=difficulty,
                tags=content.get("tags", tags),
                content=content,
                source_lesson_id=source_lesson_id,
                generation_prompt=user_message,
                model_id=self.bedrock.model_id,
            )

            await self.problem_repo.update_task_result(
                task_id=task_id,
                status="completed",
                result_data={"problem_id": problem_id},
            )

        except Exception as e:
            await self.problem_repo.update_task_result(
                task_id=task_id,
                status="failed",
                error_message=str(e),
            )

    async def get_task_status(self, task_id: str, user_id: str) -> dict | None:
        task = await self.problem_repo.get_async_task(task_id, user_id)
        if not task:
            return None

        result = {"task_id": str(task.id), "status": task.status.value}

        if task.status.value == "completed" and task.result_data:
            problem_id = task.result_data.get("problem_id")
            if problem_id:
                problem = await self.problem_repo.get_generated_problem(problem_id)
                if problem:
                    result["problem"] = {
                        "id": str(problem.id),
                        "problem_type": problem.problem_type.value,
                        "difficulty": problem.difficulty.value,
                        "tags": problem.tags,
                        "content": problem.content,
                    }

        if task.error_message:
            result["error_message"] = task.error_message

        return result

    def _validate(self, content: dict, problem_type: str) -> bool:
        if problem_type == "quiz":
            required = {"question", "choices", "correct_index", "explanation"}
            if not required.issubset(content.keys()):
                return False
            if not isinstance(content["choices"], list) or len(content["choices"]) != 4:
                return False
            if not isinstance(content["correct_index"], int):
                return False
            if not 0 <= content["correct_index"] <= 3:
                return False
            return True

        if problem_type == "coding":
            required = {"description", "starter_code", "test_cases"}
            if not required.issubset(content.keys()):
                return False
            if not isinstance(content["test_cases"], list) or len(content["test_cases"]) < 2:
                return False
            return True

        return False
