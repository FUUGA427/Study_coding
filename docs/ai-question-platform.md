# AI 問題生成 & 学習履歴プラットフォーム 設計案

> ステータス: ドラフト (未着工)
> 最終更新: 2026-05-17
> 関連: [architecture_design.md](./architecture_design.md), `apps/backend/app/services/`, `apps/frontend/src/data/catalog.ts`

## 1. ビジョン

コース内の問題を AI で動的生成し、ユーザー回答・正誤・解説・履歴を保存して、後から復習・再履修・苦手分析できる学習プラットフォーム。

## 2. 全体フロー

1. ユーザーがコースを選択
2. コース・レッスン・難易度に応じて AI が問題を生成 (またはキャッシュから取り出す)
3. 1 問ずつ画面表示
4. ユーザーが回答
5. 採点 (選択式/穴埋めはコード判定、記述式は自己採点 or LLM)
6. 正誤・解説・回答内容を保存
7. 履歴は S3 に詳細 JSON、DB に検索用インデックス
8. 履歴・復習・苦手分析画面から再アクセス
9. 苦手タグや誤答ベースで再出題

## 3. アーキテクチャ

### Frontend (React / TS / Tailwind)
- コース一覧 / レッスン詳細 / 問題回答 / 結果 / 復習 / 履歴 各画面
- 状態: TanStack Query + Zustand
- 既存実装 (`CoursesPage`, `CatalogCoursePage`, `QuestionItem`) を流用拡張

### Backend (FastAPI)
- AI問題生成 API (`POST /catalog/courses/{course_id}/generate`)
- 回答提出・採点 API (`POST /attempts`)
- 回答履歴取得 API (`GET /attempts`, `GET /attempts/{id}`)
- 復習対象取得 API (`GET /review/upcoming`)
- 苦手分析 API (`GET /me/weakness`)
- S3 IO 層 / DB IO 層を service / repository に分離

### AI (Bedrock Claude)
- 既存 `BEDROCK_MODEL_ID=anthropic.claude-sonnet-4-...` を利用
- 問題生成: 入力 = コース概要+難易度+既出題ID除外、出力 = 構造化 JSON (`Question` 型互換)
- 採点補助: 記述式の意味的妥当性判定 (将来)
- 苦手分析: 誤答パターンからのタグ抽出 (将来)

### Storage
- **S3**: 重い詳細 JSON
- **PostgreSQL**: 検索/集計可能なインデックスとサマリー
- **Redis (任意)**: 直近生成問題のキャッシュ、レート制御

## 4. 設計原則: S3 と DB の責務分割

| 種類 | S3 | DB |
|---|---|---|
| 問題本文・選択肢・正解・解説 | ✓ | ─ (DB は object_key のみ) |
| ユーザー回答テキスト・コード | ✓ | ─ |
| AI生成プロンプト全文・LLMレスポンス全文 | ✓ | ─ |
| ユーザーID/コースID/難易度/正誤/スコア | ─ | ✓ |
| 回答時刻・所要時間 | ─ | ✓ |
| 復習ステータス・次回復習日 | ─ | ✓ |
| 苦手タグ集計 | ─ | ✓ |

「DBには集計・絞り込みできる構造化属性、S3には大きく重い元データ」が原則。S3はファイルサーバとして使い、DBは検索インデックスと考える。

## 5. DB スキーマ案

```sql
-- AI生成または事前定義の問題 (S3に本体)
generated_questions (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  question_type TEXT NOT NULL,  -- single_choice / multiple_choice / written / code_fill
  difficulty TEXT NOT NULL,     -- easy / medium / hard
  tags TEXT[] NOT NULL DEFAULT '{}',
  s3_object_key TEXT NOT NULL,  -- 本体 JSON の S3 key
  source TEXT NOT NULL,         -- ai_generated / curated
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)

-- 回答セッション (1コース1セッションの単位)
attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  total_questions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  score_pct NUMERIC(5,2),
  s3_snapshot_key TEXT  -- セッション全体スナップショット
)

-- 1問1行 (一覧・絞り込みに必須)
attempt_questions (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES generated_questions(id),
  user_id UUID NOT NULL,        -- denormalized for fast filter
  is_correct BOOLEAN NOT NULL,
  score INT NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  time_spent_seconds INT,
  s3_answer_key TEXT NOT NULL,  -- 回答+採点詳細 JSON
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_status TEXT NOT NULL DEFAULT 'pending',  -- pending/ok/needs_review
  next_review_at TIMESTAMPTZ                       -- SM-2など間隔反復
)

-- 苦手タグ集計 (定期バッチ or 回答時インクリメント)
user_weak_tags (
  user_id UUID NOT NULL,
  tag TEXT NOT NULL,
  total_attempts INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  accuracy_rate NUMERIC(4,3),
  last_seen_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, tag)
)
```

インデックス必須:
- `attempt_questions(user_id, answered_at DESC)` — 履歴一覧
- `attempt_questions(user_id, is_correct, answered_at DESC)` — 誤答だけ
- `attempt_questions(user_id, next_review_at)` — 復習対象
- `attempt_questions USING GIN(tags)` — タグ検索

