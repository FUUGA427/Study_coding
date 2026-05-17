import clsx from "clsx";
import type { SolutionExample } from "@/types/coding";

type Props = {
  solutions: SolutionExample[];
  onApply?: (code: string) => void;
};

export function SolutionExamples({ solutions, onApply }: Props) {
  if (solutions.length === 0) {
    return (
      <div className="text-sm text-slate-400">解答例はまだありません。</div>
    );
  }
  // Recommended を先頭に並べ替え
  const sorted = [...solutions].sort(
    (a, b) => Number(!!b.isRecommended) - Number(!!a.isRecommended),
  );
  return (
    <div className="space-y-3">
      <div className="text-[11px] text-slate-400">
        複数の実装方法を比較できます。AIが将来的に推薦するおすすめ実装には{" "}
        <span className="font-semibold text-emerald-300">おすすめ</span> バッジが付きます。
      </div>
      {sorted.map((s, i) => (
        <article
          key={s.id}
          className={clsx(
            "rounded-md border p-3 motion-safe:animate-code-line",
            s.isRecommended
              ? "border-emerald-400/50 bg-emerald-400/5"
              : "border-slate-700 bg-[#0d1117]",
          )}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-100">{s.title}</h4>
            {s.isRecommended && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/40">
                ⭐ おすすめ
              </span>
            )}
            {onApply && (
              <button
                type="button"
                onClick={() => onApply(s.code)}
                className="ml-auto rounded-md bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-100 hover:bg-slate-600"
              >
                エディタに反映
              </button>
            )}
          </div>
          {s.isRecommended && (
            <div className="mt-1 text-[11px] text-emerald-300">
              実務ではこの書き方がおすすめです。
            </div>
          )}
          <pre className="mt-2 overflow-x-auto rounded bg-black/50 p-2 font-mono text-[12px] leading-snug text-slate-100">
            <code>{s.code}</code>
          </pre>
          <p className="mt-2 text-[12px] text-slate-300">{s.explanation}</p>
          {s.points.length > 0 && (
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[12px] text-slate-400">
              {s.points.map((p, k) => (
                <li key={k}>{p}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
