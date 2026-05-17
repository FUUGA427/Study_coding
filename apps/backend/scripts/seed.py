"""開発用 seed: コース・レッスンの初期データを投入する。

実行:
    python -m scripts.seed
    （または docker compose run --rm backend python -m scripts.seed）

冪等: 既にコースが1件でも存在する場合はスキップする。再投入したい場合は
courses テーブルを TRUNCATE するか DB を作り直すこと。
"""
from __future__ import annotations

import asyncio
import uuid

from sqlalchemy import select

from app.db.session import async_session
from app.models.course import Course, CourseLevel
from app.models.lesson import Difficulty, Lesson, LessonType


COURSES: list[dict] = [
    {
        "title": "Python 入門",
        "description": "プログラミング未経験者向け。変数・型・制御構文の基礎を学ぶ。",
        "level": CourseLevel.beginner,
        "sort_order": 1,
        "lessons": [
            {
                "title": "変数と型",
                "description": "Python の基本的な型を確認する4択クイズ。",
                "lesson_type": LessonType.quiz,
                "difficulty": Difficulty.easy,
                "sort_order": 1,
                "tags": ["python", "basics", "type"],
                "content": {
                    "question": "次のうち、Python の整数型はどれですか?",
                    "choices": ["int", "integer", "number", "long"],
                    "correct_index": 0,
                },
            },
            {
                "title": "FizzBuzz",
                "description": "定番の入門コーディング問題。",
                "lesson_type": LessonType.coding,
                "difficulty": Difficulty.easy,
                "sort_order": 2,
                "tags": ["python", "control-flow", "fizzbuzz"],
                "content": {
                    "problem_description": (
                        "1 から 15 までの数値を順に出力してください。"
                        "ただし、3 の倍数のときは Fizz、5 の倍数のときは Buzz、"
                        "両方の倍数のときは FizzBuzz を出力してください。"
                    ),
                    "language": "python",
                    "starter_code": (
                        "for i in range(1, 16):\n"
                        "    # ここに実装\n"
                        "    pass\n"
                    ),
                    "test_cases": [
                        {
                            "input": "",
                            "expected_output": (
                                "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\n"
                                "Buzz\n11\nFizz\n13\n14\nFizzBuzz\n"
                            ),
                        }
                    ],
                },
            },
            {
                "title": "イテレーション入門",
                "description": "for / while の使い分けを読み物で学ぶ。",
                "lesson_type": LessonType.reading,
                "difficulty": Difficulty.easy,
                "sort_order": 3,
                "tags": ["python", "loop"],
                "content": {
                    "body": (
                        "Python の繰り返し構文には for と while があります。\n\n"
                        "for は反復可能オブジェクト(リスト・range 等)の要素を1つずつ取り出して処理します。\n"
                        "while は条件式が True の間、ブロックを繰り返します。\n\n"
                        "次のレッスンで実際に for を書いてみましょう。"
                    )
                },
            },
        ],
    },
    {
        "title": "アルゴリズム中級",
        "description": "計算量とデータ構造に踏み込む。配列・連想配列の典型問題。",
        "level": CourseLevel.intermediate,
        "sort_order": 2,
        "lessons": [
            {
                "title": "計算量 O 記法",
                "description": "代表的な計算量の比較に関する4択クイズ。",
                "lesson_type": LessonType.quiz,
                "difficulty": Difficulty.medium,
                "sort_order": 1,
                "tags": ["algorithm", "complexity"],
                "content": {
                    "question": "ソート済み配列に対する二分探索の最悪計算量はどれですか?",
                    "choices": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
                    "correct_index": 1,
                },
            },
            {
                "title": "重複検出",
                "description": "ハッシュマップを使って最初の重複を見つける。",
                "lesson_type": LessonType.coding,
                "difficulty": Difficulty.medium,
                "sort_order": 2,
                "tags": ["algorithm", "hashmap"],
                "content": {
                    "problem_description": (
                        "整数のリスト nums を受け取り、最初に出現する重複値を返す "
                        "find_duplicate(nums) を実装してください。"
                        "重複がない場合は -1 を返します。"
                    ),
                    "language": "python",
                    "starter_code": (
                        "def find_duplicate(nums):\n"
                        "    # ここに実装\n"
                        "    return -1\n"
                    ),
                    "test_cases": [
                        {"input": "[1, 2, 3, 1]", "expected_output": "1"},
                        {"input": "[1, 2, 3, 4]", "expected_output": "-1"},
                    ],
                },
            },
        ],
    },
    {
        "title": "システム設計 上級",
        "description": "API 設計と非同期処理を題材にした実践的な上級コース。",
        "level": CourseLevel.advanced,
        "sort_order": 3,
        "lessons": [
            {
                "title": "REST 設計",
                "description": "適切な HTTP メソッドを選ぶ4択クイズ。",
                "lesson_type": LessonType.quiz,
                "difficulty": Difficulty.hard,
                "sort_order": 1,
                "tags": ["api", "rest"],
                "content": {
                    "question": "ある資源の一部のフィールドを更新する場合、最も適切な HTTP メソッドはどれですか?",
                    "choices": ["GET", "POST", "PUT", "PATCH"],
                    "correct_index": 3,
                },
            },
            {
                "title": "非同期キュー設計",
                "description": "AI 生成のような重い処理を扱う非同期パターンの読み物。",
                "lesson_type": LessonType.reading,
                "difficulty": Difficulty.hard,
                "sort_order": 2,
                "tags": ["async", "queue"],
                "content": {
                    "body": (
                        "重い処理(AI 生成や外部 API 呼び出し)は同期 HTTP では返せません。\n"
                        "本サービスでは async_tasks テーブルに状態を保存し、"
                        "クライアントは task_id を polling します。\n\n"
                        "実装ポイント:\n"
                        "- リクエスト受領時に task_id を即時返却する\n"
                        "- バックグラウンドで状態遷移 (pending -> processing -> completed/failed)\n"
                        "- 失敗時は error_message を保存し、リトライ方針を別途決める"
                    )
                },
            },
        ],
    },
]


async def seed() -> None:
    async with async_session() as session:
        existing = await session.execute(select(Course).limit(1))
        if existing.scalar_one_or_none() is not None:
            print("[seed] courses が既に存在するためスキップします。")
            return

        for course_def in COURSES:
            course = Course(
                id=uuid.uuid4(),
                title=course_def["title"],
                description=course_def["description"],
                level=course_def["level"],
                sort_order=course_def["sort_order"],
                is_published=True,
            )
            session.add(course)
            await session.flush()

            for lesson_def in course_def["lessons"]:
                session.add(
                    Lesson(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        title=lesson_def["title"],
                        description=lesson_def["description"],
                        lesson_type=lesson_def["lesson_type"],
                        difficulty=lesson_def["difficulty"],
                        sort_order=lesson_def["sort_order"],
                        content=lesson_def["content"],
                        tags=lesson_def["tags"],
                        is_published=True,
                    )
                )

        await session.commit()
        total_lessons = sum(len(c["lessons"]) for c in COURSES)
        print(
            f"[seed] {len(COURSES)} コース / {total_lessons} レッスンを投入しました。"
        )


if __name__ == "__main__":
    asyncio.run(seed())