## 6. S3 キー設計案

```
s3://learning-platform/
  questions/{course_slug}/{question_id}.json       # AI生成問題本体 (再利用可)
  attempts/{user_id}/{yyyy}/{mm}/{attempt_id}.json # セッションスナップショット
  answers/{user_id}/{yyyy}/{mm}/{attempt_question_id}.json # 個別回答+採点
  ai-prompts/{yyyy}/{mm}/{date}/{request_id}.json  # 監査用 LLM raw IO
```

- ユーザー単位削除 (GDPR等) は `users/{user_id}/` プレフィックスを scan で削除
- ライフサイクル: `ai-prompts/` は 90日 → Glacier、`answers/` は永続

## 7. AI 生成のコスト/レート制御

| 戦略 | 内容 |
|---|---|
| **lookaside キャッシュ** | 同一 (course_id, lesson_id, difficulty) で 1日 N 問プールしておき、ユーザーには既存から重複なく配る |
| **ユーザー単位レート制限** | 既存の `AI_RATE_LIMIT_PER_MINUTE=10` を流用 |
| **既存問題優先** | DB の `generated_questions` から未出題の問題を先に出し、足りないときだけ生成 |
| **バッチ事前生成** | 人気コースは深夜バッチで先回り生成しておく |
| **モデル使い分け** | 問題本体生成 = Sonnet、軽い分類/タグ抽出 = Haiku |

## 8. 採点ポリシー (タイプ別)

| タイプ | 採点 |
|---|---|
| `single_choice` | コード比較 (確定) |
| `multiple_choice` | 集合一致 (確定) |
| `code_fill` | trim/normalize 後の文字列比較 (確定的だが緩い正規化が要検討) |
| `written` | フェーズ1: 解答例提示+自己採点 / フェーズ2: LLM 採点 (rubric指定) |

**Why自己採点先行:** LLM 採点は確率的でデバッグ困難、コスト増、ユーザーが「採点が間違ってる」とクレームを言える状態を避けたい。記述式の本気採点は後回し。

## 9. 復習スケジューリング

SM-2 アルゴリズム (Anki) の簡易版から開始:
- 正解: `next_review_at = now() + interval`、interval は連続正解数で延長
- 不正解: `next_review_at = now() + 1day`、interval リセット
- DB の `attempt_questions(user_id, next_review_at)` で日次に「今日復習する問題」を取得

将来: 苦手タグウェイトを加味した優先度スコア。

## 10. 段階リリース計画

| Phase | 内容 | 完了条件 |
|---|---|---|
| **P0 (現状)** | 静的ダミー問題で UI 完成 | 1問ずつ進む UX 動作中 ✓ |
| **P1** | DB スキーマ追加 + 回答ハードコード送信→DB 保存 | 履歴一覧画面で回答が見える |
| **P2** | S3 保存層追加 (詳細 JSON を S3、サマリーを DB) | S3 オブジェクトとDB行が対で生成される |
| **P3** | AI 問題生成 API (1問単位) | コース→AI生成→画面表示→回答保存 が動く |
| **P4** | キャッシュ層 / 既存問題プール | 同一(course, difficulty)で生成API呼び出しが減る |
| **P5** | 復習スケジューリング | 「今日復習する問題」画面が動く |
| **P6** | 苦手タグ集計 + ダッシュボード | 既存 weakness API と統合 |
| **P7** | LLM による記述式採点 (任意) | 採点済セッションがフィードバック付き |

## 11. 未決事項 / 要相談

- **問題プール vs 完全動的**: 同じ問題を別ユーザーに再利用するか? (再利用ありがコスト的に楽。ただし「毎回違う問題が出る楽しさ」は失われる)
- **記述式の正誤判定**: LLM 採点を導入する場合のコストと精度の見積もり
- **多言語対応**: AI プロンプトを日本語で固定するか、設定可能にするか
- **問題の品質保証**: AI生成問題に重大な誤りがあった時のフラグ機構 (ユーザー報告ボタン+管理者画面)
- **匿名/ゲストユーザーの履歴**: 現状ゲストログイン可能。履歴をどう永続化するか (ローカル or 軽量サーバ保存)
- **本番デプロイ**: [AWS 無料枠運用案](../../.claude/projects/.../memory/aws_free_tier_deploy.md) との整合 (Bedrock は無料枠外)

## 12. 既存実装との接続点

- 既存 `apps/backend/app/services/course_service.py` のレッスン submit に近い設計を `attempt_question` 単位で再構成
- 既存 `apps/backend/app/api/v1/ai_review.py` の AI 呼び出しパターンを問題生成にも転用
- 既存 `recommendations.py` / `weakness` 系を新スキーマに移行 (`attempt_questions` のJOIN集計に切り替え)
- フロントは `CatalogCoursePage` の questions 配列ソースを「ダミー静的」→「API取得」に差し替えるだけで段階移行可能
