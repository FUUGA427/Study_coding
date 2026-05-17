import { useEffect, useMemo, useState } from "react";
import MonacoEditor from "@monaco-editor/react";
import clsx from "clsx";
import {
  DIFFICULTY_LABEL,
  FRAMEWORK_LABEL,
  ISSUE_STATUS_LABEL,
  LANGUAGE_ICON,
  LANGUAGE_LABEL,
  LANGUAGE_MONACO,
  QUESTION_TYPE_LABEL,
} from "@/data/codingCatalog";
import type {
  AiReviewResult,
  CodingDifficulty,
  CodingQuestion,
  HintLevel,
  IssueStatus,
} from "@/types/coding";
import { diffLines } from "@/lib/diffLines";
import {
  BottomPanel,
  type BottomTabId,
  type ExecutionResult,
} from "./BottomPanel";

type Props = {
  question: CodingQuestion;
  onBack: () => void;
};

const STATUS_PILL_CLASS: Record<IssueStatus, string> = {
  open: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  "in-progress": "border-amber-400/40 bg-amber-400/10 text-amber-300",
  solved: "border-violet-400/40 bg-violet-400/10 text-violet-300",
};

const DIFFICULTY_PILL_CLASS: Record<CodingDifficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-300",
  normal: "bg-amber-500/15 text-amber-300",
  hard: "bg-rose-500/15 text-rose-300",
};

