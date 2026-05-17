import { NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "@/stores/auth";

type NavItem = {
  to: string;
  label: string;
  /** コーディングメニュー専用: AI予定バッジを表示 */
  withAiBadge?: boolean;
};

const NAV: NavItem[] = [
  { to: "/dashboard", label: "ダッシュボード" },
  { to: "/courses", label: "コース" },
  { to: "/practice", label: "コーディング", withAiBadge: true },
  // 「履歴」はメニューから非表示 (ルートは保持)
];

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-full flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <div className="font-semibold text-brand-700">Learning Platform</div>
          <nav className="flex gap-4 text-sm">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  clsx(
                    "relative inline-flex items-center gap-1.5 rounded px-2 py-1 transition",
                    isActive
                      ? n.withAiBadge
                        ? "text-white bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 shadow motion-safe:animate-neon"
                        : "text-brand-600 font-medium"
                      : "text-slate-600 hover:text-brand-600",
                  )
                }
              >
                <span>{n.label}</span>
                {n.withAiBadge && (
                  <span
                    aria-label="AIレビュー予定"
                    title="AIレビュー予定"
                    className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm motion-safe:animate-pulse-soft"
                  >
                    AI
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <button onClick={onLogout} className="ml-auto btn-secondary">
            ログアウト
          </button>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
