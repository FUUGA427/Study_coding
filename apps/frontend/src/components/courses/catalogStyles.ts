import type { CourseCategory, CourseLevel, CourseStatus } from "@/types/catalog";

export const CATEGORY_LABEL: Record<CourseCategory, string> = {
  frontend: "フロントエンド",
  backend: "バックエンド",
  ai: "AI",
  database: "データベース",
  infra: "インフラ",
  testing: "テスト",
  practice: "実践",
};

export const CATEGORY_BADGE_CLASS: Record<CourseCategory, string> = {
  frontend: "bg-pink-100 text-pink-700 ring-1 ring-pink-200",
  backend: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  ai: "bg-gradient-to-r from-purple-100 to-cyan-100 text-purple-700 ring-1 ring-purple-200",
  database: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  infra: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
  testing: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  practice: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

export const CATEGORY_ACCENT_CLASS: Record<CourseCategory, string> = {
  frontend: "from-pink-400 to-fuchsia-500",
  backend: "from-indigo-400 to-blue-600",
  ai: "from-purple-500 via-fuchsia-500 to-cyan-400",
  database: "from-emerald-400 to-teal-500",
  infra: "from-sky-400 to-indigo-500",
  testing: "from-amber-400 to-orange-500",
  practice: "from-rose-400 to-red-500",
};

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  beginner: "初級",
  intermediate: "中級",
  advanced: "上級",
};

export const LEVEL_BADGE_CLASS: Record<CourseLevel, string> = {
  beginner: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  intermediate: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  advanced: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

export const STATUS_LABEL: Record<CourseStatus, string> = {
  locked: "ロック中",
  "not-started": "未着手",
  "in-progress": "学習中",
  completed: "完了",
};

export const STATUS_BADGE_CLASS: Record<CourseStatus, string> = {
  locked: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  "not-started": "bg-slate-50 text-slate-600 ring-1 ring-slate-200",
  "in-progress": "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  completed: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

export const CATEGORY_FILTER_OPTIONS: Array<{ value: CourseCategory | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "frontend", label: CATEGORY_LABEL.frontend },
  { value: "backend", label: CATEGORY_LABEL.backend },
  { value: "ai", label: CATEGORY_LABEL.ai },
  { value: "database", label: CATEGORY_LABEL.database },
  { value: "infra", label: CATEGORY_LABEL.infra },
  { value: "testing", label: CATEGORY_LABEL.testing },
  { value: "practice", label: CATEGORY_LABEL.practice },
];

export const LEVEL_FILTER_OPTIONS: Array<{ value: CourseLevel | "all"; label: string }> = [
  { value: "all", label: "すべて" },
  { value: "beginner", label: LEVEL_LABEL.beginner },
  { value: "intermediate", label: LEVEL_LABEL.intermediate },
  { value: "advanced", label: LEVEL_LABEL.advanced },
];