export function Editor({ question, onBack }: Props) {
  const monacoLanguage = LANGUAGE_MONACO[question.language];

  const [code, setCode] = useState<string>(question.initialCode);
  const [tab, setTab] = useState<BottomTabId>("output");
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [visibleHintCount, setVisibleHintCount] = useState(0);
  const [aiReview, setAiReview] = useState<AiReviewResult | null>(null);

  // 問題切り替えで状態リセット
  useEffect(() => {
    setCode(question.initialCode);
    setTab("output");
    setExecutionResult(null);
    setVisibleHintCount(0);
    setAiReview(null);
  }, [question.id, question.initialCode]);

  // 推奨解(おすすめ)を取得。なければ最初の解答例。
  const recommendedSolution = useMemo(() => {
    return (
      question.solutionExamples.find((s) => s.isRecommended) ??
      question.solutionExamples[0] ?? null
    );
  }, [question.solutionExamples]);

  const diff = useMemo(
    () => diffLines(code, recommendedSolution?.code ?? ""),
    [code, recommendedSolution],
  );

  const usedHints = useMemo<HintLevel[]>(
    () =>
      ([1, 2, 3, 4, 5] as HintLevel[]).filter((lv) => lv <= visibleHintCount),
    [visibleHintCount],
  );

  const handleRun = () => {
    setTab("output");
    // ダミー実行: testCases に事前設定された passed を集計
    const lines: ExecutionResult["lines"] = [
      { kind: "note", text: "実行は将来 (FastAPI サンドボックス) で対応予定。現在は事前設定の合否を表示します。" },
    ];
    for (const tc of question.testCases) {
      lines.push({
        kind: tc.passed ? "ok" : "fail",
        text: `${tc.passed ? "✅" : "❌"} ${tc.name}`,
      });
      lines.push({ kind: "info", text: `   入力: ${tc.input}` });
      lines.push({ kind: "info", text: `   期待値: ${tc.expected}` });
      if (tc.actual !== undefined) {
        lines.push({
          kind: tc.passed ? "info" : "fail",
          text: `   実際の結果: ${tc.actual}`,
        });
      }
      lines.push({ kind: "info", text: "" });
    }
    const passedCount = question.testCases.filter((t) => t.passed).length;
    const score = Math.round((passedCount / question.testCases.length) * 100);
    setExecutionResult({
      passed: passedCount === question.testCases.length,
      score,
      lines,
    });
  };

  const handleSubmit = () => {
    // 回答する = 実行 + AIレビュー要求 をまとめて扱う
    handleRun();
    handleAiReview();
  };

  const handleReset = () => {
    setCode(question.initialCode);
    setExecutionResult(null);
    setAiReview(null);
    setVisibleHintCount(0);
    setTab("output");
  };

  const handleAiReview = () => {
    const score = computeDummyScore(code, question, visibleHintCount);
    const recommendedId = recommendedSolution?.id ?? `${question.id}-recommended`;
    setAiReview({
      isCorrect: score >= 80,
      score,
      summary:
        score >= 80
          ? `基本的な実装は正しくできています。${visibleHintCount > 0 ? `ヒント${visibleHintCount}まで見た状態で正解できています。` : "ヒントを見ずに到達できました。"}`
          : "実装の方向性は合っていますが、もう少し具体的な部分の見直しが必要です。解答例と差分タブを参考にしてください。",
      goodPoints: [
        `${question.tags[0] ?? "基本"} の使い方が問題の意図と一致している`,
        "コードが短く、意図が一読で伝わる",
      ],
      improvementPoints: [
        "エッジケース (空入力 / 境界値) を明示的に処理する",
        visibleHintCount > 0
          ? `次回はヒント${Math.max(visibleHintCount - 1, 0)}までで解けることを目指しましょう。`
          : "現状の書き方をテストで保護すると安心です。",
        "変数名をより具体的にすると意図が伝わりやすい",
      ],
      securityNotes: [
        "ユーザー入力を扱う場合はサーバー側でも必ず再検証してください (クライアントだけの検証は信頼できない)。",
      ],
      readabilityNotes: [
        "ネストは浅く読みやすい。早期 return + 説明的な命名でさらに改善できます。",
      ],
      performanceNotes: [
        `今回の入力サイズなら計算量は問題なし。データが大きい場合は ${question.tags[0] ?? "アルゴリズム"} の効率を再検討してください。`,
      ],
      recommendedSolutionId: recommendedId,
      solutionExamples: question.solutionExamples,
      diff,
      usedHintCount: visibleHintCount,
      usedHints,
      nextLearningTopics: [
        `${question.tags[0] ?? "関連"} の応用問題に挑戦する`,
        "ユニットテストを書いて回帰を防ぐ習慣をつける",
        "エラーハンドリングの基本パターンを学ぶ",
      ],
    });
    setTab("ai-review");
  };

  const handleRevealHint = () => {
    setVisibleHintCount((c) => Math.min(c + 1, question.hints.length));
  };
  const handleResetHints = () => setVisibleHintCount(0);

  const handleApplySolution = (codeFromSolution: string) => {
    setCode(codeFromSolution);
    setTab("output");
  };

  const codeLineCount = code.split("\n").length;

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-3.5rem)] flex-col bg-[#0d1117] text-slate-200">
      {/* Issue header */}
      <header className="shrink-0 border-b border-slate-700 bg-[#161b22] px-4 py-3 motion-safe:animate-fade-up">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onBack}
            className="rounded-md bg-slate-700/60 px-2 py-1 text-slate-200 hover:bg-slate-600"
          >
            ← Issues に戻る
          </button>
          <span className="font-mono text-[11px] text-slate-500">
            #{String(question.issueNumber).padStart(3, "0")}
          </span>
          <span className="text-sm font-semibold text-white">{question.title}</span>
          <span
            className={clsx(
              "rounded-full border px-1.5 py-0.5 text-[10px]",
              STATUS_PILL_CLASS[question.status],
            )}
          >
            {ISSUE_STATUS_LABEL[question.status]}
          </span>
          <span
            className={clsx(
              "rounded-full px-1.5 py-0.5 text-[10px]",
              DIFFICULTY_PILL_CLASS[question.difficulty],
            )}
          >
            {DIFFICULTY_LABEL[question.difficulty]}
          </span>
          <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-300">
            {QUESTION_TYPE_LABEL[question.type]}
          </span>
          <span
            aria-label="AIレビュー予定"
            title="AIレビュー対応予定"
            className="ml-auto rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white motion-safe:animate-pulse-soft"
          >
            AI 自動レビュー予定
          </span>
        </div>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>{LANGUAGE_ICON[question.language]} {LANGUAGE_LABEL[question.language]}</span>
          {question.framework && (
            <span>Framework: {FRAMEWORK_LABEL[question.framework]}</span>
          )}
          <span>Estimated: {question.estimatedMinutes} min</span>
          <span>
            Labels:{" "}
            {question.tags.map((t, i) => (
              <span key={t} className="text-slate-400">
                {i > 0 && " / "}
                {t}
              </span>
            ))}
          </span>
        </div>
      </header>

      {/* Description */}
      <div
        className="shrink-0 border-b border-slate-700 bg-[#0d1117] px-4 py-3 motion-safe:animate-fade-up"
        style={{ animationDelay: "60ms" }}
      >
        <p className="whitespace-pre-wrap text-xs text-slate-300">
          {question.description}
        </p>
      </div>

      {/* Action bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-700 bg-[#161b22] px-3 py-2 text-xs motion-safe:animate-fade-up" style={{ animationDelay: "100ms" }}>
        <ActionButton onClick={handleRun} label="▶ 実行" tone="primary" />
        <ActionButton onClick={handleSubmit} label="✔ 回答する" tone="success" />
        <ActionButton onClick={handleReset} label="↺ リセット" />
        <ActionButton onClick={handleAiReview} label="🤖 AIレビュー" tone="ai" />
        <span className="ml-auto text-[11px] text-slate-500">
          {LANGUAGE_LABEL[question.language]} · {codeLineCount} 行 / {code.length} 文字
        </span>
      </div>

      {/* Editor */}
      <div
        key={question.id}
        className="flex-1 min-h-0 motion-safe:animate-fade-up"
        style={{ animationDelay: "140ms" }}
      >
        <MonacoEditor
          height="100%"
          language={monacoLanguage}
          theme="vs-dark"
          value={code}
          onChange={(v) => setCode(v ?? "")}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            tabSize: 2,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            wordWrap: "on",
            lineNumbers: "on",
          }}
        />
      </div>

      {/* Bottom panel */}
      <BottomPanel
        tab={tab}
        onTabChange={setTab}
        question={question}
        executionResult={executionResult}
        visibleHintCount={visibleHintCount}
        onRevealHint={handleRevealHint}
        onResetHints={handleResetHints}
        diff={diff}
        onApplySolution={handleApplySolution}
        aiReview={aiReview}
        onRequestAiReview={handleAiReview}
      />
    </div>
  );
}

