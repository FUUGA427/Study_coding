import clsx from "clsx";
import type {
  AiReviewResult,
  CodeDiffLine,
  CodingQuestion,
} from "@/types/coding";
import { HintsPanel } from "./HintsPanel";
import { SolutionExamples } from "./SolutionExamples";
import { DiffViewer } from "./DiffViewer";
import { AIReviewPanel } from "./AIReviewPanel";

export type BottomTabId =
  | "output"
  | "tests"
  | "hints"
  | "solutions"
  | "diff"
  | "ai-review";

const TABS: Array<{ id: BottomTabId; label: string; icon: string }> = [
  { id: "output", label: "実行結果", icon: "▶" },
  { id: "tests", label: "テストケース", icon: "🧪" },
  { id: "hints", label: "ヒント", icon: "💡" },
  { id: "solutions", label: "解答例", icon: "📘" },
  { id: "diff", label: "差分", icon: "↔" },
  { id: "ai-review", label: "AIレビュー", icon: "🤖" },
];

export type ExecutionResult = {
  passed: boolean;
  score: number;
  /** UIに表示する1行ずつのテスト結果 (ダミー) */
  lines: Array<{ kind: "ok" | "fail" | "info" | "note"; text: string }>;
};

type Props = {
  tab: BottomTabId;
  onTabChange: (t: BottomTabId) => void;
  question: CodingQuestion;
  executionResult: ExecutionResult | null;
  visibleHintCount: number;
  onRevealHint: () => void;
  onResetHints: () => void;
  diff: CodeDiffLine[];
  onApplySolution: (code: string) => void;
  aiReview: AiReviewResult | null;
  onRequestAiReview: () => void;
};

export function BottomPanel({
  tab,
  onTabChange,
  question,
  executionResult,
  visibleHintCount,
  onRevealHint,
  onResetHints,
  diff,
  onApplySolution,
  aiReview,
  onRequestAiReview,
}: Props) {
  return (
    <section className="flex h-72 shrink-0 flex-col border-t border-slate-700 bg-[#0d1117] motion-safe:animate-slide-up">
      <div
        role="tablist"
        className="flex shrink-0 items-center gap-1 border-b border-slate-700 bg-[#161b22] px-2 pt-1 text-xs"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(t.id)}
              className={clsx(
                "flex items-center gap-1 rounded-t px-3 py-1 transition",
                active
                  ? "bg-[#0d1117] text-white"
                  : "text-slate-400 hover:bg-[#22272e]",
              )}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 text-xs">
        {tab === "output" && <OutputTab result={executionResult} />}
        {tab === "tests" && <TestsTab question={question} />}
        {tab === "hints" && (
          <HintsPanel
            question={question}
            visibleCount={visibleHintCount}
            onReveal={onRevealHint}
            onReset={onResetHints}
          />
        )}
        {tab === "solutions" && (
          <SolutionExamples
            solutions={question.solutionExamples}
            onApply={onApplySolution}
          />
        )}
        {tab === "diff" && <DiffViewer diff={diff} />}
        {tab === "ai-review" && (
          <AIReviewPanel
            requested={aiReview !== null}
            review={aiReview}
            onRequest={onRequestAiReview}
          />
        )}
      </div>
    </section>
  );
}

// =============================================================
// 実行結果タブ (ダミー)
// =============================================================
function OutputTab({ result }: { result: ExecutionResult | null }) {
  if (!result) {
    return (
      <div className="text-slate-400">
        「▶ 実行」ボタンを押すと、テスト結果がここに表示されます (現在はモック実行)。
      </div>
    );
  }
  return (
    <div className="font-mono text-[12px] leading-relaxed">
      {result.lines.map((line, i) => (
        <div
          key={i}
          className={clsx(
            "motion-safe:animate-code-line",
            line.kind === "ok" && "text-emerald-300",
            line.kind === "fail" && "text-rose-300",
            line.kind === "info" && "text-slate-300",
            line.kind === "note" && "text-amber-300",
          )}
          style={{ animationDelay: `${i * 40}ms` }}
        >
          {line.text}
        </div>
      ))}
      <div className="mt-2 text-[12px] text-slate-300">
        Score: <span className="font-bold text-white">{result.score}</span> / 100
      </div>
    </div>
  );
}

// =============================================================
// テストケースタブ
// =============================================================
function TestsTab({ question }: { question: CodingQuestion }) {
  return (
    <div>
      <div className="mb-2 text-[11px] text-slate-400">
        このIssueに用意されたテストケース。実行ボタンを押すと「実行結果」タブで合否が確認できます。
      </div>
      <ul className="space-y-1">
        {question.testCases.map((tc, i) => (
          <li
            key={i}
            className="rounded-md border border-slate-700 bg-[#0d1117] p-2 text-[12px] motion-safe:animate-code-line"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="font-semibold text-slate-100">{tc.name}</div>
            <div className="mt-0.5 text-slate-400">
              入力: <code className="font-mono text-slate-300">{tc.input}</code>
            </div>
            <div className="text-slate-400">
              期待値: <code className="font-mono text-slate-300">{tc.expected}</code>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
