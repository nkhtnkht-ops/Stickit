import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onClickGoogle = async () => {
    setError(null);
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setBusy(false);
    }
    // 成功時はGoogleにリダイレクトされるので busy のまま
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 relative overflow-hidden">
      {/* グラデーショングロー */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, #DCFCE7 0%, transparent 40%), radial-gradient(circle at 80% 100%, #DBEAFE 0%, transparent 40%)",
        }}
      />
      {/* グリッド背景 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(#EFEFEF 1px, transparent 1px), linear-gradient(90deg, #EFEFEF 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(circle at 50% 50%, #000 20%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(circle at 50% 50%, #000 20%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[380px] bg-surface border border-border rounded-lg shadow-lg p-8">
        {/* ブランド */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-[26px] h-[26px] rounded-md bg-ink text-accent grid place-items-center font-mono font-semibold text-[13px] relative">
            S
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border-2 border-surface" />
          </div>
          <span className="font-semibold text-[15px] tracking-tightish">
            Stickit
          </span>
          <span className="ml-auto font-mono text-[10px] text-ink-4 bg-bg px-1.5 py-px rounded">
            v0.1
          </span>
        </div>

        <h1 className="text-[22px] font-semibold tracking-[-0.025em] leading-tight">
          サインイン
        </h1>
        <p className="text-ink-3 text-[13px] mt-1 mb-6">
          Google アカウントでサインインしてください。パスワード不要、1クリックです。
        </p>

        <button
          type="button"
          onClick={onClickGoogle}
          disabled={busy}
          className="w-full py-3 bg-surface border border-border rounded font-medium text-[14px] text-ink flex items-center justify-center gap-3 hover:bg-bg-2 hover:border-ink-5 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {/* Google G ロゴ */}
          <svg className="w-[18px] h-[18px]" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          {busy ? "リダイレクト中…" : "Google でサインイン"}
        </button>

        {error && (
          <p className="mt-3 text-crit text-[12px]">{error}</p>
        )}

        <div className="flex items-center justify-center gap-1.5 text-ink-4 font-mono text-[10.5px] mt-5">
          <span className="pulse-dot" /> 稼働中
        </div>
      </div>
    </div>
  );
}
