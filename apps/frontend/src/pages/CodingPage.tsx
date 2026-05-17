import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import clsx from "clsx";
import {
  CODING_LANGUAGES,
  CODING_PROBLEMS,
  type CodingLanguage,
  type CodingLanguageId,
  type CodingProblem,
} from "@/data/codingProblems";

type OutputLine = { kind: "info" | "ok" | "error" | "note"; text: string };

const DIFFICULTY_LABEL: Record<CodingProblem["difficulty"], string> = {
  easy: "易",
  normal: "中",
  hard: "難",
};

const DIFFICULTY_CLASS: Record<CodingProblem["difficulty"], string> = {
  easy: "bg-emerald-500/20 text-emerald-300",
  normal: "bg-amber-500/20 text-amber-300",
  hard: "bg-rose-500/20 text-rose-300",
};

export function CodingPage() {
  const [languageId, setLanguageId] = useState<CodingLanguageId>("javascript");
  const language = useMemo<CodingLanguage>(
    () => CODING_LANGUAGES.find((l) => l.id === languageId) ?? CODING_LANGUAGES[0],
    [languageId],
  );

  const problems = useMemo(
    () => CODING_PROBLEMS.filter((p) => p.languageId === languageId),
    [languageId],
  );

  const [problemId, setProblemId] = useState<string>(problems[0]?.id ?? "");
  // 言語が変わった時に最初の問題を選び直す
  useEffect(() => {
    if (problems[0] && !problems.some((p) => p.id === problemId)) {
      setProblemId(problems[0].id);
    }
  }, [problems, problemId]);

  const problem = useMemo(
    () => problems.find((p) => p.id === problemId) ?? problems[0],
    [problems, problemId],
  );

  const [code, setCode] = useState<string>(problem?.starterCode ?? "");
  const [output, setOutput] = useState<OutputLine[]>([]);

  // 問題切り替え時にエディタ内容をリセット
  useEffect(() => {
    setCode(problem?.starterCode ?? "");
    setOutput([]);
  }, [problem?.id, problem?.starterCode]);

  const handleRun = () => {
    setOutput([
      {
        kind: "note",
        text: "実行は将来 (FastAPI バックエンド側のサンドボックス) で対応予定です。",
      },
      { kind: "info", text: `[lang] ${language.label}` },
      { kind: "info", text: `[chars] ${code.length}` },
    ]);
  };

  const handleReset = () => {
    setCode(problem?.starterCode ?? "");
    setOutput([{ kind: "note", text: "コードを初期状態にリセットしました。" }]);
  };

  const handleShowSolution = () => {
    if (!problem) return;
    setCode(problem.sampleSolution);
    setOutput([{ kind: "ok", text: "解答例を表示しました。" }]);
  };

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100vh-3.5rem)] flex-col bg-[#1e1e1e] text-slate-200">
      {/* Top tab bar (VSCode風) */}
      <div className="flex shrink-0 items-center gap-1 border-b border-black/40 bg-[#252526] px-2 py-1 text-xs">
        <TabPill active>{problem ? fileName(problem, language) : "untitled"}</TabPill>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Activity bar */}
        <aside className="flex w-12 shrink-0 flex-col items-center gap-3 border-r border-black/40 bg-[#333333] py-3 text-slate-400">
          <span title="Explorer" className="text-lg">📁</span>
          <span title="Search" className="text-lg">🔍</span>
          <span title="Run" className="text-lg">▶</span>
          <span title="Extensions" className="text-lg">🧩</span>
        </aside>

        {/* Sidebar (Explorer) */}
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-black/40 bg-[#252526] text-xs sm:flex">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Explorer
          </div>
          <div className="px-2 pb-3">
            <div className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              言語 / フレームワーク
            </div>
            <ul className="space-y-0.5">
              {CODING_LANGUAGES.map((lang) => {
                const active = lang.id === languageId;
                return (
                  <li key={lang.id}>
                    <button
                      type="button"
                      onClick={() => setLanguageId(lang.id)}
                      className={clsx(
                        "flex w-full items-center gap-2 rounded px-2 py-1 text-left transition",
                        active
                          ? "bg-[#37373d] text-white"
                          : "text-slate-300 hover:bg-[#2a2d2e]",
                      )}
                    >
                      <span>{lang.icon}</span>
                      <span className="flex-1 truncate">{lang.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {language.label} の問題
            </div>
            <ul className="space-y-0.5">
              {problems.length === 0 && (
                <li className="px-2 py-1 text-[11px] italic text-slate-500">
                  問題はまだありません
                </li>
              )}
              {problems.map((p) => {
                const active = p.id === problemId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setProblemId(p.id)}
                      className={clsx(
                        "flex w-full items-start gap-2 rounded px-2 py-1 text-left transition",
                        active
                          ? "bg-[#37373d] text-white"
                          : "text-slate-300 hover:bg-[#2a2d2e]",
                      )}
                    >
                      <span className="mt-0.5">📄</span>
                      <span className="flex-1 truncate" title={p.title}>
                        {p.title}
                      </span>
                      <span
                        className={clsx(
                          "rounded px-1 text-[10px] font-semibold",
                          DIFFICULTY_CLASS[p.difficulty],
                        )}
                      >
                        {DIFFICULTY_LABEL[p.difficulty]}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Main: 問題説明 + エディタ + 出力 */}
        <main className="flex min-w-0 flex-1 flex-col">
          {/* モバイル用 言語/問題セレクト */}
          <div className="flex flex-wrap gap-2 border-b border-black/40 bg-[#2d2d2d] p-2 text-xs sm:hidden">
            <select
              value={languageId}
              onChange={(e) => setLanguageId(e.target.value as CodingLanguageId)}
              className="rounded bg-[#3c3c3c] px-2 py-1 text-slate-100"
            >
              {CODING_LANGUAGES.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.icon} {l.label}
                </option>
              ))}
            </select>
            <select
              value={problemId}
              onChange={(e) => setProblemId(e.target.value)}
              className="flex-1 rounded bg-[#3c3c3c] px-2 py-1 text-slate-100"
            >
              {problems.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* 問題説明パネル */}
          {problem && (
            <div className="shrink-0 border-b border-black/40 bg-[#252526] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-white">{problem.title}</h2>
                <span
                  className={clsx(
                    "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                    DIFFICULTY_CLASS[problem.difficulty],
                  )}
                >
                  難易度: {DIFFICULTY_LABEL[problem.difficulty]}
                </span>
                {problem.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-xs text-slate-300">
                {problem.description}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex shrink-0 items-center gap-2 border-b border-black/40 bg-[#1e1e1e] px-3 py-2 text-xs">
            <ActionButton onClick={handleRun} label="▶ 実行" tone="primary" />
            <ActionButton onClick={handleReset} label="↺ リセット" />
            <ActionButton onClick={handleShowSolution} label="💡 解答例" />
            <span className="ml-auto text-[11px] text-slate-500">
              Monaco editor — 言語: {language.label}
            </span>
          </div>

          {/* Editor */}
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language.monaco}
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
              }}
            />
          </div>

          {/* Output panel */}
          <div className="h-32 shrink-0 overflow-y-auto border-t border-black/40 bg-black/70 px-3 py-2 font-mono text-xs">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
              Output
            </div>
            {output.length === 0 && (
              <div className="text-slate-500">
                ▶ ボタンで実行(現在はモック)、解答例で正解コードを表示できます。
              </div>
            )}
            {output.map((line, i) => (
              <div
                key={i}
                className={clsx(
                  line.kind === "ok" && "text-emerald-400",
                  line.kind === "error" && "text-rose-400",
                  line.kind === "note" && "text-amber-300",
                  line.kind === "info" && "text-slate-300",
                )}
              >
                {line.text}
              </div>
            ))}
          </div>

          {/* Status bar */}
          <div className="flex shrink-0 items-center justify-between border-t border-black/40 bg-[#007acc] px-3 py-1 text-[11px] text-white">
            <span>{language.label}</span>
            <span>
              {code.split("\n").length} 行 / {code.length} 文字
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}

function TabPill({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "rounded-t px-3 py-1 text-xs",
        active ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-slate-400",
      )}
    >
      {children}
    </span>
  );
}

function ActionButton({
  onClick,
  label,
  tone = "default",
}: {
  onClick: () => void;
  label: string;
  tone?: "default" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "rounded px-3 py-1 text-xs font-semibold transition",
        tone === "primary"
          ? "bg-[#0e639c] text-white hover:bg-[#1177bb]"
          : "bg-[#3c3c3c] text-slate-100 hover:bg-[#505050]",
      )}
    >
      {label}
    </button>
  );
}

function fileName(problem: CodingProblem, language: CodingLanguage): string {
  const ext: Record<CodingLanguageId, string> = {
    javascript: "js",
    typescript: "ts",
    python: "py",
    react: "tsx",
    html: "html",
    fastapi: "py",
  };
  const safe = problem.title.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-ぁ-んァ-ン一-龯]/g, "");
  return `${safe || "problem"}.${ext[language.id]}`;
}
