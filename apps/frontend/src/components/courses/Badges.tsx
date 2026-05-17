import clsx from "clsx";
import type { CourseCategory, CourseLevel, CourseStatus } from "@/types/catalog";
import {
  CATEGORY_BADGE_CLASS,
  CATEGORY_LABEL,
  LEVEL_BADGE_CLASS,
  LEVEL_LABEL,
  STATUS_BADGE_CLASS,
  STATUS_LABEL,
} from "./catalogStyles";

const BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";

export function CategoryBadge({ category }: { category: CourseCategory }) {
  return <span className={clsx(BASE, CATEGORY_BADGE_CLASS[category])}>{CATEGORY_LABEL[category]}</span>;
}

export function LevelBadge({ level }: { level: CourseLevel }) {
  return <span className={clsx(BASE, LEVEL_BADGE_CLASS[level])}>{LEVEL_LABEL[level]}</span>;
}

export function StatusBadge({ status }: { status: CourseStatus }) {
  if (status === "not-started") return null;
  const dot =
    status === "in-progress"
      ? "bg-blue-500 animate-pulse-soft"
      : status === "completed"
        ? "bg-emerald-500"
        : "bg-slate-400";
  return (
    <span className={clsx(BASE, STATUS_BADGE_CLASS[status], "gap-1.5")}>
      <span className={clsx("h-1.5 w-1.5 rounded-full", dot)} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
      #{children}
    </span>
  );
}
