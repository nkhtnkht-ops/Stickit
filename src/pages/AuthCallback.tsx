import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  useEffect(() => {
    if (!loading) navigate(session ? "/today" : "/login", { replace: true });
  }, [session, loading, navigate]);
  return (
    <div className="p-8 font-mono text-xs text-ink-3">// signing in…</div>
  );
}
