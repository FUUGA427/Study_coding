# プログラミング学習プラットフォーム — 実装設計書

---

## ① アーキテクチャの改善点

### 現状の課題と改善

#### 1. キャッシュ層の追加（ElastiCache Redis）

レコメンド計算結果やAI生成問題のキャッシュが必須。RDSへの不要なクエリを削減する。

```
[CloudFront] → [ALB] → [ECS Fargate]
                            ├── [RDS PostgreSQL]
                            ├── [ElastiCache Redis]  ← 追加
                            ├── [Bedrock Claude]
                            └── [SQS]  ← 追加（非同期処理用）
```

#### 2. 非同期処理キュー（SQS + Lambda or ECS Task）

AI生成問題・コードレビューは3〜10秒かかるため、同期APIで返すとUXが悪い。

```
フロー:
1. POST /api/practice/generate → SQSにメッセージ投入 → 202 Accepted + task_id返却
2. フロントは task_id でポーリング or WebSocket待機
3. バックグラウンドワーカーが Bedrock 呼び出し → 結果をDB保存
4. GET /api/practice/status/{task_id} → 完了なら問題データ返却
```

#### 3. ディレクトリ構成（改善版）

```
backend/
├── app/
│   ├── main.py                    # FastAPIエントリポイント
│   ├── config.py                  # 設定管理
│   ├── dependencies.py            # DI定義
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── router.py          # ルーター集約
│   │   │   ├── auth.py
│   │   │   ├── courses.py
│   │   │   ├── lessons.py
│   │   │   ├── practice.py
│   │   │   ├── history.py
│   │   │   ├── recommendations.py
│   │   │   └── ai_review.py
│   ├── models/                    # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── submission.py
│   │   ├── generated_problem.py
│   │   ├── problem_attempt.py
│   │   └── recommendation.py
│   ├── schemas/                   # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── lesson.py
│   │   ├── practice.py
│   │   ├── history.py
│   │   └── recommendation.py
│   ├── services/                  # ビジネスロジック
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── course_service.py
│   │   ├── bedrock_service.py
│   │   ├── ai_review_service.py
│   │   ├── problem_generation_service.py
│   │   ├── recommendation_service.py
│   │   └── history_service.py
│   ├── repositories/              # データアクセス層 ← 追加
│   │   ├── __init__.py
│   │   ├── user_repository.py
│   │   ├── course_repository.py
│   │   ├── problem_repository.py
│   │   ├── attempt_repository.py
│   │   └── recommendation_repository.py
│   ├── core/                      # 横断関心事
│   │   ├── __init__.py
│   │   ├── security.py
│   │   ├── exceptions.py
│   │   ├── middleware.py
│   │   └── logging.py
│   └── db/
│       ├── __init__.py
│       ├── session.py
│       └── migrations/            # Alembic
├── tests/
├── alembic.ini
├── pyproject.toml
└── Dockerfile
```

**重要な追加: Repository層**
Service層がSQLを直接書くと、テストしにくくDB変更に弱い。Repository層を挟む。

---

## ② DB設計（改善版）

### ERD概要

```
users ─┬── course_progress ──── courses
       │                          └── lessons ──── lesson_progress
       ├── submissions
       ├── problem_attempts ──── generated_problems
       ├── review_recommendations
       ├── user_weakness_profiles  ← 追加
       └── learning_streaks        ← 追加
```

### 完全なDDL

