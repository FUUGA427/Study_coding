import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { listLessons } from "@/api/courses";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "易",
  medium: "中",
  hard: "難",
};

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  not_started: "bg-slate-100 text-slate-500",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function CourseLessonsPage() {
  const { courseId = "" } = useParams();
  const isUuid = !!courseId && UUID_RE.test(courseId);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.lessons(courseId),
    queryFn: () => listLessons(courseId),
    enabled: isUuid,
  });

  // UUID形式じゃないIDは backend に投げると 404 になるダミーカタログのIDなので
  // 新ルート (/catalog/courses/:courseId) に転送する。古いタブやブックマーク向けの保険。
  if (courseId && !isUuid) {
    return <Navigate to={`/catalog/courses/${courseId}`} replace />;
  }

  return (
    <div>
      <PageHeader title="レッスン一覧" description="順番にレッスンを進めましょう。" />
      {isLoading && <LoadingState />}
      {error && <ErrorState message={getErrorMessage(error)} />}
      {data && data.lessons.length === 0 && <EmptyState message="レッスンがありません" />}
      <ul className="space-y-3">
        {data?.lessons.map((l) => {
          const p = data.progress[l.id];
          const status = p?.status ?? "not_started";
          return (
            <li key={l.id}>
              <Link
                to={`/lessons/${l.id}`}
                className="card p-4 flex items-center gap-4 hover:border-brand-500 hover:shadow"
              >
                <span className="w-8 h-8 rounded-full bg-brand-50 text-brand-700 text-sm flex items-center justify-center font-semibold">
                  {l.sort_order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{l.title}</div>
                  {l.description && (
                    <div className="text-sm text-slate-500 truncate">{l.description}</div>
                  )}
                  <div className="flex gap-1 flex-wrap mt-1">
                    {l.tags.map((t) => (
                      <span key={t} className="badge bg-slate-100 text-slate-600">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="badge bg-slate-100 text-slate-600">{l.lesson_type}</span>
                <span className="badge bg-slate-100 text-slate-600">
                  {DIFFICULTY_LABEL[l.difficulty] ?? l.difficulty}
                </span>
                <span className={clsx("badge", STATUS_STYLE[status] ?? STATUS_STYLE.not_started)}>
                  {p ? `${p.best_score}/${l.max_score}点` : "未着手"}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
