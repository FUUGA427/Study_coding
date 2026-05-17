import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listCourses } from "@/api/courses";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";
import clsx from "clsx";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

export function CoursesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.courses,
    queryFn: listCourses,
  });

  return (
    <div>
      <PageHeader
        title="コース一覧"
        description="初級から順番に学習を進めましょう。前提コースを完了すると次が解放されます。"
      />
      {isLoading && <LoadingState />}
      {error && <ErrorState message={getErrorMessage(error)} />}
      {data && data.courses.length === 0 && <EmptyState message="コースがまだありません" />}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.courses.map((c) => {
          const pct = Number(c.progress_pct);
          const content = (
            <div
              className={clsx(
                "card p-5 h-full transition",
                c.is_unlocked ? "hover:border-brand-500 hover:shadow" : "opacity-60",
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="badge bg-brand-50 text-brand-700">
                  {LEVEL_LABEL[c.level] ?? c.level}
                </span>
                {!c.is_unlocked && (
                  <span className="badge bg-slate-100 text-slate-500">ロック中</span>
                )}
                {c.progress_status === "completed" && (
                  <span className="badge bg-emerald-100 text-emerald-700">完了</span>
                )}
              </div>
              <h2 className="text-lg font-semibold">{c.title}</h2>
              <p className="text-sm text-slate-600 mt-1 line-clamp-3">{c.description}</p>
              <div className="mt-4">
                <div className="h-2 bg-slate-100 rounded overflow-hidden">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">進捗 {pct.toFixed(1)}%</div>
              </div>
            </div>
          );
          return c.is_unlocked ? (
            <Link key={c.id} to={`/courses/${c.id}`} className="block">
              {content}
            </Link>
          ) : (
            <div key={c.id}>{content}</div>
          );
        })}
      </div>
    </div>
  );
}
