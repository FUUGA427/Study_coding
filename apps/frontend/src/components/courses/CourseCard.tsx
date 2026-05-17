import { Link } from "react-router-dom";
import clsx from "clsx";
import type { Course } from "@/types/catalog";
import { CategoryBadge, LevelBadge, StatusBadge, TagPill } from "./Badges";
import { CATEGORY_ACCENT_CLASS, STATUS_LABEL } from "./catalogStyles";

type Props = {
  course: Course;
  index: number;
};

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分`;
  const h = Math.floor(hours);
  const rem = Math.round((hours - h) * 60);
  return rem === 0 ? `${h}時間` : `${h}時間${rem}分`;
}

function actionLabel(course: Course): string {
  if (course.isLocked) return "ロック中";
  if (course.status === "in-progress") return "学習を続ける";
  if (course.status === "completed") return "もう一度学習";
  return "学習を始める";
}

export function CourseCard({ course, index }: Props) {
  const locked = course.isLocked;
  const inProgress = course.status === "in-progress";
  const completed = course.status === "completed";
  const pct = Math.max(0, Math.min(100, course.progress));

  const body = (
    <article
      aria-disabled={locked || undefined}
      className={clsx(
        "course-card relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 transition",
        "border-slate-200 shadow-sm",
        !locked &&
          "motion-safe:hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 cursor-pointer",
        locked && "opacity-60 grayscale-[20%] cursor-not-allowed",
        inProgress && !locked && "ring-1 ring-blue-200 course-card-glow",
      )}
    >
      <div
        aria-hidden
        className={clsx(
          "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
          CATEGORY_ACCENT_CLASS[course.category],
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div
          aria-hidden
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl text-white bg-gradient-to-br shadow-sm",
            CATEGORY_ACCENT_CLASS[course.category],
          )}
        >
          {course.icon}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <LevelBadge level={course.level} />
          <CategoryBadge category={course.category} />
        </div>
      </div>

      <h2 className="mt-3 text-lg font-semibold text-slate-900">{course.title}</h2>
      <p className="mt-1 text-sm text-slate-600 line-clamp-2">{course.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {course.tags.map((t) => (
          <TagPill key={t}>{t}</TagPill>
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-500">
        <div className="rounded-lg bg-slate-50 py-1.5">
          <dt>レッスン</dt>
          <dd className="text-sm font-semibold text-slate-800">{course.lessonCount}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 py-1.5">
          <dt>問題</dt>
          <dd className="text-sm font-semibold text-slate-800">{course.questionCount}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 py-1.5">
          <dt>目安</dt>
          <dd className="text-sm font-semibold text-slate-800">
            {formatHours(course.estimatedHours)}
          </dd>
        </div>
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>進捗</span>
          <span className="font-medium text-slate-700">{pct}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"
        >
          <div
            className={clsx(
              "h-full bg-gradient-to-r motion-safe:animate-grow-x origin-left",
              CATEGORY_ACCENT_CLASS[course.category],
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <StatusBadge status={course.status} />
        <span
          className={clsx(
            "rounded-full px-3 py-1.5 text-xs font-semibold transition",
            !locked && "motion-safe:group-hover:scale-105",
            locked
              ? "bg-slate-100 text-slate-500"
              : completed
                ? "bg-emerald-500 text-white"
                : "bg-brand-500 text-white",
          )}
          aria-label={actionLabel(course)}
        >
          {actionLabel(course)} {locked ? "🔒" : "→"}
        </span>
      </div>

      {completed && (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-2 -top-2 select-none text-3xl motion-safe:animate-pop"
          title="完了!"
        >
          🏅
        </div>
      )}
    </article>
  );

  const wrapperClass = "group block h-full motion-safe:animate-fade-up";
  const style = { animationDelay: `${200 + index * 60}ms` };

  if (locked) {
    return (
      <div
        className={wrapperClass}
        style={style}
        title={`このコースは ${STATUS_LABEL.locked} です`}
        aria-disabled
      >
        {body}
      </div>
    );
  }

  return (
    <Link to={`/catalog/courses/${course.id}`} className={wrapperClass} style={style}>
      {body}
    </Link>
  );
}
