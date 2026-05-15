import { useAuth } from "@/contexts/AuthContext";
import { ProjectList } from "@/components/projects/ProjectList";
import { TagList } from "@/components/tags/TagList";
import { usePush } from "@/hooks/usePush";

export default function Settings() {
  const { session, signOut } = useAuth();
  const meta = session?.user?.user_metadata ?? {};
  const displayName: string = meta.full_name || meta.name || session?.user?.email || "—";
  const email = session?.user?.email ?? "";

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3.5 px-6"
        style={{ height: 60, borderBottom: "1px solid rgba(0,0,0,.06)" }}
      >
        <div className="font-display font-semibold text-[22px] tracking-display text-ink leading-none">
          設定
          <span className="text-ink-3 font-normal text-[14px] ml-2">アカウント・プロジェクト・タグ</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-8 py-7">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {/* Profile */}
          <section className="glass-card rounded-lg shadow-glass p-6">
            <h2 className="font-display font-semibold text-[17px] text-ink mb-1">プロフィール</h2>
            <p className="text-[12.5px] text-ink-3 mb-4">Googleアカウントから取得した情報です。</p>
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full bg-white grid place-items-center"
                style={{ boxShadow: "0 2px 12px rgba(0,0,0,.10)" }}
              >
                <svg width="28" height="28" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.46-.81 5.95-2.18l-2.9-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
                </svg>
              </div>
              <div>
                <div className="font-display font-semibold text-[18px] text-ink">{displayName}</div>
                <div className="text-[12.5px] text-ink-3">{email}</div>
              </div>
              <button onClick={signOut} className="btn-ghost-pill ml-auto">サインアウト</button>
            </div>
          </section>

          {/* Notifications */}
          <section className="glass-card rounded-lg shadow-glass p-6">
            <NotificationsPanel />
          </section>

          {/* Projects */}
          <section className="glass-card rounded-lg shadow-glass p-6">
            <ProjectList />
          </section>

          {/* Tags */}
          <section className="glass-card rounded-lg shadow-glass p-6">
            <TagList />
          </section>
        </div>
      </div>
    </div>
  );
}

function NotificationsPanel() {
  const { status, busy, error, subscribe, unsubscribe } = usePush();

  const enabled = status === "subscribed";
  const disabledByEnv =
    status === "unsupported" || status === "missing-vapid" || status === "denied";

  let hint: string;
  switch (status) {
    case "unsupported":
      hint = "このブラウザは Web Push に対応していません。";
      break;
    case "missing-vapid":
      hint = "VAPID 公開鍵が未設定です（VITE_VAPID_PUBLIC_KEY）。";
      break;
    case "denied":
      hint = "ブラウザ設定で通知が拒否されています。サイト設定から許可に変更してください。";
      break;
    case "subscribed":
      hint = "期限リマインダーを受け取れます。";
      break;
    default:
      hint = "ブラウザ通知を有効にすると、期限の指定時間前にプッシュが届きます。";
  }

  const onToggle = () => {
    if (busy) return;
    if (enabled) void unsubscribe();
    else void subscribe();
  };

  return (
    <div>
      <h2 className="font-display font-semibold text-[17px] text-ink mb-1">通知</h2>
      <p className="text-[12.5px] text-ink-3 mb-4">期限リマインドとプッシュ通知の設定。</p>
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1">
          <div className="text-[14px] font-medium text-ink">ブラウザ通知</div>
          <div className="text-[12px] text-ink-3 mt-0.5">{hint}</div>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy || disabledByEnv}
          aria-pressed={enabled}
          className="relative w-11 h-[26px] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{ background: enabled ? "#7B5BFF" : "rgba(0,0,0,.16)" }}
        >
          <span
            className="absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all"
            style={{
              left: enabled ? 21 : 3,
              boxShadow: "0 2px 4px rgba(0,0,0,.18)",
            }}
          />
        </button>
      </div>
      {error && <p className="text-crit text-[12.5px] mt-2">{error}</p>}
    </div>
  );
}
