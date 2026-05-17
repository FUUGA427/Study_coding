import { FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { guestLogin, login } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { getErrorMessage } from "@/lib/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tokens = await login({ email, password });
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">ログイン</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div>
          <label className="label" htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "ログイン中..." : "ログイン"}
        </button>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200" />
          または
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          className="btn-secondary w-full"
          disabled={submitting}
          onClick={async () => {
            setError(null);
            setSubmitting(true);
            try {
              const tokens = await guestLogin();
              setTokens(tokens.access_token, tokens.refresh_token);
              navigate(from, { replace: true });
            } catch (err) {
              setError(getErrorMessage(err));
            } finally {
              setSubmitting(false);
            }
          }}
        >
          ゲストとして使用（試用）
        </button>
        <p className="text-xs text-center text-slate-500 -mt-2">
          登録不要で全機能を試せます。学習データは一時的に保存されます。
        </p>

        <p className="text-sm text-center text-slate-600">
          アカウントがない方は{" "}
          <Link to="/register" className="text-brand-600 hover:underline">
            新規登録
          </Link>
        </p>
      </form>
    </div>
  );
}
