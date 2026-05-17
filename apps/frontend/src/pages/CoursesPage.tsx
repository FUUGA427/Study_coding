import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/LoadingState";
import { getErrorMessage } from "@/lib/api";
import { fetchCourseCatalog } from "@/data/catalog";
import { CourseCard } from "@/components/courses/CourseCard";
import {
  CourseFilters,
  type CategoryFilter,
  type LevelFilter,
} from "@/components/courses/CourseFilters";
import {
  CourseStatsHeader,
  type CourseStats,
} from "@/components/courses/CourseStatsHeader";

const CATALOG_QUERY_KEY = ["catalog", "courses"] as const;

export function CoursesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: CATALOG_QUERY_KEY,
    queryFn: fetchCourseCatalog,
  });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("all");

  const courses = data?.courses ?? [];

  const stats: CourseStats = useMemo(() => {
    return {
      inProgressCount: courses.filter((c) => c.status === "in-progress").length,
      completedCount: courses.filter((c) => c.status === "completed").length,
      totalQuestions: courses.reduce((acc, c) => acc + c.questionCount, 0),
      totalHours: courses.reduce((acc, c) => acc + c.estimatedHours, 0),
    };
  }, [courses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return courses.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (level !== "all" && c.level !== level) return false;
      if (q) {
        const haystack = `${c.title} ${c.description} ${c.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [courses, category, level, search]);

  const filtersActive = search.trim() !== "" || category !== "all" || level !== "all";

  return (
    <div className="catalog-bg -mx-4 -my-6 min-h-[calc(100vh-3.5rem)] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="motion-safe:animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            コースを選んで学習を始めよう
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            フロントエンド、バックエンド、AI、インフラまで楽しく学べます
          </p>
        </header>

        {isLoading && <LoadingState />}
        {error && <ErrorState message={getErrorMessage(error)} />}

        {!isLoading && !error && (
          <>
            <CourseStatsHeader stats={stats} />

            <CourseFilters
              search={search}
              onSearchChange={setSearch}
              category={category}
              onCategoryChange={setCategory}
              level={level}
              onLevelChange={setLevel}
            />

            <div
              key={`${category}-${level}-${search}`}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((course, i) => (
                <CourseCard key={course.id} course={course} index={i} />
              ))}
            </div>

            {filtered.length === 0 &&
              (filtersActive ? (
                <EmptyState message="条件に一致するコースが見つかりませんでした。フィルターを変えてみてください。" />
              ) : (
                <EmptyState message="コースがまだありません" />
              ))}
          </>
        )}
      </div>
    </div>
  );
}
