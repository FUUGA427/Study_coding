import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  CODING_REPOSITORIES,
  CODING_QUESTIONS,
  FRAMEWORK_LABEL,
  LANGUAGE_ICON,
  LANGUAGE_LABEL,
} from "@/data/codingCatalog";
import type { CodingRepository, Language } from "@/types/coding";

type Props = {
  onSelect: (repo: CodingRepository) => void;
};

const LANGUAGE_FILTER_OPTIONS: Array<Language | "all"> = [
  "all",
  "typescript",
  "javascript",
  "python",
  "sql",
  "html",
  "css",
  "go",
  "java",
];

export function RepositoryList({ onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [language, setLanguage] = useState<Language | "all">("all");

  const issueCountByRepo = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of CODING_QUESTIONS) {
      map.set(q.repositoryId, (map.get(q.repositoryId) ?? 0) + 1);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CODING_REPOSITORIES.filter((r) => {
      if (language !== "all" && r.language !== language) return false;
      if (q) {
        const hay = `${r.name} ${r.description} ${r.tags.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [search, language]);

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-3.5rem)] bg-[#0d1117] text-slate-200">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* boot strip */}
        <header className="motion-safe:animate-fade-up">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
            <span className="motion-safe:animate-code-glyph">{"</>"}</span>
            <span className="motion-safe:animate-code-glyph" style={{ animationDelay: "120ms" }}>{"{}"}</span>
            <span className="motion-safe:animate-code-glyph" style={{ animationDelay: "240ms" }}>git branch</span>
            <span className="motion-safe:animate-code-glyph" style={{ animationDelay: "360ms" }}>commit</span>
            <span>— boot</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            学びたい技術を選ぼう
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Repository を選ぶように、学びたい言語・フレームワークを選択できます。将来的にはAIがあなたに合わせた Issue 形式の問題を自動生成します。
          </p>
        </header>

        {/* filter bar */}
        <section
          className="mt-6 flex flex-col gap-3 motion-safe:animate-fade-up sm:flex-row sm:items-center"
          style={{ animationDelay: "80ms" }}
        >
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="search"
              placeholder="Find a repository... (名前・説明・タグで検索)"
              className="w-full rounded-md border border-slate-700 bg-[#161b22] pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              🔍
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {LANGUAGE_FILTER_OPTIONS.map((l) => {
              const active = l === language;
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLanguage(l)}
                  className={clsx(
                    "rounded-full px-2.5 py-0.5 text-xs transition",
                    active
                      ? "bg-indigo-500 text-white"
                      : "bg-[#161b22] text-slate-300 ring-1 ring-slate-700 hover:bg-[#22272e]",
                  )}
                >
                  {l === "all" ? "All" : `${LANGUAGE_ICON[l]} ${LANGUAGE_LABEL[l]}`}
                </button>
              );
            })}
          </div>
        </section>

        {/* Repositories label */}
        <div
          className="mt-6 flex items-center justify-between motion-safe:animate-fade-up"
          style={{ animationDelay: "150ms" }}
        >
          <h2 className="text-base font-semibold text-white">
            Repositories <span className="ml-1 text-xs text-slate-500">({filtered.length})</span>
          </h2>
          <div className="text-[11px] text-slate-500">最終更新順</div>
        </div>

        {/* cards */}
        <ul className="mt-3 space-y-3">
          {filtered.map((repo, i) => {
            const issues = issueCountByRepo.get(repo.id) ?? 0;
            return (
              <li
                key={repo.id}
                className="motion-safe:animate-fade-up"
                style={{ animationDelay: `${180 + i * 60}ms` }}
              >
                <button
                  type="button"
                  onClick={() => onSelect(repo)}
                  className="group block w-full overflow-hidden rounded-md border border-slate-700 bg-[#0d1117] p-4 text-left transition hover:border-indigo-500 motion-safe:hover:-translate-y-0.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">
                          {LANGUAGE_ICON[repo.language]}
                        </span>
                        <h3 className="truncate text-sm font-semibold text-indigo-300 group-hover:underline">
                          {repo.name}
                        </h3>
                        <StatusPill status={repo.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{repo.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <LanguageDot language={repo.language} />
                          {LANGUAGE_LABEL[repo.language]}
                        </span>
                        {repo.framework && (
                          <span>Framework: {FRAMEWORK_LABEL[repo.framework]}</span>
                        )}
                        <span>Issues: {issues}</span>
                        <span>Difficulty: {repo.difficultyRange}</span>
                        <span>Updated {repo.lastUpdated}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {repo.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-300 ring-1 ring-indigo-500/30"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="rounded-md border border-slate-600 px-2 py-1 text-[11px] text-slate-300 group-hover:border-indigo-400 group-hover:text-indigo-200">
                      Open Repository →
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="mt-6 rounded-md border border-slate-700 bg-[#0d1117] p-6 text-center text-sm text-slate-400">
            条件に合うリポジトリが見つかりませんでした。
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: CodingRepository["status"] }) {
  if (status === "wip") {
    return (
      <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
        WIP
      </span>
    );
  }
  return (
    <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
      Active
    </span>
  );
}

function LanguageDot({ language }: { language: Language }) {
  const cls: Record<Language, string> = {
    javascript: "bg-yellow-400",
    typescript: "bg-blue-400",
    python: "bg-emerald-400",
    sql: "bg-pink-400",
    html: "bg-orange-400",
    css: "bg-purple-400",
    go: "bg-cyan-400",
    java: "bg-rose-400",
  };
  return <span className={clsx("inline-block h-2 w-2 rounded-full", cls[language])} />;
}
