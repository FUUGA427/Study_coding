import clsx from "clsx";
import type { CourseCategory, CourseLevel } from "@/types/catalog";
import {
  CATEGORY_FILTER_OPTIONS,
  LEVEL_FILTER_OPTIONS,
} from "./catalogStyles";

export type CategoryFilter = CourseCategory | "all";
export type LevelFilter = CourseLevel | "all";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  category: CategoryFilter;
  onCategoryChange: (v: CategoryFilter) => void;
  level: LevelFilter;
  onLevelChange: (v: LevelFilter) => void;
};

function ChipGroup<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={ariaLabel}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={selected}
            className={clsx(
              "rounded-full px-3 py-1 text-xs font-medium transition motion-safe:hover:-translate-y-0.5",
              selected
                ? "bg-brand-500 text-white shadow-sm"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function CourseFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  level,
  onLevelChange,
}: Props) {
  return (
    <div
      className="card-soft bg-white/80 backdrop-blur p-4 space-y-3 motion-safe:animate-fade-up"
      style={{ animationDelay: "100ms" }}
    >
      <div className="relative">
        <label htmlFor="course-search" className="sr-only">
          コース検索
        </label>
        <input
          id="course-search"
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="コース名・説明・タグで検索..."
          className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          🔍
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 w-16 shrink-0">カテゴリ</span>
          <ChipGroup
            value={category}
            options={CATEGORY_FILTER_OPTIONS}
            onChange={onCategoryChange}
            ariaLabel="カテゴリで絞り込み"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 w-16 shrink-0">レベル</span>
          <ChipGroup
            value={level}
            options={LEVEL_FILTER_OPTIONS}
            onChange={onLevelChange}
            ariaLabel="レベルで絞り込み"
          />
        </div>
      </div>
    </div>
  );
}
