import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { StickyBoard } from "@/components/sticky/StickyBoard";
import { PopoutButton } from "@/components/sticky/PopoutButton";

export default function Sticky() {
  const { projects } = useProjects();
  const [tab, setTab] = useState<string | "all">("all");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-border bg-surface gap-3">
        <h1 className="text-[23px] font-semibold tracking-tight">付箋ボード</h1>
        <div className="ml-auto">
          <PopoutButton projectId={tab} />
        </div>
      </div>
      <div className="px-4 border-b border-border bg-surface flex gap-1 overflow-x-auto">
        <TabBtn label="すべて" active={tab === "all"} onClick={() => setTab("all")} />
        {projects.map((p) => (
          <TabBtn key={p.id} label={p.name} color={p.color ?? undefined} active={tab === p.id} onClick={() => setTab(p.id)} />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-bg">
        <StickyBoard projectId={tab as any} />
      </div>
    </div>
  );
}

function TabBtn({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2.5 text-[14px] font-medium whitespace-nowrap border-b-2 -mb-px ${
        active ? "text-ink border-accent font-semibold" : "text-ink-3 border-transparent hover:text-ink-2"
      }`}
    >
      {color && <span className="w-2 h-2 rounded-sm" style={{ background: color }} />}
      {label}
    </button>
  );
}
