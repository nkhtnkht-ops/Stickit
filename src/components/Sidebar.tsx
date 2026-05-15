import { NavLink } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useTags } from "@/hooks/useTags";
import { useTasks } from "@/hooks/useTasks";
import { todayRange, next7DaysRange } from "@/utils/dateRange";

type NavItemDef = { to: string; label: string; count?: number; icon: ReactNode };

const Ic = ({ d }: { d: string }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    className="stroke-current fill-none flex-shrink-0"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    dangerouslySetInnerHTML={{ __html: d }}
  />
);

const GoogleLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" aria-label="Google">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.46-.81 5.95-2.18l-2.9-2.26c-.81.54-1.84.86-3.05.86-2.34 0-4.32-1.58-5.03-3.71H.96v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

export function Sidebar() {
  const { session, signOut } = useAuth();
  const { projects } = useProjects();
  const { tags } = useTags();
  const todayCount = useTasks(todayRange()).tasks.length;
  const next7Count = useTasks(next7DaysRange()).tasks.length;

  const meta = session?.user?.user_metadata ?? {};
  const displayName: string = meta.full_name || meta.name || session?.user?.email || "ゲスト";
  const email: string = session?.user?.email ?? "";

  const mainNav: NavItemDef[] = [
    { to: "/today",    label: "今日",        count: todayCount, icon: <Ic d='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' /> },
    { to: "/next7",    label: "次の7日間",    count: next7Count, icon: <Ic d='<path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 4v5h-5"/>' /> },
    { to: "/calendar", label: "カレンダー",                       icon: <Ic d='<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>' /> },
    { to: "/sticky",   label: "付箋ボード",                       icon: <Ic d='<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>' /> },
    { to: "/all",      label: "すべて",                           icon: <Ic d='<path d="M5 6h14M5 12h14M5 18h14"/>' /> },
  ];

  const navClass = (isActive: boolean) =>
    `w-full text-left flex items-center gap-[11px] h-9 px-3 rounded-md text-[14px] transition-colors ${
      isActive
        ? "bg-white/85 text-primary-deep font-semibold shadow-soft"
        : "text-ink-2 font-normal hover:bg-white/40 hover:text-ink"
    }`;

  return (
    <aside className="glass-sidebar rounded-xl shadow-glass flex flex-col gap-1 overflow-y-auto" style={{ padding: "18px 10px 14px" }}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-3 pt-1 pb-5">
        <div
          className="w-7 h-7 rounded-lg grid place-items-center text-white font-bold text-[14px]"
          style={{
            background: "linear-gradient(135deg, #7B5BFF, #5A3FD9)",
            boxShadow: "0 4px 12px rgba(123,91,255,.35)",
            letterSpacing: "-0.02em",
          }}
        >
          S
        </div>
        <span className="font-display font-semibold text-[17px] tracking-display text-ink">Stickit</span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-px px-0.5">
        {mainNav.map((it) => (
          <NavLink key={it.to} to={it.to} className={({ isActive }) => navClass(isActive)}>
            {({ isActive }) => (
              <>
                <span className={isActive ? "text-primary" : "text-ink-3"}>{it.icon}</span>
                <span className="flex-1">{it.label}</span>
                {it.count !== undefined && (
                  <span className="text-[12px] text-ink-3 tabular-nums">{it.count}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="flex flex-col gap-px px-0.5">
          <div className="text-[11px] font-semibold uppercase text-ink-3 px-3.5 pt-4 pb-2" style={{ letterSpacing: "0.04em" }}>
            プロジェクト
          </div>
          {projects.map((p) => (
            <button key={p.id} className={navClass(false)}>
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color ?? "#94a3b8" }} />
              <span className="flex-1">{p.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-col gap-px px-0.5">
          <div className="text-[11px] font-semibold uppercase text-ink-3 px-3.5 pt-4 pb-2" style={{ letterSpacing: "0.04em" }}>
            タグ
          </div>
          {tags.map((t) => (
            <button key={t.id} className={navClass(false)}>
              <span className="text-ink-4">#</span>
              <span className="flex-1">{t.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Settings */}
      <div className="flex flex-col gap-px px-0.5 mt-2">
        <NavLink to="/settings" className={({ isActive }) => navClass(isActive)}>
          {({ isActive }) => (
            <>
              <span className={isActive ? "text-primary" : "text-ink-3"}>
                <Ic d='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' />
              </span>
              <span className="flex-1">設定</span>
            </>
          )}
        </NavLink>
      </div>

      {/* Google account foot */}
      <div className="mt-auto pt-3 px-2 flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full bg-white grid place-items-center cursor-pointer transition-transform hover:scale-105"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}
          title={email}
          onClick={signOut}
        >
          <GoogleLogo size={18} />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-semibold text-[12px] text-ink truncate">{displayName}</span>
          <button onClick={signOut} className="text-[11px] text-ink-3 hover:text-ink truncate text-left">
            {email || "サインアウト"}
          </button>
        </div>
      </div>
    </aside>
  );
}