```sql
-- ===========================
-- ユーザー
-- ===========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- ===========================
-- コース
-- ===========================
CREATE TYPE course_level AS ENUM ('beginner', 'intermediate', 'advanced');

CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    level course_level NOT NULL,
    prerequisite_course_id UUID REFERENCES courses(id),
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_level ON courses(level);

-- ===========================
-- レッスン
-- ===========================
CREATE TYPE lesson_type AS ENUM ('quiz', 'coding', 'reading');
CREATE TYPE difficulty AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    lesson_type lesson_type NOT NULL,
    difficulty difficulty NOT NULL DEFAULT 'medium',
    sort_order INT NOT NULL DEFAULT 0,
    content JSONB NOT NULL,          -- 問題文・選択肢・テストケース等
    max_score INT NOT NULL DEFAULT 100,
    pass_score INT NOT NULL DEFAULT 60,
    tags VARCHAR(50)[] NOT NULL DEFAULT '{}',  -- タグ配列（苦手分析用）
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lessons_tags ON lessons USING GIN(tags);
CREATE INDEX idx_lessons_type_difficulty ON lessons(lesson_type, difficulty);

-- content JSONBの構造例:
-- クイズ: {"question": "...", "choices": [...], "correct_index": 0, "explanation": "..."}
-- コーディング: {"description": "...", "starter_code": "...", "test_cases": [...], "language": "python"}

-- ===========================
-- 提出（固定問題用）
-- ===========================
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    submitted_code TEXT,
    answer JSONB,                    -- クイズの場合の回答
    score INT NOT NULL DEFAULT 0,
    is_correct BOOLEAN NOT NULL,
    ai_review TEXT,                  -- AIレビュー結果
    ai_review_requested_at TIMESTAMPTZ,
    ai_review_completed_at TIMESTAMPTZ,
    execution_time_ms INT,           -- コード実行時間
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_user_lesson ON submissions(user_id, lesson_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- ===========================
-- レッスン進捗
-- ===========================
CREATE TYPE progress_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    status progress_status NOT NULL DEFAULT 'not_started',
    best_score INT NOT NULL DEFAULT 0,
    attempt_count INT NOT NULL DEFAULT 0,
    last_attempted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(user_id, status);

-- ===========================
-- コース進捗
-- ===========================
CREATE TABLE course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    status progress_status NOT NULL DEFAULT 'not_started',
    progress_pct DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 0.00〜100.00
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, course_id)
);

CREATE INDEX idx_course_progress_user ON course_progress(user_id);

-- ===========================
-- AI生成問題
-- ===========================
CREATE TYPE generation_status AS ENUM ('pending', 'generating', 'completed', 'failed');

CREATE TABLE generated_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_type lesson_type NOT NULL,
    difficulty difficulty NOT NULL,
    tags VARCHAR(50)[] NOT NULL DEFAULT '{}',
    content JSONB NOT NULL,               -- lessonsと同じ構造
    generation_prompt TEXT,               -- 生成に使ったプロンプト（デバッグ用）
    generation_status generation_status NOT NULL DEFAULT 'pending',
    source_lesson_id UUID REFERENCES lessons(id),  -- 類題元のレッスン（あれば）
    bedrock_request_id VARCHAR(100),      -- Bedrockリクエスト追跡用
    model_id VARCHAR(100),                -- 使用モデルID
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_problems_user ON generated_problems(user_id);
CREATE INDEX idx_generated_problems_tags ON generated_problems USING GIN(tags);
CREATE INDEX idx_generated_problems_status ON generated_problems(generation_status);
CREATE INDEX idx_generated_problems_source ON generated_problems(source_lesson_id)
    WHERE source_lesson_id IS NOT NULL;

-- ===========================
-- 問題解答履歴（固定・AI生成共通）
-- ===========================
CREATE TYPE problem_source AS ENUM ('fixed', 'generated');

CREATE TABLE problem_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_source problem_source NOT NULL,
    lesson_id UUID REFERENCES lessons(id),              -- fixed時
    generated_problem_id UUID REFERENCES generated_problems(id),  -- generated時
    submitted_code TEXT,
    answer JSONB,
    score INT NOT NULL DEFAULT 0,
    is_correct BOOLEAN NOT NULL,
    ai_review TEXT,
    time_spent_seconds INT,           -- 解答にかかった時間
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- どちらか一方は必須
    CONSTRAINT chk_problem_ref CHECK (
        (problem_source = 'fixed' AND lesson_id IS NOT NULL) OR
        (problem_source = 'generated' AND generated_problem_id IS NOT NULL)
    )
);

CREATE INDEX idx_attempts_user ON problem_attempts(user_id);
CREATE INDEX idx_attempts_user_lesson ON problem_attempts(user_id, lesson_id)
    WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_attempts_user_generated ON problem_attempts(user_id, generated_problem_id)
    WHERE generated_problem_id IS NOT NULL;
CREATE INDEX idx_attempts_attempted_at ON problem_attempts(user_id, attempted_at DESC);

-- ===========================
-- レコメンド
-- ===========================
CREATE TYPE recommendation_type AS ENUM ('retry', 'similar', 'weakness', 'forgetting');
CREATE TYPE recommendation_status AS ENUM ('pending', 'viewed', 'attempted', 'dismissed');

CREATE TABLE review_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type recommendation_type NOT NULL,
    problem_source problem_source NOT NULL,
    lesson_id UUID REFERENCES lessons(id),
    generated_problem_id UUID REFERENCES generated_problems(id),
    priority_score DECIMAL(6,2) NOT NULL DEFAULT 0,   -- スコアリング結果
    score_breakdown JSONB NOT NULL DEFAULT '{}',       -- 各因子のスコア内訳
    reason TEXT,                       -- AI生成の推薦理由
    status recommendation_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ,            -- 有効期限
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    acted_at TIMESTAMPTZ               -- ユーザーがアクションした日時
);

CREATE INDEX idx_recommendations_user_active ON review_recommendations(user_id, priority_score DESC)
    WHERE status = 'pending';
CREATE INDEX idx_recommendations_expires ON review_recommendations(expires_at)
    WHERE status = 'pending';

-- ===========================
-- ユーザー苦手プロファイル（追加）
-- ===========================
CREATE TABLE user_weakness_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag VARCHAR(50) NOT NULL,            -- "loops", "recursion", "sql_join" 等
    total_attempts INT NOT NULL DEFAULT 0,
    correct_count INT NOT NULL DEFAULT 0,
    accuracy_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 正答率
    avg_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    last_attempted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, tag)
);

CREATE INDEX idx_weakness_user ON user_weakness_profiles(user_id);
CREATE INDEX idx_weakness_accuracy ON user_weakness_profiles(user_id, accuracy_rate ASC);

-- ===========================
-- 学習ストリーク（追加・モチベーション用）
-- ===========================
CREATE TABLE learning_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_date DATE NOT NULL,
    problems_solved INT NOT NULL DEFAULT 0,
    total_score INT NOT NULL DEFAULT 0,
    UNIQUE(user_id, streak_date)
);

CREATE INDEX idx_streaks_user_date ON learning_streaks(user_id, streak_date DESC);

-- ===========================
-- 非同期タスク追跡（追加）
-- ===========================
CREATE TYPE task_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE async_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,       -- 'problem_generation', 'ai_review'
    status task_status NOT NULL DEFAULT 'pending',
    input_data JSONB NOT NULL DEFAULT '{}',
    result_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_async_tasks_user_status ON async_tasks(user_id, status);
CREATE INDEX idx_async_tasks_pending ON async_tasks(status, created_at)
    WHERE status = 'pending';
```

### インデックス設計のポイント

| 用途 | インデックス | 理由 |
|------|------------|------|
| ユーザーの学習履歴一覧 | `idx_attempts_user + attempted_at DESC` | 新しい順で一覧取得 |
| 苦手分野の特定 | `idx_weakness_accuracy ASC` | 正答率が低い順 |
| レコメンド取得 | `idx_recommendations_user_active` 部分インデックス | pending のみ高速取得 |
| タグ検索 | GIN(tags) | 配列のcontains検索 |
| 期限切れレコメンド削除 | `idx_recommendations_expires` 部分インデックス | バッチ処理用 |

---

## ③ FastAPIの実装構造

### main.py

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.middleware import RequestLoggingMiddleware
from app.config import settings
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 起動時: DB接続プール確認、Redisヘルスチェック等
    yield
    # 終了時: クリーンアップ
    await engine.dispose()


