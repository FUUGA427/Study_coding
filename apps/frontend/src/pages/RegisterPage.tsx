import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { getErrorMessage } from "@/lib/api";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setTokens = useAuthStore((s) => s.setTokens);
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tokens = await register({ email, username, password });
      setTokens(tokens.access_token, tokens.refresh_token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center px-4 py-12">
      <form onSubmit={onSubmit} className="card p-8 w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">新規登録</h1>
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
          <label className="label" htmlFor="username">ユーザー名</label>
          <input
            id="username"
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={2}
            maxLength={100}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">パスワード（8文字以上）</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "登録中..." : "登録"}
        </button>
        <p className="text-sm text-center text-slate-600">
          既にアカウントをお持ちの方は{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            ログイン
          </Link>
        </p>
      </form>
    </div>
  );
}
