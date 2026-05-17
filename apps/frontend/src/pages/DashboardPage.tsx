import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  dismissRecommendation,
  getRecommendations,
  getWeaknessProfile,
} from "@/api/recommendations";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  weakness: "苦手克服",
  next_step: "次のステップ",
  review: "復習",
};

export function DashboardPage() {
  const qc = useQueryClient();
  const recs = useQuery({
    queryKey: queryKeys.recommendations(null),
    queryFn: () => getRecommendations({ limit: 10 }),
  });
  const weakness = useQuery({
    queryKey: queryKeys.weakness,
    queryFn: getWeaknessProfile,
  });

  const dismiss = useMutation({
    mutationFn: dismissRecommendation,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recommendations(null) }),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="ダッシュボード"
        description="あなたに合ったおすすめと、苦手傾向を確認しましょう。"
      />

      <section>
        <h2 className="text-lg font-semibold mb-3">おすすめの学習</h2>
        {recs.isLoading && <LoadingState />}
        {recs.error && <ErrorState message={getErrorMessage(recs.error)} />}
        {recs.data && recs.data.items.length === 0 && (
          <EmptyState message="おすすめはまだありません。まずはコースに取り組みましょう。" />
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {recs.data?.items.map((r) => {
            const target = r.lesson_id
              ? `/lessons/${r.lesson_id}`
              : "/practice";
            return (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="badge bg-brand-50 text-brand-700">
                    {TYPE_LABEL[r.recommendation_type] ?? r.recommendation_type}
                  </span>
                  <span className="badge bg-slate-100 text-slate-500">
                    優先度 {Number(r.priority_score).toFixed(1)}
                  </span>
                </div>
                <div className="font-medium">{r.lesson_title ?? "生成問題"}</div>
                {r.reason && (
                  <p className="text-sm text-slate-600 mt-1">{r.reason}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Link to={target} className="btn-primary">
                    取り組む
                  </Link>
                  <button
                    className="btn-secondary"
                    onClick={() => dismiss.mutate(r.id)}
                    disabled={dismiss.isPending}
                  >
                    却下
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">苦手分野</h2>
        {weakness.isLoading && <LoadingState />}
        {weakness.error && <ErrorState message={getErrorMessage(weakness.error)} />}
        {weakness.data && weakness.data.items.length === 0 && (
          <EmptyState message="まだ十分なデータがありません" />
        )}
        {weakness.data && weakness.data.items.length > 0 && (
          <div className="card divide-y divide-slate-200">
            {weakness.data.items.map((w) => {
              const rate = Number(w.accuracy_rate);
              return (
                <div key={w.tag} className="p-4 flex items-center gap-4">
                  <div className="w-28 font-medium">{w.tag}</div>
                  <div className="flex-1">
                    <div className="h-2 bg-slate-100 rounded overflow-hidden">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(rate * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-slate-600 w-24 text-right">
                    正答率 {(rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-500 w-32 text-right">
                    {w.correct_count} / {w.total_attempts} 回
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