app = FastAPI(
    title="Programming Learning Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RequestLoggingMiddleware)

app.include_router(api_router, prefix="/api/v1")
```

### config.py

```python
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # DB
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # AWS
    AWS_REGION: str = "ap-northeast-1"
    BEDROCK_MODEL_ID: str = "anthropic.claude-sonnet-4-20250514-v1:0"
    BEDROCK_MAX_TOKENS: int = 4096

    # Auth
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # Rate Limiting
    AI_RATE_LIMIT_PER_MINUTE: int = 10
    AI_RATE_LIMIT_PER_HOUR: int = 100

    model_config = {"env_file": ".env"}


@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()
```

### db/session.py

```python
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from app.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### dependencies.py

```python
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.bedrock_service import BedrockService
from app.services.recommendation_service import RecommendationService
from app.services.problem_generation_service import ProblemGenerationService
from app.services.history_service import HistoryService
from app.services.ai_review_service import AIReviewService
from app.repositories.problem_repository import ProblemRepository
from app.repositories.attempt_repository import AttemptRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.core.security import get_current_user


def get_bedrock_service() -> BedrockService:
    return BedrockService()


def get_problem_repository(db: AsyncSession = Depends(get_db)) -> ProblemRepository:
    return ProblemRepository(db)


def get_attempt_repository(db: AsyncSession = Depends(get_db)) -> AttemptRepository:
    return AttemptRepository(db)


def get_recommendation_repository(db: AsyncSession = Depends(get_db)) -> RecommendationRepository:
    return RecommendationRepository(db)


def get_problem_generation_service(
    bedrock: BedrockService = Depends(get_bedrock_service),
    problem_repo: ProblemRepository = Depends(get_problem_repository),
) -> ProblemGenerationService:
    return ProblemGenerationService(bedrock, problem_repo)


def get_recommendation_service(
    attempt_repo: AttemptRepository = Depends(get_attempt_repository),
    recommendation_repo: RecommendationRepository = Depends(get_recommendation_repository),
    bedrock: BedrockService = Depends(get_bedrock_service),
) -> RecommendationService:
    return RecommendationService(attempt_repo, recommendation_repo, bedrock)
```

### schemas/practice.py

```python
from pydantic import BaseModel, Field
from enum import Enum
from datetime import datetime


class ProblemType(str, Enum):
    quiz = "quiz"
    coding = "coding"


class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"


class GenerateProblemRequest(BaseModel):
    problem_type: ProblemType
    difficulty: Difficulty
    tags: list[str] = Field(default_factory=list, max_length=5)
    source_lesson_id: str | None = None  # 類題生成時


class GenerateProblemResponse(BaseModel):
    task_id: str
    status: str = "pending"
    message: str = "問題を生成中です"


class QuizContent(BaseModel):
    question: str
    choices: list[str]
    correct_index: int
    explanation: str


class CodingContent(BaseModel):
    description: str
    starter_code: str
    test_cases: list[dict]
    language: str = "python"
    hints: list[str] = Field(default_factory=list)


class ProblemDetail(BaseModel):
    id: str
    problem_type: ProblemType
    difficulty: Difficulty
    tags: list[str]
    content: QuizContent | CodingContent
    created_at: datetime


class SubmitAnswerRequest(BaseModel):
    problem_id: str
    problem_source: str  # "fixed" or "generated"
    submitted_code: str | None = None
    answer: dict | None = None
    time_spent_seconds: int | None = None


class SubmitAnswerResponse(BaseModel):
    is_correct: bool
    score: int
    ai_review: str | None = None
    task_id: str | None = None  # AIレビューが非同期の場合
```

### api/v1/practice.py

```python
from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.practice import (
    GenerateProblemRequest,
    GenerateProblemResponse,
    SubmitAnswerRequest,
    SubmitAnswerResponse,
)
from app.services.problem_generation_service import ProblemGenerationService
from app.services.ai_review_service import AIReviewService
from app.dependencies import get_problem_generation_service, get_current_user
from app.models.user import User
from app.core.rate_limit import rate_limit_ai

router = APIRouter(prefix="/practice", tags=["practice"])


@router.post("/generate", response_model=GenerateProblemResponse)
async def generate_problem(
    req: GenerateProblemRequest,
    current_user: User = Depends(get_current_user),
    service: ProblemGenerationService = Depends(get_problem_generation_service),
):
    await rate_limit_ai(current_user.id)
    task_id = await service.enqueue_generation(
        user_id=current_user.id,
        problem_type=req.problem_type,
        difficulty=req.difficulty,
        tags=req.tags,
        source_lesson_id=req.source_lesson_id,
    )
    return GenerateProblemResponse(task_id=task_id)


@router.get("/status/{task_id}")
async def get_generation_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    service: ProblemGenerationService = Depends(get_problem_generation_service),
):
    result = await service.get_task_status(task_id, current_user.id)
    if result is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    return result


@router.post("/submit", response_model=SubmitAnswerResponse)
async def submit_answer(
    req: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    service: ProblemGenerationService = Depends(get_problem_generation_service),
):
    return await service.evaluate_submission(current_user.id, req)
```

### api/v1/recommendations.py

```python
from fastapi import APIRouter, Depends, Query
from app.schemas.recommendation import RecommendationListResponse
from app.services.recommendation_service import RecommendationService
from app.dependencies import get_recommendation_service, get_current_user
from app.models.user import User

router = APIRouter(prefix="/recommend", tags=["recommendations"])


@router.get("/review", response_model=RecommendationListResponse)
async def get_review_recommendations(
    limit: int = Query(default=10, le=50),
    rec_type: str | None = Query(default=None, alias="type"),
    current_user: User = Depends(get_current_user),
    service: RecommendationService = Depends(get_recommendation_service),
):
    """優先度順のレコメンド一覧を返す"""
    return await service.get_recommendations(
        user_id=current_user.id,
        limit=limit,
        rec_type=rec_type,
    )


@router.post("/{recommendation_id}/dismiss")
async def dismiss_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_user),
    service: RecommendationService = Depends(get_recommendation_service),
):
    await service.dismiss(recommendation_id, current_user.id)
    return {"status": "dismissed"}


@router.get("/similar/{lesson_id}")
async def get_similar_problems(
    lesson_id: str,
    current_user: User = Depends(get_current_user),
    service: RecommendationService = Depends(get_recommendation_service),
):
    """指定レッスンの類題を取得（なければAI生成をキュー）"""
    return await service.get_or_generate_similar(lesson_id, current_user.id)
```

### repositories/attempt_repository.py

```python
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta

from app.models.problem_attempt import ProblemAttempt
from app.models.user_weakness_profile import UserWeaknessProfile


class AttemptRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_attempts(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[ProblemAttempt]:
        stmt = (
            select(ProblemAttempt)
            .where(ProblemAttempt.user_id == user_id)
            .order_by(ProblemAttempt.attempted_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_incorrect_attempts(
        self,
        user_id: str,
        since: datetime | None = None,
    ) -> list[ProblemAttempt]:
        conditions = [
            ProblemAttempt.user_id == user_id,
            ProblemAttempt.is_correct == False,
        ]
        if since:
            conditions.append(ProblemAttempt.attempted_at >= since)

        stmt = (
            select(ProblemAttempt)
            .where(and_(*conditions))
            .order_by(ProblemAttempt.attempted_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_weakness_profile(self, user_id: str) -> list[UserWeaknessProfile]:
        stmt = (
            select(UserWeaknessProfile)
            .where(UserWeaknessProfile.user_id == user_id)
            .order_by(UserWeaknessProfile.accuracy_rate.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_stale_attempts(
        self,
        user_id: str,
        days_threshold: int = 7,
    ) -> list[ProblemAttempt]:
        """一定期間解いていない問題（忘却曲線対策）"""
        threshold = datetime.utcnow() - timedelta(days=days_threshold)
        stmt = (
            select(ProblemAttempt)
            .where(
                and_(
                    ProblemAttempt.user_id == user_id,
                    ProblemAttempt.is_correct == True,
                    ProblemAttempt.attempted_at < threshold,
                )
            )
            .order_by(ProblemAttempt.attempted_at.asc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_weakness_profile(
        self,
        user_id: str,
        tag: str,
        is_correct: bool,
        score: int,
    ):
        """解答ごとに苦手プロファイルを更新"""
        stmt = select(UserWeaknessProfile).where(
            and_(
                UserWeaknessProfile.user_id == user_id,
                UserWeaknessProfile.tag == tag,
            )
        )
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()

        if profile is None:
            profile = UserWeaknessProfile(
                user_id=user_id,
                tag=tag,
                total_attempts=1,
                correct_count=1 if is_correct else 0,
                accuracy_rate=100.0 if is_correct else 0.0,
                avg_score=float(score),
            )
            self.db.add(profile)
        else:
            profile.total_attempts += 1
            if is_correct:
                profile.correct_count += 1
            profile.accuracy_rate = (profile.correct_count / profile.total_attempts) * 100
            profile.avg_score = (
                (profile.avg_score * (profile.total_attempts - 1) + score)
                / profile.total_attempts
            )
            profile.last_attempted_at = datetime.utcnow()
            profile.updated_at = datetime.utcnow()
```

---

## ④ Bedrock（Claude）連携の実装パターン

### bedrock_service.py

```python
import json
import logging
from typing import Any
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

from app.config import settings

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        self._client = boto3.client(
            "bedrock-runtime",
            region_name=settings.AWS_REGION,
            config=Config(
                retries={"max_attempts": 3, "mode": "adaptive"},
                read_timeout=60,
                connect_timeout=5,
            ),
        )
        self.model_id = settings.BEDROCK_MODEL_ID
        self.max_tokens = settings.BEDROCK_MAX_TOKENS

    async def invoke(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int | None = None,
        temperature: float = 0.7,
    ) -> str:
        """Claude を同期呼び出し（run_in_executor で非同期化）"""
        import asyncio
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._invoke_sync,
            system_prompt,
            user_message,
            max_tokens or self.max_tokens,
            temperature,
        )

    def _invoke_sync(
        self,
        system_prompt: str,
        user_message: str,
        max_tokens: int,
        temperature: float,
    ) -> str:
        body = json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_message}
            ],
        })

        try:
            response = self._client.invoke_model(
                modelId=self.model_id,
                contentType="application/json",
                accept="application/json",
                body=body,
            )
            result = json.loads(response["body"].read())
            return result["content"][0]["text"]

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "ThrottlingException":
                logger.warning("Bedrock throttled, request will be retried")
                raise
            elif error_code == "ModelTimeoutException":
                logger.error("Bedrock model timeout")
                raise
            else:
                logger.error(f"Bedrock error: {error_code}")
                raise

    async def invoke_with_json_output(
        self,
        system_prompt: str,
        user_message: str,
        temperature: float = 0.3,
    ) -> dict[str, Any]:
        """JSON出力を期待する呼び出し。パース失敗時はリトライ"""
        raw = await self.invoke(
            system_prompt=system_prompt + "\n\nYou MUST respond with valid JSON only. No markdown, no explanation.",
            user_message=user_message,
            temperature=temperature,
        )

        # ```json ... ``` のラッパーを除去
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1])

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            logger.error(f"Failed to parse Bedrock JSON response: {raw[:200]}")
            raise ValueError("AI応答のパースに失敗しました")
```

### ai_review_service.py

```python
from app.services.bedrock_service import BedrockService


class AIReviewService:
    def __init__(self, bedrock: BedrockService):
        self.bedrock = bedrock

    async def review_code(
        self,
        code: str,
        problem_description: str,
        language: str = "python",
        user_level: str = "beginner",
    ) -> str:
        system_prompt = f"""あなたはプログラミング教育の専門家です。
学習者のレベル: {user_level}

以下の観点でコードレビューしてください:
1. 正確性: コードが問題の要件を満たしているか
2. 効率性: 時間・空間計算量は適切か
3. 可読性: 変数名、構造、コメントは適切か
4. ベストプラクティス: {language}の慣習に沿っているか
5. 改善点: 具体的な改善案（コード例付き）

学習者のレベルに合わせた説明をしてください。
- beginner: 基本的な概念から丁寧に
- intermediate: ポイントを絞って
- advanced: 高度な最適化やデザインパターンにも言及"""

        user_message = f"""## 問題
{problem_description}

## 提出コード ({language})
```{language}
{code}
```"""

        return await self.bedrock.invoke(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.3,
        )

    async def analyze_weakness(
        self,
        attempt_history: list[dict],
    ) -> dict:
        """解答履歴から苦手分野を分析"""
        system_prompt = """あなたはプログラミング学習の分析専門家です。
学習者の解答履歴を分析し、苦手分野を特定してください。

以下のJSON形式で回答してください:
{
    "weak_areas": [
        {
            "tag": "タグ名",
            "severity": "high/medium/low",
            "reason": "分析理由",
            "suggestion": "学習アドバイス"
        }
    ],
    "overall_assessment": "総合評価",
    "recommended_focus": ["優先的に取り組むべきタグ"]
}"""

        user_message = f"解答履歴:\n{attempt_history}"

        return await self.bedrock.invoke_with_json_output(
            system_prompt=system_prompt,
            user_message=user_message,
        )
```

---

## ⑤ 問題生成プロンプト設計

### problem_generation_service.py

```python
import json
import uuid
from datetime import datetime

from app.services.bedrock_service import BedrockService
from app.repositories.problem_repository import ProblemRepository


QUIZ_SYSTEM_PROMPT = """あなたはプログラミング教育の問題作成の専門家です。
指定された条件に基づいて、プログラミングのクイズ問題を1問作成してください。

以下の制約を守ってください:
- 問題文は明確で曖昧さがないこと
- 選択肢は4つ、紛らわしい誤答を含めること
- 解説は「なぜその答えが正しいか」と「なぜ他が間違いか」の両方を含めること
- 実務で役立つ知識を問うこと

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

以下の制約を守ってください:
- 問題文は入出力の形式を明確に記述すること
- スターターコードは関数シグネチャのみ提供すること
- テストケースは最低3つ（通常ケース、エッジケース、大きい入力）
- ヒントは段階的に3つ提供すること（ネタバレなし）

以下のJSON形式で出力してください:
{
    "description": "問題文（マークダウン可）",
    "starter_code": "def solution(...):\\n    pass",
    "test_cases": [
        {"input": "...", "expected_output": "...", "description": "テスト説明"}
    ],
    "language": "python",
    "hints": ["ヒント1", "ヒント2", "ヒント3"],
    "solution": "模範解答コード",
    "tags": ["関連タグ"]
}"""

SIMILAR_PROBLEM_PROMPT = """以下の問題と「同じ概念を問うが、異なるシナリオ」の問題を作成してください。
- 難易度は同程度に
- 同じ解法パターンを使うが、題材は変える
- 元の問題を見ていても有利にならない程度に変える"""


class ProblemGenerationService:
    # タグ→具体的トピックのマッピング
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
        "easy": "初学者向け。基本的な構文や概念を問う。実行結果の予測やシンプルな実装。",
        "medium": "中級者向け。複数の概念を組み合わせる。エッジケースの考慮が必要。",
        "hard": "上級者向け。最適化、設計判断、複雑なアルゴリズムを要する。",
    }

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
        """問題生成タスクをDBに登録し、task_idを返す"""
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

        # 実際の生成処理（本番ではSQS経由のワーカーで処理）
        # 開発時は直接実行
        await self._generate_and_save(task_id, user_id, problem_type, difficulty, tags, source_lesson_id)

        return task_id

    async def _generate_and_save(
        self,
        task_id: str,
        user_id: str,
        problem_type: str,
        difficulty: str,
        tags: list[str],
        source_lesson_id: str | None,
    ):
        try:
            await self.problem_repo.update_task_status(task_id, "processing")

            # プロンプト構築
            if problem_type == "quiz":
                system_prompt = QUIZ_SYSTEM_PROMPT
            else:
                system_prompt = CODING_SYSTEM_PROMPT

            # ユーザーメッセージ構築
            tag_descriptions = [
                self.TAG_TOPICS.get(t, t) for t in tags
            ]
            user_message = f"""## 条件
- 難易度: {difficulty} — {self.DIFFICULTY_GUIDANCE[difficulty]}
- トピック: {', '.join(tag_descriptions)}
- 問題タイプ: {problem_type}
"""

            # 類題の場合、元問題の情報を追加
            if source_lesson_id:
                source = await self.problem_repo.get_lesson(source_lesson_id)
                if source:
                    user_message += f"\n{SIMILAR_PROBLEM_PROMPT}\n\n元の問題:\n{json.dumps(source.content, ensure_ascii=False)}"

            # AI生成
            content = await self.bedrock.invoke_with_json_output(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=0.8,  # 多様性のためやや高め
            )

            # DB保存
            problem_id = await self.problem_repo.save_generated_problem(
                user_id=user_id,
                problem_type=problem_type,
                difficulty=difficulty,
                tags=content.get("tags", tags),
                content=content,
                source_lesson_id=source_lesson_id,
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
            raise
```

### 苦手分野特化の出題プロンプト

```python
WEAKNESS_TARGETING_PROMPT = """以下のユーザーの苦手分野データに基づき、
その弱点を克服するための問題を作成してください。

苦手分野:
{weakness_data}

重要:
- 苦手分野を直接問うのではなく、少し角度を変えて出題してください
- 正答率が低い分野は基礎的な問題から始めてください
- 正答率が中程度の分野はやや応用的な問題にしてください
- ユーザーの「理解しているつもりだが実は理解していない」点を炙り出す問題が理想です"""
```

---

## ⑥ レコメンドロジックの最適化案

### recommendation_service.py

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

from app.repositories.attempt_repository import AttemptRepository
from app.repositories.recommendation_repository import RecommendationRepository
from app.services.bedrock_service import BedrockService


class RecommendationType(str, Enum):
    RETRY = "retry"
    SIMILAR = "similar"
    WEAKNESS = "weakness"
    FORGETTING = "forgetting"


@dataclass
class ScoringWeights:
    """スコアリングの重み（チューニング可能にするため分離）"""
    incorrect: float = 50.0
    low_score: float = 30.0
    days_elapsed: float = 3.0       # 日数あたりのポイント（上限20）
    weakness_tag: float = 20.0
    ai_recommended: float = 15.0
    recently_solved: float = -30.0
    mastered: float = -40.0
    consecutive_correct: float = -10.0  # 連続正解ごとの減点
    time_struggled: float = 10.0        # 解答時間が長かった場合


@dataclass
class ScoredRecommendation:
    problem_source: str
    lesson_id: str | None
    generated_problem_id: str | None
    recommendation_type: RecommendationType
    priority_score: float
    score_breakdown: dict
    reason: str | None = None


class RecommendationService:
    def __init__(
        self,
        attempt_repo: AttemptRepository,
        recommendation_repo: RecommendationRepository,
        bedrock: BedrockService,
    ):
        self.attempt_repo = attempt_repo
        self.recommendation_repo = recommendation_repo
        self.bedrock = bedrock
        self.weights = ScoringWeights()

    async def calculate_recommendations(self, user_id: str) -> list[ScoredRecommendation]:
        """全レコメンド候補を計算してスコアリング"""
        candidates: list[ScoredRecommendation] = []

        # 並行取得
        import asyncio
        incorrect, weakness_profile, stale = await asyncio.gather(
            self.attempt_repo.get_incorrect_attempts(user_id, since=datetime.utcnow() - timedelta(days=30)),
            self.attempt_repo.get_weakness_profile(user_id),
            self.attempt_repo.get_stale_attempts(user_id, days_threshold=7),
        )

        weak_tags = {w.tag: w.accuracy_rate for w in weakness_profile}

        # === 1. retry候補: 不正解だった問題 ===
        seen_problems = set()
        for attempt in incorrect:
            key = attempt.lesson_id or attempt.generated_problem_id
            if key in seen_problems:
                continue
            seen_problems.add(key)

            breakdown = {}
            score = 0.0

            # 不正解ボーナス
            breakdown["incorrect"] = self.weights.incorrect
            score += self.weights.incorrect

            # 低スコアボーナス
            if attempt.score < 60:
                breakdown["low_score"] = self.weights.low_score
                score += self.weights.low_score

            # 経過日数ボーナス（上限20）
            days = (datetime.utcnow() - attempt.attempted_at).days
            days_bonus = min(days * self.weights.days_elapsed, 20.0)
            breakdown["days_elapsed"] = days_bonus
            score += days_bonus

            # 苦手タグボーナス
            if attempt.lesson_id:
                # タグを取得して苦手判定
                # (実装では lesson の tags を JOIN して取得)
                pass

            # 最近解いたペナルティ
            if days < 1:
                breakdown["recently_solved"] = self.weights.recently_solved
                score += self.weights.recently_solved

            candidates.append(ScoredRecommendation(
                problem_source=attempt.problem_source,
                lesson_id=attempt.lesson_id,
                generated_problem_id=attempt.generated_problem_id,
                recommendation_type=RecommendationType.RETRY,
                priority_score=score,
                score_breakdown=breakdown,
            ))

        # === 2. forgetting候補: 正解したが時間が経った問題 ===
        for attempt in stale:
            key = attempt.lesson_id or attempt.generated_problem_id
            if key in seen_problems:
                continue
            seen_problems.add(key)

            days = (datetime.utcnow() - attempt.attempted_at).days
            breakdown = {}
            score = 0.0

            # エビングハウス忘却曲線に基づくスコアリング
            # 7日で忘却率約77%、14日で約90%
            if days >= 14:
                forgetting_score = 40.0
            elif days >= 7:
                forgetting_score = 25.0
            else:
                forgetting_score = 10.0

            breakdown["forgetting_curve"] = forgetting_score
            score += forgetting_score

            # 定着判定: 同じ問題を3回以上連続正解なら定着済み
            # (実装では attempt_count を確認)

            candidates.append(ScoredRecommendation(
                problem_source=attempt.problem_source,
                lesson_id=attempt.lesson_id,
                generated_problem_id=attempt.generated_problem_id,
                recommendation_type=RecommendationType.FORGETTING,
                priority_score=score,
                score_breakdown=breakdown,
            ))

        # === 3. weakness候補: 苦手タグの問題（AI生成を推奨）===
        for profile in weakness_profile:
            if profile.accuracy_rate >= 80.0:
                continue  # 80%以上は苦手ではない

            breakdown = {}
            score = 0.0

            # 正答率が低いほど高スコア
            weakness_score = (100.0 - profile.accuracy_rate) * 0.5
            breakdown["weakness_severity"] = weakness_score
            score += weakness_score

            breakdown["weakness_tag"] = self.weights.weakness_tag
            score += self.weights.weakness_tag

            candidates.append(ScoredRecommendation(
                problem_source="generated",
                lesson_id=None,
                generated_problem_id=None,  # 生成が必要
                recommendation_type=RecommendationType.WEAKNESS,
                priority_score=score,
                score_breakdown=breakdown,
                reason=f"「{profile.tag}」の正答率が{profile.accuracy_rate:.0f}%です",
            ))

        # スコア降順ソート
        candidates.sort(key=lambda c: c.priority_score, reverse=True)
        return candidates

    async def get_recommendations(
        self,
        user_id: str,
        limit: int = 10,
        rec_type: str | None = None,
    ):
        """キャッシュ済みレコメンドを返す。なければ再計算"""
        cached = await self.recommendation_repo.get_active_recommendations(
            user_id, limit, rec_type
        )

        if cached:
            return cached

        # 再計算
        candidates = await self.calculate_recommendations(user_id)

        # 上位をDBに保存（TTL付き）
        for candidate in candidates[:20]:
            await self.recommendation_repo.save_recommendation(
                user_id=user_id,
                recommendation=candidate,
                expires_at=datetime.utcnow() + timedelta(hours=6),
            )

        if rec_type:
            candidates = [c for c in candidates if c.recommendation_type.value == rec_type]

        return candidates[:limit]
```

### レコメンド最適化のポイント

| 改善点 | 内容 |
|--------|------|
| **忘却曲線統合** | エビングハウスの忘却曲線に基づき、7日/14日/21日で段階的にスコア増加 |
| **定着判定** | 同一問題を3回連続正解→定着済みとしてスコア大幅減 |
| **解答時間考慮** | 正解でも時間がかかった問題は理解が浅い→スコア加算 |
| **重み外部化** | ScoringWeightsをDBやconfig管理にすればA/Bテスト可能 |
| **キャッシュ+TTL** | 計算結果を6時間キャッシュ。毎回再計算しない |
| **バッチ更新** | 深夜バッチで全ユーザーのレコメンドを事前計算 |

---

## ⑦ パフォーマンス改善案

### 1. Redisキャッシュ戦略

```python
# core/cache.py
import json
from datetime import timedelta
import redis.asyncio as redis
from app.config import settings

_pool: redis.Redis | None = None


async def get_redis() -> redis.Redis:
    global _pool
    if _pool is None:
        _pool = redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _pool


class CacheKey:
    """キャッシュキーのプレフィックス管理"""
    RECOMMENDATIONS = "rec:{user_id}"
    WEAKNESS_PROFILE = "weakness:{user_id}"
    COURSE_PROGRESS = "progress:{user_id}:{course_id}"
    GENERATED_PROBLEM = "genproblem:{problem_id}"


async def cache_get(key: str) -> dict | None:
    r = await get_redis()
    data = await r.get(key)
    return json.loads(data) if data else None


async def cache_set(key: str, value: dict, ttl: timedelta = timedelta(hours=1)):
    r = await get_redis()
    await r.setex(key, int(ttl.total_seconds()), json.dumps(value, default=str))


async def cache_delete(key: str):
    r = await get_redis()
    await r.delete(key)
```

### 2. N+1クエリ防止

```python
# NG: N+1
for attempt in attempts:
    lesson = await db.get(Lesson, attempt.lesson_id)  # N回クエリ

# OK: JOINで一発
stmt = (
    select(ProblemAttempt, Lesson)
    .outerjoin(Lesson, ProblemAttempt.lesson_id == Lesson.id)
    .where(ProblemAttempt.user_id == user_id)
    .options(selectinload(ProblemAttempt.lesson))
)
```

### 3. ページネーション

```python
# Cursor-based pagination（大量データ向け）
@router.get("/history")
async def get_history(
    cursor: str | None = Query(None),  # 最後の attempted_at の ISO文字列
    limit: int = Query(20, le=100),
    current_user: User = Depends(get_current_user),
    service: HistoryService = Depends(get_history_service),
):
    items, next_cursor = await service.get_paginated_history(
        user_id=current_user.id,
        cursor=cursor,
        limit=limit,
    )
    return {"items": items, "next_cursor": next_cursor}
```

### 4. Bedrock呼び出しの最適化

```python
# 1. タイムアウト制御
# 2. サーキットブレーカー
# 3. フォールバック

from tenacity import retry, stop_after_attempt, wait_exponential


class BedrockServiceWithResilience(BedrockService):
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
    )
    async def invoke_with_retry(self, system_prompt: str, user_message: str) -> str:
        return await self.invoke(system_prompt, user_message)

    async def invoke_with_fallback(
        self,
        system_prompt: str,
        user_message: str,
        fallback_response: str = "AI応答を取得できませんでした。しばらくしてからお試しください。",
    ) -> str:
        try:
            return await self.invoke_with_retry(system_prompt, user_message)
        except Exception:
            return fallback_response
