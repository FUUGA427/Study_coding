import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { fetchCatalogCourse } from "@/data/catalog";
import { EmptyState, LoadingState } from "@/components/common/LoadingState";
import { QuestionItem } from "@/components/courses/QuestionItem";
import { CategoryBadge, LevelBadge, StatusBadge, TagPill } from "@/components/courses/Badges";
import { CATEGORY_ACCENT_CLASS } from "@/components/courses/catalogStyles";

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分`;
  const h = Math.floor(hours);
  const rem = Math.round((hours - h) * 60);
  return rem === 0 ? `${h}時間` : `${h}時間${rem}分`;
}

export function CatalogCoursePage() {
  const { courseId = "" } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["catalog", "course", courseId],
    queryFn: () => fetchCatalogCourse(courseId),
    enabled: !!courseId,
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) return <LoadingState />;
  if (!data) {
    return (
      <div className="space-y-4">
        <EmptyState message="このコースは見つかりませんでした。" />
        <div className="text-center">
          <Link to="/courses" className="text-sm text-brand-600 hover:underline">
            ← コース一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  const lesson = data.lessons[0];
  const questions = lesson?.questions ?? [];
  const total = questions.length;
  const progressPct = total === 0 ? 0 : Math.round((currentIndex / total) * 100);
  const done = currentIndex >= total;
  const currentQuestion = !done ? questions[currentIndex] : null;

  const handleAdvance = () => setCurrentIndex((i) => i + 1);
  const handleRestart = () => setCurrentIndex(0);

  return (
    <div className="catalog-bg -mx-4 -my-6 min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="motion-safe:animate-fade-up">
          <Link to="/courses" className="text-sm text-slate-500 hover:text-brand-600">
            ← コース一覧
          </Link>
        </div>

        <header
          className={clsx(
            "relative overflow-hidden rounded-3xl p-6 text-white shadow-sm",
            "bg-gradient-to-br motion-safe:animate-fade-up",
            CATEGORY_ACCENT_CLASS[data.category],
          )}
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div
                aria-hidden
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-3xl backdrop-blur"
              >
                {data.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.title}</h1>
                <p className="mt-1 max-w-xl text-sm text-white/90">{data.description}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                    {data.lessonCount} レッスン
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                    {data.questionCount} 問
                  </span>
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur">
                    目安 {formatHours(data.estimatedHours)}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={data.category} />
              <LevelBadge level={data.level} />
              <StatusBadge status={data.status} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {data.tags.map((t) => (
              <TagPill key={t}>{t}</TagPill>
            ))}
          </div>
        </header>

        {lesson && (
          <section
            className="motion-safe:animate-fade-up"
            style={{ animationDelay: "150ms" }}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{lesson.title}</h2>
              <span className="text-xs text-slate-500">
                {done ? `${total} / ${total} 完了` : `進行中: ${currentIndex + 1} / ${total}`}
              </span>
            </div>

            <div
              role="progressbar"
              aria-valuenow={done ? 100 : progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200"
            >
              <div
                className={clsx(
                  "h-full bg-gradient-to-r transition-all duration-500 ease-out",
                  CATEGORY_ACCENT_CLASS[data.category],
                )}
                style={{ width: `${done ? 100 : progressPct}%` }}
              />
            </div>

            {currentQuestion && (
              <div key={currentQuestion.id} className="motion-safe:animate-fade-up">
                <QuestionItem
                  index={currentIndex}
                  total={total}
                  question={currentQuestion}
                  onAdvance={handleAdvance}
                />
              </div>
            )}

            {done && (
              <CompletionPanel
                courseTitle={data.title}
                total={total}
                onRestart={handleRestart}
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function CompletionPanel({
  courseTitle,
  total,
  onRestart,
}: {
  courseTitle: string;
  total: number;
  onRestart: () => void;
}) {
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center shadow-sm motion-safe:animate-pop">
      <div className="text-5xl">🎉</div>
      <h3 className="mt-2 text-xl font-bold text-emerald-800">コース完走!</h3>
      <p className="mt-1 text-sm text-emerald-700">
        「{courseTitle}」の全 {total} 問を終えました。お疲れさまでした。
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
        >
          もう一度はじめから
        </button>
        <Link
          to="/courses"
          className="rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          コース一覧に戻る
        </Link>
      </div>
    </div>
  );
}
