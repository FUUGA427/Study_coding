import clsx from "clsx";

export type CourseStats = {
  inProgressCount: number;
  completedCount: number;
  totalQuestions: number;
  totalHours: number;
};

type Item = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  accent: string;
};

function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}分`;
  const h = Math.floor(hours);
  const rem = Math.round((hours - h) * 60);
  return rem === 0 ? `${h}h` : `${h}h${rem}m`;
}

export function CourseStatsHeader({ stats }: { stats: CourseStats }) {
  const items: Item[] = [
    {
      label: "学習中",
      value: `${stats.inProgressCount}`,
      hint: "コース",
      icon: "🚀",
      accent: "from-blue-50 to-indigo-50 text-indigo-700 border-indigo-100",
    },
    {
      label: "完了",
      value: `${stats.completedCount}`,
      hint: "コース",
      icon: "🏆",
      accent: "from-emerald-50 to-teal-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "総問題数",
      value: `${stats.totalQuestions}`,
      hint: "問",
      icon: "❓",
      accent: "from-amber-50 to-orange-50 text-amber-800 border-amber-100",
    },
    {
      label: "学習時間目安",
      value: formatHours(stats.totalHours),
      icon: "⏱️",
      accent: "from-pink-50 to-rose-50 text-rose-700 border-rose-100",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={it.label}
          className={clsx(
            "card-soft border bg-gradient-to-br p-4 motion-safe:animate-fade-up",
            it.accent,
          )}
          style={{ animationDelay: `${120 + i * 70}ms` }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium opacity-80">{it.label}</span>
            <span className="text-lg leading-none">{it.icon}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight">{it.value}</span>
            {it.hint && <span className="text-xs opacity-70">{it.hint}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