```

### 5. コネクションプール設定

```python
# SQLAlchemy
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # 通常時の接続数
    max_overflow=10,       # バースト時の追加接続
    pool_pre_ping=True,    # 接続の生存確認
    pool_recycle=3600,     # 1時間で接続をリサイクル
)
```

---

## ⑧ セキュリティ設計

### 1. 認証（JWT + Refresh Token）

```python
# core/security.py
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "access"},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=30)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expired or invalid")
```

### 2. レート制限

```python
# core/rate_limit.py
from fastapi import HTTPException
from app.core.cache import get_redis
from app.config import settings


async def rate_limit_ai(user_id: str):
    """AI系APIのレート制限"""
    r = await get_redis()

    # 分単位チェック
    minute_key = f"ratelimit:ai:{user_id}:minute"
    minute_count = await r.incr(minute_key)
    if minute_count == 1:
        await r.expire(minute_key, 60)
    if minute_count > settings.AI_RATE_LIMIT_PER_MINUTE:
        raise HTTPException(
            status_code=429,
            detail=f"AI機能のリクエスト上限に達しました（{settings.AI_RATE_LIMIT_PER_MINUTE}回/分）",
        )

    # 時間単位チェック
    hour_key = f"ratelimit:ai:{user_id}:hour"
    hour_count = await r.incr(hour_key)
    if hour_count == 1:
        await r.expire(hour_key, 3600)
    if hour_count > settings.AI_RATE_LIMIT_PER_HOUR:
        raise HTTPException(
            status_code=429,
            detail=f"AI機能のリクエスト上限に達しました（{settings.AI_RATE_LIMIT_PER_HOUR}回/時間）",
        )
