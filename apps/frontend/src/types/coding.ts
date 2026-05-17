/** ========================================================================
 *  Coding feature types (Repository → Issue → Editor)
 *
 *  将来 API 連携時に既存のフロント型をそのまま使えるよう、フィールド名を
 *  バックエンドに渡しやすい snake/camel 中立 (camel) に統一する。
 *  詳細設計: docs/ai-question-platform.md
 *  ===================================================================== */

export type Language =
  | "javascript"
  | "typescript"
  | "python"
  | "sql"
  | "html"
  | "css"
  | "go"
  | "java";

export type Framework =
  // JS/TS
  | "react"
  | "next"
  | "vue"
  | "nuxt"
  | "node"
  | "express"
  | "nestjs"
  // Python
  | "fastapi"
  | "django"
  | "flask"
  // SQL
  | "postgres"
  | "mysql"
  | "sqlite"
  // CSS family
  | "tailwind"
  | "css-modules"
  | "sass"
  // Go
  | "gin"
  | "echo"
  // Java
  | "spring-boot";

export type MonacoLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "sql"
  | "html"
  | "css"
  | "go"
  | "java";

export type CodingDifficulty = "easy" | "normal" | "hard";
export type CodingDifficultyLabel = "初級" | "中級" | "上級";
export type CodingQuestionType =
  | "fill-blank"
  | "implementation"
  | "refactor"
  | "bugfix";
export type IssueStatus = "open" | "in-progress" | "solved";

export type HintLevel = 1 | 2 | 3 | 4 | 5;
export type HintCloseness =
  | "concept"
  | "focus"
  | "implementation"
  | "near-answer"
  | "almost-answer";

export type StepHint = {
  level: HintLevel;
  title: string;
  content: string;
  closeness: HintCloseness;
};

export type SolutionExample = {
  id: string;
  title: string;
  code: string;
  explanation: string;
  points: string[];
  isRecommended?: boolean;
};

export type CodeDiffLine = {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNumber?: number;
};

export type CodingTestCase = {
  name: string;
  input: string;
  expected: string;
  /** ダミー段階: 実行はせず事前に合否を固定 */
  passed?: boolean;
  /** ダミー段階: 実際の出力 (passedに対応) */
  actual?: string;
};

export type AiReviewResult = {
  isCorrect: boolean;
  score: number;
  summary: string;
  goodPoints: string[];
  improvementPoints: string[];
  securityNotes: string[];
  readabilityNotes: string[];
  performanceNotes: string[];
  recommendedSolutionId: string;
  solutionExamples: SolutionExample[];
  diff: CodeDiffLine[];
  usedHintCount: number;
  usedHints: HintLevel[];
  nextLearningTopics: string[];
};

export type CodingQuestion = {
  id: string;
  repositoryId: string;
  issueNumber: number;
  title: string;
  description: string;
  language: Language;
  framework?: Framework;
  difficulty: CodingDifficulty;
  type: CodingQuestionType;
  initialCode: string;
  expectedOutput?: string;
  estimatedMinutes: number;
  status: IssueStatus;
  testCases: CodingTestCase[];
  hints: StepHint[];
  solutionExamples: SolutionExample[];
  /** ダミー段階用: 推奨解とユーザーコードの差分は view 時に diffLines() で都度計算するため空でよい */
  diff: CodeDiffLine[];
  explanation: string;
  tags: string[];
};

export type RepositoryStatus = "active" | "wip";

export type CodingRepository = {
  id: string;
  name: string; // 例: "TypeScript / React"
  description: string;
  language: Language;
  framework?: Framework;
  tags: string[];
  difficultyRange: string; // "初級〜中級"
  lastUpdated: string; // "2 days ago"
  status: RepositoryStatus;
};

/** S3 に保存する想定の attempt スナップショット (現段階では未保存) */
export type CodingAnswerSnapshot = {
  version: "1.0";
  userId: string;
  attemptId: string;
  questionId: string;
  language: Language;
  framework?: Framework;
  difficulty: CodingDifficulty;
  questionType: CodingQuestionType;
  question: { title: string; description: string };
  userCode: string;
  usedHintCount: number;
  usedHints: HintLevel[];
  executionResult: {
    passed: boolean;
    score: number;
    testResults: CodingTestCase[];
  };
  aiReview: AiReviewResult;
  solutionExamples: SolutionExample[];
  diff: CodeDiffLine[];
  metadata: {
    generatedBy: "dummy" | "ai";
    reviewedBy: "ai_future" | "ai";
    answeredAt: string;
  };
};
