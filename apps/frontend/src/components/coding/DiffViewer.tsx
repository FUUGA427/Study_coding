import clsx from "clsx";
import type { CodeDiffLine } from "@/types/coding";

type Props = {
  diff: CodeDiffLine[];
};

export function DiffViewer({ diff }: Props) {
  const added = diff.filter((l) => l.type === "added").length;
  const removed = diff.filter((l) => l.type === "removed").length;

  if (diff.length === 0) {
    return (
      <div className="text-sm text-slate-400">
        まだ差分はありません。コードを編集して「実行」または「AIレビュー」を押すと、解答例との差分がここに表示されます。
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-3 text-[11px]">
        <span className="text-slate-400">あなたの回答 vs 解答例</span>
        <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">
          +{added}
        </span>
        <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-rose-300">
          −{removed}
        </span>
      </div>
      <pre className="overflow-x-auto rounded-md border border-slate-700 bg-[#0d1117] font-mono text-[12px] leading-snug">
        {diff.map((line, i) => (
          <div
            key={i}
            className={clsx(
              "flex gap-2 px-2 py-0.5",
              line.type === "added" && "bg-emerald-500/10",
              line.type === "removed" && "bg-rose-500/10",
            )}
          >
            <span className="w-9 select-none text-right font-mono text-[10px] text-slate-500">
              {line.lineNumber ?? ""}
            </span>
            <span
              className={clsx(
                "w-3 select-none font-mono",
                line.type === "added" && "text-emerald-300",
                line.type === "removed" && "text-rose-300",
                line.type === "unchanged" && "text-slate-600",
              )}
            >
              {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
            </span>
            <span
              className={clsx(
                "whitespace-pre",
                line.type === "added" && "text-emerald-100",
                line.type === "removed" && "text-rose-100",
                line.type === "unchanged" && "text-slate-300",
              )}
            >
              {line.content || " "}
            </span>
          </div>
        ))}
      </pre>
    </div>
  );
}
