import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  CODING_QUESTIONS,
  DIFFICULTY_LABEL,
  FRAMEWORK_LABEL,
  ISSUE_STATUS_LABEL,
  LANGUAGE_ICON,
  LANGUAGE_LABEL,
  QUESTION_TYPE_LABEL,
} from "@/data/codingCatalog";
import type {
  CodingDifficulty,
  CodingQuestion,
  CodingRepository,
  IssueStatus,
} from "@/types/coding";

type Props = {
  repository: CodingRepository;
  onBack: () => void;
  onSelect: (question: CodingQuestion) => void;
};

const STATUS_FILTER_OPTIONS: Array<IssueStatus | "all"> = [
  "all",
  "open",
  "in-progress",
  "solved",
];

const DIFFICULTY_FILTER_OPTIONS: Array<CodingDifficulty | "all"> = [
  "all",
  "easy",
  "normal",
  "hard",
];

const STATUS_PILL_CLASS: Record<IssueStatus, string> = {
  open: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  "in-progress": "border-amber-400/40 bg-amber-400/10 text-amber-300",
  solved: "border-violet-400/40 bg-violet-400/10 text-violet-300",
};

const STATUS_ICON: Record<IssueStatus, string> = {
  open: "🟢",
  "in-progress": "🟡",
  solved: "🟣",
};

const DIFFICULTY_PILL_CLASS: Record<CodingDifficulty, string> = {
  easy: "bg-emerald-500/15 text-emerald-300",
  normal: "bg-amber-500/15 text-amber-300",
  hard: "bg-rose-500/15 text-rose-300",
};

export function IssueList({ repository, onBack, onSelect }: Props) {
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [difficulty, setDifficulty] = useState<CodingDifficulty | "all">("all");
  const [search, setSearch] = useState("");

  const issues = useMemo(
    () =>
      CODING_QUESTIONS.filter((q) => q.repositoryId === repository.id).sort(
        (a, b) => a.issueNumber - b.issueNumber,
      ),
    [repository.id],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((it) => {
      if (status !== "all" && it.status !== status) return false;
      if (difficulty !== "all" && it.difficulty !== difficulty) return false;
      if (q) {
        const hay = `${it.title} ${it.description} ${it.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [issues, status, difficulty, search]);

  const openCount = issues.filter((i) => i.status === "open").length;
  const solvedCount = issues.filter((i) => i.status === "solved").length;

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-3.5rem)] bg-[#0d1117] text-slate-200">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-slate-400 motion-safe:animate-fade-up">
          <button
            type="button"
            onClick={onBack}
            className="hover:text-indigo-300 hover:underline"
          >
            Repositories
          </button>
          <span>/</span>
          <span className="text-indigo-300">{repository.name}</span>
        </nav>

        {/* header */}
        <header
          className="mt-2 motion-safe:animate-fade-up"
          style={{ animationDelay: "60ms" }}
        >
          <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            <span>{LANGUAGE_ICON[repository.language]}</span>
            {repository.name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{repository.description}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
            <span>Language: {LANGUAGE_LABEL[repository.language]}</span>
            {repository.framework && (
              <span>Framework: {FRAMEWORK_LABEL[repository.framework]}</span>
            )}
            <span>Issues: {issues.length}</span>
            <span>Difficulty: {repository.difficultyRange}</span>
          </div>
        </header>

        {/* filters */}
        <section
          className="mt-5 flex flex-col gap-3 motion-safe:animate-slide-in-left"
          style={{ animationDelay: "120ms" }}
        >
          <div className="relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Filter issues... (タイトル・タグで検索)"
              className="w-full rounded-md border border-slate-700 bg-[#161b22] pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ChipGroup
              options={STATUS_FILTER_OPTIONS}
              value={status}
              onChange={setStatus}
              labelFor={(v) => (v === "all" ? "All status" : ISSUE_STATUS_LABEL[v])}
            />
            <ChipGroup
              options={DIFFICULTY_FILTER_OPTIONS}
              value={difficulty}
              onChange={setDifficulty}
              labelFor={(v) => (v === "all" ? "All level" : DIFFICULTY_LABEL[v])}
            />
          </div>
        </section>

        {/* counts */}
        <div
          className="mt-5 flex items-center justify-between border-b border-slate-700 pb-2 motion-safe:animate-fade-up"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="text-base font-semibold text-white">
            Issues <span className="ml-1 text-xs text-slate-500">({filtered.length})</span>
          </h2>
          <div className="text-[11px] text-slate-500">
            <span className="text-emerald-300">●</span> {openCount} Open ·{" "}
            <span className="text-violet-300">●</span> {solvedCount} Solved
          </div>
        </div>

        {/* issue rows */}
        <ul className="divide-y divide-slate-800 rounded-md border border-slate-800 bg-[#0d1117] motion-safe:animate-slide-in-left" style={{ animationDelay: "220ms" }}>
          {filtered.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={() => onSelect(it)}
                className="group block w-full px-4 py-3 text-left transition hover:bg-[#161b22]"
              >
                <div className="flex flex-wrap items-start gap-2">
                  <span aria-hidden className="mt-0.5 text-base leading-none">
                    {STATUS_ICON[it.status]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-500">
                        #{String(it.issueNumber).padStart(3, "0")}
                      </span>
                      <span className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 group-hover:underline">
                        {it.title}
                      </span>
                      <span
                        className={clsx(
                          "rounded-full border px-1.5 py-0.5 text-[10px]",
                          STATUS_PILL_CLASS[it.status],
                        )}
                      >
                        {ISSUE_STATUS_LABEL[it.status]}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-slate-400">{it.description}</p>
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      <span
                        className={clsx(
                          "rounded-full px-1.5 py-0.5",
                          DIFFICULTY_PILL_CLASS[it.difficulty],
                        )}
                      >
                        {DIFFICULTY_LABEL[it.difficulty]}
                      </span>
                      <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-slate-300">
                        {QUESTION_TYPE_LABEL[it.type]}
                      </span>
                      {it.tags.slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-indigo-300 ring-1 ring-indigo-500/30"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-slate-500">
                    <div>Estimated</div>
                    <div className="font-mono text-slate-300">{it.estimatedMinutes} min</div>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="mt-3 rounded-md border border-slate-700 bg-[#0d1117] p-6 text-center text-sm text-slate-400">
            条件に合う Issue が見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  labelFor,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  labelFor: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={clsx(
              "rounded-full px-2.5 py-0.5 text-xs transition",
              active
                ? "bg-indigo-500 text-white"
                : "bg-[#161b22] text-slate-300 ring-1 ring-slate-700 hover:bg-[#22272e]",
            )}
          >
            {labelFor(o)}
          </button>
        );
      })}
    </div>
  );
}
