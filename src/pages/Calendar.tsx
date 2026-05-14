import { useState } from "react";

type View = "day" | "week" | "month";

export default function Calendar() {
  const [view, setView] = useState<View>("week");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface flex-wrap">
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded border border-border bg-surface text-ink-2 grid place-items-center text-sm hover:bg-bg-2">‹</button>
          <button className="px-3 py-1.5 rounded border border-border bg-surface text-ink-2 text-[12px] font-medium hover:bg-bg-2">今日</button>
          <button className="w-8 h-8 rounded border border-border bg-surface text-ink-2 grid place-items-center text-sm hover:bg-bg-2">›</button>
        </div>
        <div className="font-semibold text-[16px] tracking-tight">2026年 5月</div>
        <div className="ml-auto inline-flex bg-bg-2 rounded p-[3px] border border-border-2">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-[12px] font-mono font-semibold rounded ${
                view === v ? "bg-surface text-ink shadow-xs" : "text-ink-3"
              }`}
            >
              {v === "day" ? "日" : v === "week" ? "週" : "月"}
            </button>
          ))}
        </div>
      </div>

      {/* View body (placeholder until Tasks 10/11/12) */}
      <div className="flex-1 overflow-hidden grid place-items-center">
        <div className="text-ink-4 font-mono text-[12px]">// {view} view — Task 10/11/12 で実装</div>
      </div>
    </div>
  );
}