function ActionButton({
  onClick,
  label,
  tone = "default",
}: {
  onClick: () => void;
  label: string;
  tone?: "default" | "primary" | "success" | "ai";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded-md px-3 py-1 text-xs font-semibold transition",
        tone === "primary" && "bg-[#0e639c] text-white hover:bg-[#1177bb]",
        tone === "success" && "bg-emerald-500 text-white hover:bg-emerald-600",
        tone === "ai" &&
          "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:from-indigo-600 hover:to-fuchsia-600 motion-safe:animate-pulse-soft",
        tone === "default" && "bg-slate-700 text-slate-100 hover:bg-slate-600",
      )}
    >
      {label}
    </button>
  );
}

function computeDummyScore(
  code: string,
  question: CodingQuestion,
  visibleHintCount: number,
): number {
  const recommended =
    question.solutionExamples.find((s) => s.isRecommended)?.code ??
    question.solutionExamples[0]?.code ??
    "";
  if (!recommended) return 70;
  // 編集量に応じてスコアを変化 (ダミー)
  const norm = (s: string) => s.trim().replace(/\s+/g, " ");
  const a = norm(code);
  const b = norm(recommended);
  if (a === b) return Math.max(60, 100 - visibleHintCount * 5);
  const userChanged = a !== norm(question.initialCode);
  const base = userChanged ? 78 : 62;
  return Math.max(40, base - visibleHintCount * 4);
}
