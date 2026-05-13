import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

type NavItemDef = { to: string; label: string; count?: number; icon: ReactNode };

const Ic = ({ d }: { d: string }) => (
  <svg className="w-3.5 h-3.5 stroke-current fill-none flex-shrink-0" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: d }} />
);

const mainNav: NavItemDef[] = [
  { to: "/today",    label: "今日",      count: 0,  icon: <Ic d='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' /> },
  { to: "/tomorrow", label: "明日",      count: 0,  icon: <Ic d='<path d="M3 6h18M3 12h18M3 18h18"/>' /> },
  { to: "/next7",    label: "今後7日間",  count: 0,  icon: <Ic d='<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>' /> },
  { to: "/all",      label: "すべて",    count: 0,  icon: <Ic d='<path d="M5 6h14M5 12h14M5 18h14"/>' /> },
];

// プロジェクトとツールは Plan 1 では仮データ。Plan 2 で動的化
const dummyProjects = [
  { name: "支配人業務", color: "#00C853", count: 0 },
  { name: "キャプテンカップ", color: "#EF4444", count: 0 },
  { name: "OTA戦略", color: "#F97316", count: 0 },
  { name: "個人", color: "#3B82F6", count: 0 },
];

export function Sidebar() {
  const { signOut } = useAuth();
  return (
    <aside className="w-60 bg-surface border-r border-border p-2.5 pt-3.5 flex flex-col gap-4 overflow-y-auto">
      {/* ブランド */}
      <div className="flex items-center gap-2 px-2.5 pt-1">
        <div className="w-[26px] h-[26px] rounded-md bg-ink text-accent grid place-items-center font-mono font-semibold text-[13px] relative">
          S
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border-2 border-surface" />
        </div>
        <span className="font-semibold text-[15px] tracking-tightish">Stickit</span>
        <span className="ml-auto font-mono text-[10px] text-ink-4 bg-bg-2 px-1.5 py-px rounded">v0.1</span>
      </div>

      {/* 検索 */}
      <div className="mx-1 flex items-center gap-2 px-2.5 py-1.5 bg-bg-2 rounded text-ink-3 text-[12.5px] cursor-pointer hover:border hover:border-border">
        <Ic d='<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>' />
        <span>タスクを検索...</span>
        <span className="ml-auto font-mono text-[10.5px] text-ink-4 bg-surface border border-border px-1.5 py-px rounded">⌘K</span>
      </div>

      {/* メインナビ */}
      <nav className="px-1 flex flex-col gap-px">
        {mainNav.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium transition-colors ${
                isActive ? "bg-ink text-white" : "text-ink-2 hover:bg-bg-2 hover:text-ink"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {it.icon}
                {it.label}
                {it.count !== undefined && (
                  <span className={`ml-auto font-mono text-[11px] ${isActive ? "text-white/55" : "text-ink-4"}`}>
                    {it.count}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* プロジェクト（仮データ） */}
      <div className="px-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-4 px-2 py-1.5">// プロジェクト</div>
        {dummyProjects.map((p) => (
          <button key={p.name} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium text-ink-2 hover:bg-bg-2 hover:text-ink transition-colors text-left">
            <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
            {p.name}
            <span className="ml-auto font-mono text-[11px] text-ink-4">{p.count}</span>
          </button>
        ))}
      </div>

      {/* ツール */}
      <div className="px-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-4 px-2 py-1.5">// ツール</div>
        {[
          { label: "シフト取込", path: '<path d="M14 3v4a1 1 0 001 1h4M17 21H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"/>' },
          { label: "TickTick 移行", path: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>' },
          { label: "設定", path: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33"/>' },
        ].map((it) => (
          <button key={it.label} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium text-ink-2 hover:bg-bg-2 hover:text-ink transition-colors text-left">
            <Ic d={it.path} />
            {it.label}
          </button>
        ))}
      </div>

      {/* アバター */}
      <div className="mt-auto pt-3 px-2 border-t border-border flex items-center gap-2.5">
        <div className="w-[26px] h-[26px] rounded-full grid place-items-center text-white font-mono font-semibold text-[11px]"
             style={{ background: "linear-gradient(135deg, #00C853, #00A152)" }}>
          NK
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-[12.5px]">中畑 慶治</span>
          <button onClick={signOut} className="font-mono text-[10.5px] text-ink-4 hover:text-ink text-left">支配人 · 退出</button>
        </div>
      </div>
    </aside>
  );
}
