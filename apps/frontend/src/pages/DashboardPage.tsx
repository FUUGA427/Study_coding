import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import {
  dismissRecommendation,
  getRecommendations,
  getWeaknessProfile,
} from "@/api/recommendations";
import { queryKeys } from "@/lib/queryKeys";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";
import { fetchCourseCatalog } from "@/data/catalog";
import { CATEGORY_ACCENT_CLASS } from "@/components/courses/catalogStyles";
import { CategoryBadge, LevelBadge } from "@/components/courses/Badges";

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
  const catalog = useQuery({
    queryKey: ["catalog", "courses"],
    queryFn: fetchCourseCatalog,
  });

  const dismiss = useMutation({
    mutationFn: dismissRecommendation,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.recommendations(null) }),
  });

  const allCourses = catalog.data?.courses ?? [];
  const inProgressCourses = allCourses.filter((c) => c.status === "in-progress");
  const completedCourses = allCourses.filter((c) => c.status === "completed");
  const reviewCourses = [...inProgressCourses, ...completedCourses].slice(0, 6);

  const totalQuestions = allCourses.reduce((acc, c) => acc + c.questionCount, 0);

  return (
    <div className="catalog-bg -mx-4 -my-6 min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="motion-safe:animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            おかえりなさい 👋
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            今日も少しずつ前に進みましょう。
          </p>
        </header>

        {/* Quick stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="学習中"
            value={`${inProgressCourses.length}`}
            hint="コース"
            icon="🚀"
            accent="from-blue-50 to-indigo-50 text-indigo-700 border-indigo-100"
            delay={120}
          />
          <StatCard
            label="完了"
            value={`${completedCourses.length}`}
            hint="コース"
            icon="🏆"
            accent="from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100"
            delay={190}
          />
          <StatCard
            label="総問題数"
            value={`${totalQuestions}`}
            hint="問"
            icon="❓"
            accent="from-amber-50 to-orange-50 text-amber-800 border-amber-100"
            delay={260}
          />
          <StatCard
            label="コース総数"
            value={`${allCourses.length}`}
            hint="コース"
            icon="📚"
            accent="from-pink-50 to-rose-50 text-rose-700 border-rose-100"
            delay={330}
          />
        </section>

        {/* 再度学習 */}
        <section className="motion-safe:animate-fade-up" style={{ animationDelay: "400ms" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-slate-900">🔁 再度学習</h2>
            <Link to="/courses" className="text-xs text-brand-600 hover:underline">
              すべてのコース →
            </Link>
          </div>
          {catalog.isLoading && <LoadingState />}
          {reviewCourses.length === 0 && !catalog.isLoading && (
            <EmptyState message="学習中または完了したコースがまだありません。まずはコース一覧から始めましょう。" />
          )}
          {reviewCourses.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reviewCourses.map((c) => (
                <Link
                  key={c.id}
                  to={`/catalog/courses/${c.id}`}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition motion-safe:hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div
                    aria-hidden
                    className={clsx(
                      "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                      CATEGORY_ACCENT_CLASS[c.category],
                    )}
                  />
                  <div className="flex items-start gap-3">
                    <div
                      aria-hidden
                      className={clsx(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white bg-gradient-to-br",
                        CATEGORY_ACCENT_CLASS[c.category],
                      )}
                    >
                      {c.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {c.title}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <CategoryBadge category={c.category} />
                        <LevelBadge level={c.level} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {c.status === "completed" ? "完了済 — もう一度" : "続きから"}
                      </span>
                      <span className="font-medium text-slate-700">{c.progress}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={clsx(
                          "h-full bg-gradient-to-r",
                          CATEGORY_ACCENT_CLASS[c.category],
                        )}
                        style={{ width: `${c.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* おすすめの学習 */}
        <section className="motion-safe:animate-fade-up" style={{ animationDelay: "480ms" }}>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">✨ おすすめの学習</h2>
          {recs.isLoading && <LoadingState />}
          {recs.error && <ErrorState message={getErrorMessage(recs.error)} />}
          {recs.data && recs.data.items.length === 0 && (
            <EmptyState message="おすすめはまだありません。まずはコースに取り組みましょう。" />
          )}
          {recs.data && recs.data.items.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {recs.data.items.map((r) => {
                const target = r.lesson_id ? `/lessons/${r.lesson_id}` : "/practice";
                return (
                  <div
                    key={r.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="badge bg-brand-50 text-brand-700">
                        {TYPE_LABEL[r.recommendation_type] ?? r.recommendation_type}
                      </span>
                      <span className="badge bg-slate-100 text-slate-500">
                        優先度 {Number(r.priority_score).toFixed(1)}
                      </span>
                    </div>
                    <div className="font-medium text-slate-900">{r.lesson_title ?? "生成問題"}</div>
                    {r.reason && (
                      <p className="mt-1 text-sm text-slate-600">{r.reason}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Link
                        to={target}
                        className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-600"
                      >
                        取り組む
                      </Link>
                      <button
                        type="button"
                        className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
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
          )}
        </section>

        {/* 苦手分野 */}
        <section className="motion-safe:animate-fade-up" style={{ animationDelay: "560ms" }}>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">🎯 苦手分野</h2>
          {weakness.isLoading && <LoadingState />}
          {weakness.error && <ErrorState message={getErrorMessage(weakness.error)} />}
          {weakness.data && weakness.data.items.length === 0 && (
            <EmptyState message="まだ十分なデータがありません" />
          )}
          {weakness.data && weakness.data.items.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white divide-y divide-slate-200">
              {weakness.data.items.map((w) => {
                const rate = Number(w.accuracy_rate);
                return (
                  <div key={w.tag} className="flex items-center gap-4 p-4">
                    <div className="w-28 font-medium text-slate-900">{w.tag}</div>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                          style={{ width: `${Math.min(rate * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-24 text-right text-sm text-slate-600">
                      正答率 {(rate * 100).toFixed(0)}%
                    </div>
                    <div className="w-32 text-right text-sm text-slate-500">
                      {w.correct_count} / {w.total_attempts} 回
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  delay,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className={clsx("card-soft border bg-gradient-to-br p-4 motion-safe:animate-fade-up", accent)}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium opacity-80">{label}</span>
        <span className="text-lg leading-none">{icon}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {hint && <span className="text-xs opacity-70">{hint}</span>}
      </div>
    </div>
  );
}
