import { Navigate, useLocation } from "react-router-dom";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { guestLogin } from "@/api/auth";

const DEV_AUTO_GUEST = import.meta.env.VITE_DEV_AUTO_GUEST === "true";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = useAuthStore((s) => s.accessToken);
  const setTokens = useAuthStore((s) => s.setTokens);
  const location = useLocation();
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);
  const triggered = useRef(false);

  useEffect(() => {
    if (token || !DEV_AUTO_GUEST || triggered.current) return;
    triggered.current = true;
    guestLogin()
      .then((tokens) => setTokens(tokens.access_token, tokens.refresh_token))
      .catch(() => setAutoLoginFailed(true));
  }, [token, setTokens]);

  if (!token) {
    if (DEV_AUTO_GUEST && !autoLoginFailed) {
      return (
        <div className="min-h-full flex items-center justify-center p-8 text-slate-500">
          ゲストとして接続中...
        </div>
      );
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
