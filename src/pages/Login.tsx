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
  };

  return (
    <>
      <div className="gradient-bg" />
      <div className="relative h-screen grid place-items-center p-5 overflow-hidden">
        {/* Decorative floating cards */}
        <FloatChip className="left-[8%] top-[14%] -rotate-6" dot="#7BC4E0" title="朝礼 8:30" sub="支配人業務 · 今日" />
        <FloatNote className="right-[10%] top-[22%] rotate-[5deg]" tint={{ bg: "#C9F0DA", fg: "#1F5A3A" }} meta="付箋 · OTA戦略" title={"価格差500円検証\n来週月曜まで"} />
        <FloatChip className="left-[12%] bottom-[18%] rotate-[4deg]" dot="#E47B9F" title="キャプテンカップ準備" sub="5/20 · あと5日" />
        <FloatNote className="right-[8%] bottom-[14%] -rotate-[7deg]" tint={{ bg: "#FCEEB7", fg: "#6F5210" }} meta="繰り返し · 月次" title={"RM分析\n月初3営業日以内"} />
        <FloatChip className="left-[4%] top-1/2 -translate-y-1/2 -rotate-[3deg]" dot="#80C99A" title="完了 · 12件" sub="今日のタスク" />

        {/* Auth card */}
        <div
          className="relative w-full max-w-[420px] text-center"
          style={{
            background: "rgba(255,255,255,.95)",
            border: "1px solid rgba(255,255,255,.55)",
            borderRadius: 22,
            padding: "36px 36px 28px",
            boxShadow: "0 24px 64px rgba(70,40,140,.18), 0 4px 12px rgba(70,40,140,.06)",
            zIndex: 1,
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl text-white grid place-items-center mx-auto mb-4 font-display font-bold"
            style={{
              background: "linear-gradient(135deg, #7B5BFF, #5A3FD9)",
              fontSize: 26,
              letterSpacing: "-0.02em",
              boxShadow: "0 8px 24px rgba(123,91,255,.35)",
            }}
          >
            S
          </div>
          <h1 className="font-display font-semibold text-ink mb-1.5" style={{ fontSize: 28, letterSpacing: "-0.022em" }}>
            Stickit
          </h1>
          <p className="text-[13px] text-ink-3 mb-7">タスク・カレンダー・付箋を、ひとつに。</p>

          <button
            type="button"
            onClick={onClickGoogle}
            disabled={busy}
            className="w-full h-12 rounded-md bg-white inline-flex items-center justify-center gap-3 font-medium transition-all disabled:opacity-60"
            style={{
              border: "1px solid rgba(0,0,0,.10)",
              boxShadow: "0 2px 8px rgba(0,0,0,.06)",
              color: "#3C4043",
              fontSize: 15,
              letterSpacing: "-0.012em",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,.10)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,.06)";
            }}
          >
            <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.46-.81 5.95-2.18l-2.9-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            {busy ? "リダイレクト中…" : "Google で続行"}
          </button>

          {error && <p className="mt-3 text-crit text-[13px]">{error}</p>}

          <div
            className="flex items-center gap-3 my-5 text-[11px] text-ink-3 uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            <span className="flex-1 h-px" style={{ background: "rgba(0,0,0,.06)" }} />
            <span>できること</span>
            <span className="flex-1 h-px" style={{ background: "rgba(0,0,0,.06)" }} />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Feature
              ic={<svg className="w-4 h-4 stroke-current fill-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
              title="タスク"
              sub="期限・繰り返し"
            />
            <Feature
              ic={<svg className="w-4 h-4 stroke-current fill-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>}
              title="カレンダー"
              sub="月 / 週 / 日"
            />
            <Feature
              ic={<svg className="w-4 h-4 stroke-current fill-none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/></svg>}
              title="付箋"
              sub="カンバン形式"
            />
          </div>

          <p className="mt-5 text-[11px] text-ink-3 leading-relaxed">
            続行することで <span className="text-primary-deep font-medium">利用規約</span> と{" "}
            <span className="text-primary-deep font-medium">プライバシーポリシー</span> に同意したものとみなされます。
          </p>
        </div>
      </div>
    </>
  );
}

function FloatChip({
  className,
  dot,
  title,
  sub,
}: {
  className?: string;
  dot: string;
  title: string;
  sub: string;
}) {
  return (
    <div
      className={`absolute pointer-events-none ${className ?? ""}`}
      style={{
        background: "rgba(255,255,255,.85)",
        border: "1px solid rgba(255,255,255,.55)",
        borderRadius: 14,
        padding: "12px 14px",
        boxShadow: "0 8px 32px rgba(70,40,140,.10)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dot }} />
      <div>
        <div className="text-[12px] font-semibold text-ink whitespace-nowrap">{title}</div>
        <div className="text-[11px] text-ink-3">{sub}</div>
      </div>
    </div>
  );
}

function FloatNote({
  className,
  tint,
  meta,
  title,
}: {
  className?: string;
  tint: { bg: string; fg: string };
  meta: string;
  title: string;
}) {
  return (
    <div
      className={`absolute pointer-events-none ${className ?? ""}`}
      style={{
        background: tint.bg,
        color: tint.fg,
        borderRadius: 14,
        padding: 14,
        width: 160,
        boxShadow: "0 8px 32px rgba(70,40,140,.10)",
      }}
    >
      <div className="text-[10px] font-medium opacity-65 mb-1.5">{meta}</div>
      <div className="font-display text-[13px] font-semibold leading-snug whitespace-pre-line">{title}</div>
    </div>
  );
}

function Feature({ ic, title, sub }: { ic: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2 rounded-md">
      <div
        className="w-8 h-8 rounded-xl grid place-items-center"
        style={{ background: "rgba(123,91,255,.12)", color: "#5A3FD9" }}
      >
        {ic}
      </div>
      <div className="text-[11px] font-semibold text-ink">{title}</div>
      <div className="text-[10px] text-ink-3 text-center leading-tight">{sub}</div>
    </div>
  );
}
