import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

/**
 * OAuth コールバック処理ページ。
 * URL に ?code=... (PKCE) または #access_token=... (implicit) が含まれる前提。
 * supabase-js の detectSessionInUrl=true がコード交換を非同期で行うので、
 * onAuthStateChange の SIGNED_IN を待ってから遷移する。
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    // パターン1: 既にセッションが確立済み (キャッシュ or 即時交換完了)
    supabase.auth.getSession().then(({ data }) => {
      if (done) return;
      if (data.session) {
        done = true;
        navigate("/today", { replace: true });
      }
    });

    // パターン2: 非同期で SIGNED_IN を待つ
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (done) return;
      if (event === "SIGNED_IN" && session) {
        done = true;
        navigate("/today", { replace: true });
      }
    });

    // タイムアウト: 8秒待っても確立しなければエラー画面
    const timeout = setTimeout(() => {
      if (done) return;
      done = true;
      setError("認証の処理がタイムアウトしました。もう一度お試しください。");
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    }, 8000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen grid place-items-center p-4">
        <div className="text-center">
          <div className="font-mono text-[12.5px] text-crit mb-2">// auth error</div>
          <p className="text-[14.5px] text-ink-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="pulse-dot" />
          <span className="font-mono text-[12.5px] text-ink-3">// signing in…</span>
        </div>
        <p className="text-[14.5px] text-ink-3">Google アカウントで認証中</p>
      </div>
    </div>
  );
}
