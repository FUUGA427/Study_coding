# Programming Learning Platform

AIで個別最適化するプログラミング学習プラットフォーム。モノレポ構成。

## 構成

```
.
├── apps/
│   ├── backend/      FastAPI + SQLAlchemy + Alembic + Bedrock
│   └── frontend/     Vite + React + TypeScript + Tailwind + TanStack Query
├── packages/
│   └── shared-types/ バックエンド schemas と揃えた TS 型定義
├── docs/
└── docker-compose.yml
```

## セットアップ

```bash
# フロントエンド依存
npm install

# バックエンド依存
cd apps/backend && pip install -e .

# 起動（すべて）
docker compose up

# 個別起動
npm run dev              # フロントエンド (http://localhost:3000)
npm run backend:dev      # バックエンド  (http://localhost:8000)
```

## DB セットアップ (初回・開発用)

```bash
# Postgres を起動
docker compose up -d db

# 初期マイグレーション適用
docker compose run --rm backend alembic upgrade head

# サンプルコース・レッスン投入
docker compose run --rm backend python -m scripts.seed
```

## 開発時の自動ゲストログイン

`apps/frontend/.env.development` の `VITE_DEV_AUTO_GUEST=true` が有効な間は、
ログイン画面を経由せず `/auth/guest` を自動で叩いて新しいゲストユーザでサービスに入ります。
ログイン機能を実際に確認したくなったら `false` にしてください。

## 環境変数

- `apps/frontend/.env` — `VITE_API_BASE_URL`
- `apps/backend/.env`  — `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET_KEY`, AWS 関連
