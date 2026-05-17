import clsx from "clsx";
import type { CodingQuestion, HintCloseness } from "@/types/coding";

const CLOSENESS_LABEL: Record<HintCloseness, string> = {
  concept: "考え方",
  focus: "着目",
  implementation: "実装",
  "near-answer": "ほぼ答え",
  "almost-answer": "答え直前",
};

const CLOSENESS_TONE: Record<HintCloseness, string> = {
  concept: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  focus: "border-blue-400/40 bg-blue-400/10 text-blue-200",
  implementation: "border-indigo-400/40 bg-indigo-400/10 text-indigo-200",
  "near-answer": "border-amber-400/40 bg-amber-400/10 text-amber-200",
  "almost-answer": "border-rose-400/40 bg-rose-400/10 text-rose-200",
};

type Props = {
  question: CodingQuestion;
  visibleCount: number; // 0〜5
  onReveal: () => void;
  onReset: () => void;
};

export function HintsPanel({ question, visibleCount, onReveal, onReset }: Props) {
  const total = question.hints.length;
  const visibleHints = question.hints.slice(0, visibleCount);
  const allShown = visibleCount >= total;

  if (visibleCount === 0) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p className="text-sm text-slate-300">
          ヒントが必要な場合は「ヒントを見る」を押してください。
          <span className="ml-1 text-[11px] text-slate-500">
            (1問につき5段階のヒントが用意されています)
          </span>
        </p>
        <button
          type="button"
          onClick={onReveal}
          className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-600"
        >
          ヒントを見る (1 / {total})
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ol className="space-y-2">
        {visibleHints.map((h, i) => (
          <li
            key={h.level}
            className={clsx(
              "rounded-md border p-3 motion-safe:animate-code-line",
              CLOSENESS_TONE[h.closeness],
            )}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
                Level {h.level}
              </span>
              <span className="rounded-full bg-black/30 px-1.5 py-0.5 text-[10px]">
                {CLOSENESS_LABEL[h.closeness]}
              </span>
              <span className="text-xs font-semibold">{h.title}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-slate-100/90">
              {h.content}
            </p>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        {!allShown ? (
          <button
            type="button"
            onClick={onReveal}
            className="rounded-md bg-indigo-500 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-600"
          >
            次のヒントを見る ({visibleCount + 1} / {total})
          </button>
        ) : (
          <span className="rounded-md bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            すべてのヒントを表示済み ({total} / {total})
          </span>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-md bg-white/0 px-3 py-1 text-xs font-medium text-slate-300 ring-1 ring-slate-600 hover:bg-white/5"
        >
          最初から見直す
        </button>
        <span className="ml-auto text-[10px] text-slate-500">
          ヒントを多く見た回数は将来の AI レビュー評価に使われます。
        </span>
      </div>
    </div>
  );
}
