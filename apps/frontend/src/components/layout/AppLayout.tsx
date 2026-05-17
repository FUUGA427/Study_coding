import { NavLink, Outlet, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuthStore } from "@/stores/auth";

const NAV = [
  { to: "/dashboard", label: "ダッシュボード" },
  { to: "/courses", label: "コース" },
  { to: "/practice", label: "練習問題" },
  { to: "/history", label: "履歴" },
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
                    "px-2 py-1 rounded hover:text-brand-600",
                    isActive ? "text-brand-600 font-medium" : "text-slate-600",
                  )
                }
              >
                {n.label}
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
