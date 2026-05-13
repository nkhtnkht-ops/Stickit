import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await signInWithEmail(email);
    if (error) setError(error.message);
    else setSent(true);
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

      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-[380px] bg-surface border border-border rounded-lg shadow-lg p-8"
      >
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
          パスワード不要。ご登録メールにマジックリンクをお送りします。
        </p>

        {sent ? (
          <p className="text-[13px] text-ink-2">
            メールを確認してリンクをクリックしてください。
          </p>
        ) : (
          <>
            <label className="flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-wider text-ink-3 mb-1.5">
              → メールアドレス
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded text-[13px] bg-surface focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
            />
            <button
              type="submit"
              className="w-full mt-4 py-2.5 bg-ink text-white rounded font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              マジックリンクを送る <span className="font-mono">→</span>
            </button>
            {error && (
              <p className="mt-3 text-crit text-[12px]">{error}</p>
            )}
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 text-ink-4 font-mono text-[10.5px] mt-5">
          <span className="pulse-dot" /> 稼働中
        </div>
      </form>
    </div>
  );
}
