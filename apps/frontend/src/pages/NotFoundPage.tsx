import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="min-h-full flex items-center justify-center py-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800">404</h1>
        <p className="mt-2 text-slate-600">お探しのページは見つかりませんでした。</p>
        <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
          ダッシュボードへ
        </Link>
      </div>
    </div>
  );
}
