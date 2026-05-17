import clsx from "clsx";
import type { AiReviewResult } from "@/types/coding";
import { SolutionExamples } from "./SolutionExamples";
import { DiffViewer } from "./DiffViewer";

type Props = {
  requested: boolean;
  review: AiReviewResult | null;
  onRequest: () => void;
};

export function AIReviewPanel({ requested, review, onRequest }: Props) {
  if (!requested || !review) {
    return (
      <div className="rounded-md border border-dashed border-slate-600 p-4 text-center text-[12px] text-slate-400">
        <div className="mb-1 text-xl">🤖</div>
        <div>
          コードを書き終えたら「🤖 AIレビュー」を押すと、AIによる評価 (現在はダミー) を表示します。
        </div>
        <div className="mt-1 text-[10px] text-slate-500">
          将来は <code className="font-mono">POST /api/coding/questions/&#123;id&#125;/review</code> 経由で実コードをレビューし、結果を S3 に保存します。
        </div>
        <button
          type="button"
          onClick={onRequest}
          className="mt-3 rounded-md bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white hover:from-indigo-600 hover:to-fuchsia-600 motion-safe:animate-pulse-soft"
        >
          🤖 ダミーレビューを実行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-[12px]">
      {/* verdict + score */}
      <div className="flex items-center gap-3 rounded-md bg-gradient-to-r from-indigo-500/20 to-fuchsia-500/20 p-3 ring-1 ring-indigo-400/30 motion-safe:animate-fade-up">
        <span className="text-2xl">{review.isCorrect ? "✅" : "🟡"}</span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-white">
            {review.isCorrect ? "正解" : "部分的に正解"}
          </div>
          <div className="text-[11px] text-slate-300">
            スコア: <span className="font-bold text-white">{review.score}</span> / 100
          </div>
          <div className="text-[11px] text-slate-300">
            参照ヒント:{" "}
            <span className="font-bold text-white">{review.usedHintCount}</span> / 5
            {review.usedHints.length > 0 && (
              <span className="ml-1 text-[10px] text-slate-400">
                (Lv {review.usedHints.join(", ")})
              </span>
            )}
          </div>
        </div>
      </div>

      <Section title="サマリ">
        <p className="text-slate-300">{review.summary}</p>
      </Section>

      <Section title="良かった点" tone="ok">
        <BulletList items={review.goodPoints} />
      </Section>

      <Section title="改善点" tone="warn">
        <BulletList items={review.improvementPoints} />
      </Section>

      {review.securityNotes.length > 0 && (
        <Section title="セキュリティ" tone="warn">
          <BulletList items={review.securityNotes} />
        </Section>
      )}
      {review.readabilityNotes.length > 0 && (
        <Section title="可読性">
          <BulletList items={review.readabilityNotes} />
        </Section>
      )}
      {review.performanceNotes.length > 0 && (
        <Section title="パフォーマンス">
          <BulletList items={review.performanceNotes} />
        </Section>
      )}

      <Section title="解答例 (おすすめ / その他)">
        <SolutionExamples solutions={review.solutionExamples} />
      </Section>

      <Section title="あなたのコードとの差分">
        <DiffViewer diff={review.diff} />
      </Section>

      <Section title="次に学ぶべきポイント" tone="info">
        <BulletList items={review.nextLearningTopics} />
      </Section>

      <div className="mt-2 rounded-md border border-dashed border-slate-700 p-2 text-[10px] text-slate-500">
        ※ 将来、この AI レビュー結果と回答コードは S3 に保存されます (詳細: docs/ai-question-platform.md)。
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "ok" | "warn" | "info";
}) {
  const titleCls =
    tone === "ok"
      ? "text-emerald-300"
      : tone === "warn"
        ? "text-amber-300"
        : tone === "info"
          ? "text-sky-300"
          : "text-slate-400";
  return (
    <div className="motion-safe:animate-fade-up">
      <div
        className={clsx("text-[10px] font-semibold uppercase tracking-wider", titleCls)}
      >
        {title}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0)
    return <p className="text-[11px] text-slate-500">(なし)</p>;
  return (
    <ul className="list-inside list-disc space-y-0.5 text-slate-300">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}