```

### 3. コード実行のサンドボックス化

ユーザーが提出したコードを実行する場合、**絶対に直接実行しない**。

```python
# services/code_executor.py
import subprocess
import tempfile
import os


class CodeExecutor:
    """ユーザーコードの安全な実行"""

    TIMEOUT_SECONDS = 10
    MAX_MEMORY_MB = 256
    MAX_OUTPUT_SIZE = 10000  # 文字

    async def execute_python(self, code: str, test_input: str = "") -> dict:
        """Dockerコンテナ内でコードを実行"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(code)
            code_path = f.name

        try:
            result = subprocess.run(
                [
                    "docker", "run",
                    "--rm",
                    "--network=none",              # ネットワーク無効
                    f"--memory={self.MAX_MEMORY_MB}m",
                    "--cpus=0.5",
                    "--pids-limit=50",
                    "-v", f"{code_path}:/code/solution.py:ro",
                    "python:3.12-slim",
                    "python", "/code/solution.py",
                ],
                input=test_input,
                capture_output=True,
                text=True,
                timeout=self.TIMEOUT_SECONDS,
            )

            return {
                "stdout": result.stdout[:self.MAX_OUTPUT_SIZE],
                "stderr": result.stderr[:self.MAX_OUTPUT_SIZE],
                "returncode": result.returncode,
                "timeout": False,
            }
        except subprocess.TimeoutExpired:
            return {
                "stdout": "",
                "stderr": "実行時間制限を超えました",
                "returncode": -1,
                "timeout": True,
            }
        finally:
            os.unlink(code_path)
```

### 4. その他セキュリティ対策

```python
# core/middleware.py
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        return response
```

| 対策 | 実装 |
|------|------|
| SQLインジェクション | SQLAlchemy ORM使用（パラメータバインド） |
| XSS | React側でデフォルトエスケープ + CSP |
| CSRF | SameSite Cookie + CORS制限 |
| パスワード | bcryptハッシュ + ソルト自動 |
| シークレット管理 | AWS Secrets Manager（コードに秘密情報を書かない） |
| プロンプトインジェクション | ユーザー入力をBedrockに渡す際に分離（system/user分離） |
| コード実行 | Docker sandbox（ネットワーク無効、メモリ制限、タイムアウト） |

---

## ⑨ スケーラビリティ設計

### ECS Fargate オートスケーリング

```yaml
# ecs-service.yaml (CloudFormation抜粋)
AutoScaling:
  MinCapacity: 2
  MaxCapacity: 20
  TargetTrackingPolicies:
    - TargetValue: 70
      PredefinedMetricType: ECSServiceAverageCPUUtilization
    - TargetValue: 70
      PredefinedMetricType: ECSServiceAverageMemoryUtilization

# Bedrock呼び出しワーカーは別サービスとして分離
# API用: CPU最適化 (0.5 vCPU, 1GB)
# Worker用: メモリ最適化 (1 vCPU, 2GB)
```

### アーキテクチャ分離

```
                          ┌──────────────────┐
[CloudFront] → [ALB] ──→ │  API Service     │ ──→ [RDS]
                          │  (FastAPI)       │ ──→ [Redis]
                          └──────────────────┘
                                  │
                             SQS Queue
                                  │
                          ┌──────────────────┐
                          │  Worker Service  │ ──→ [Bedrock]
                          │  (問題生成/レビュー) │ ──→ [RDS]
                          └──────────────────┘
```

**APIサービスとWorkerサービスを分離する理由:**
- Bedrock呼び出しは3〜15秒かかる → APIのレスポンスタイムを悪化させない
- Worker側だけ独立してスケール可能
- Bedrock側のスロットリング時にAPIは影響を受けない

### DBスケーリング

```
Phase 1 (〜1,000ユーザー):
  - RDS db.t3.medium (Single-AZ, 開発/初期段階)

Phase 2 (〜10,000ユーザー):
  - RDS db.r6g.large (Multi-AZ)
  - Read Replica 1台（履歴閲覧用クエリを分散）
  - ElastiCache Redis (cache.t3.medium)

Phase 3 (10,000+ユーザー):
  - RDS db.r6g.xlarge (Multi-AZ)
  - Read Replica 2台
  - problem_attempts テーブルを月次パーティション化

# パーティション例
CREATE TABLE problem_attempts (
    ...
) PARTITION BY RANGE (attempted_at);

CREATE TABLE problem_attempts_2026_q1
    PARTITION OF problem_attempts
    FOR VALUES FROM ('2026-01-01') TO ('2026-04-01');
```

---

## ⑩ リスクと対策

| # | リスク | 影響度 | 対策 |
|---|--------|--------|------|
| 1 | **Bedrockのレスポンス遅延/障害** | 高 | 非同期キュー化 + フォールバック（固定問題を代わりに出す）+ サーキットブレーカー |
| 2 | **AI生成問題の品質不安定** | 高 | JSONスキーマバリデーション + 生成後の自動品質チェック（テストケースが通るか等）+ 問題プール事前生成 |
| 3 | **Bedrockコスト爆発** | 中 | レート制限 + ユーザーごと日次上限 + CloudWatchでコストアラート + 入出力トークン数のログ記録 |
| 4 | **プロンプトインジェクション** | 高 | system/user分離 + ユーザー入力のサニタイズ + 出力のJSONバリデーション |
| 5 | **コード実行のセキュリティ** | 最高 | Dockerサンドボックス必須（ネットワーク遮断、リソース制限、タイムアウト）|
| 6 | **RDS接続枯渇** | 中 | コネクションプール適正化 + RDS Proxy導入検討 |
| 7 | **レコメンド計算の負荷** | 中 | バッチ事前計算 + Redisキャッシュ + TTL管理 |
| 8 | **データ整合性** | 中 | DB制約 + CHECK制約 + トランザクション管理 |
| 9 | **JWT漏洩** | 中 | 短い有効期限(1時間) + Refresh Token + ブラックリスト機能 |
| 10 | **スケール時のDB性能劣化** | 中 | 部分インデックス + パーティション + Read Replica |

### AI生成問題の品質保証フロー

```python
async def validate_generated_problem(content: dict, problem_type: str) -> bool:
    """生成された問題の品質チェック"""
    if problem_type == "quiz":
        # 必須フィールドチェック
        required = {"question", "choices", "correct_index", "explanation"}
        if not required.issubset(content.keys()):
            return False
        # 選択肢数チェック
        if len(content["choices"]) != 4:
            return False
        # correct_index範囲チェック
        if not 0 <= content["correct_index"] <= 3:
            return False
        # 問題文の最低文字数
        if len(content["question"]) < 10:
            return False

    elif problem_type == "coding":
        required = {"description", "starter_code", "test_cases"}
        if not required.issubset(content.keys()):
            return False
        if len(content["test_cases"]) < 2:
            return False

    return True
```

---

## API一覧（最終版）

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| POST | `/api/v1/auth/register` | ユーザー登録 | 不要 |
| POST | `/api/v1/auth/login` | ログイン | 不要 |
| POST | `/api/v1/auth/refresh` | トークンリフレッシュ | Refresh Token |
| GET | `/api/v1/courses` | コース一覧 | 必要 |
| GET | `/api/v1/courses/{id}` | コース詳細+進捗 | 必要 |
| GET | `/api/v1/courses/{id}/lessons` | レッスン一覧 | 必要 |
| GET | `/api/v1/lessons/{id}` | レッスン詳細 | 必要 |
| POST | `/api/v1/lessons/{id}/submit` | 固定問題の回答提出 | 必要 |
| POST | `/api/v1/practice/generate` | AI問題生成（非同期） | 必要 |
| GET | `/api/v1/practice/status/{task_id}` | 生成状況確認 | 必要 |
| POST | `/api/v1/practice/submit` | AI問題の回答提出 | 必要 |
| GET | `/api/v1/history` | 学習履歴一覧 | 必要 |
| GET | `/api/v1/history/{attempt_id}` | 履歴詳細（AIレビュー含む） | 必要 |
| GET | `/api/v1/recommend/review` | レコメンド一覧 | 必要 |
| GET | `/api/v1/recommend/similar/{lesson_id}` | 類題取得/生成 | 必要 |
| POST | `/api/v1/recommend/{id}/dismiss` | レコメンド非表示 | 必要 |
| POST | `/api/v1/ai/review` | コードレビュー依頼 | 必要 |
| GET | `/api/v1/ai/review/{task_id}` | レビュー結果取得 | 必要 |
| GET | `/api/v1/profile/weakness` | 苦手分野プロファイル | 必要 |
| GET | `/api/v1/profile/streak` | 学習ストリーク | 必要 |

---

## 開発優先順位

```
Phase 1 (MVP — 4-6週):
  ├── ユーザー認証（JWT）
  ├── コース/レッスンCRUD
  ├── 固定問題の回答・採点
  ├── 基本的な学習履歴
  └── DB設計 + Alembicマイグレーション

Phase 2 (AI機能 — 3-4週):
  ├── Bedrock連携基盤
  ├── AI問題生成（同期→非同期移行）
  ├── コードレビュー
  └── コード実行サンドボックス

Phase 3 (レコメンド — 2-3週):
  ├── 苦手分野プロファイル
  ├── レコメンドスコアリング
  ├── 忘却曲線ロジック
  └── 類題生成

Phase 4 (運用品質 — 2-3週):
  ├── Redis キャッシュ
  ├── レート制限
  ├── CloudWatch ログ/メトリクス
  ├── CI/CD パイプライン
  └── 負荷テスト
```
