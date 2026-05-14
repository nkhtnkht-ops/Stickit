import { useEffect, useMemo, useState } from "react";
import { jstYmd } from "@/utils/calendar";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const HOUR_PX = 56;

function jstHourMinutes(d: Date) {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  return { h: jst.getUTCHours(), m: jst.getUTCMinutes() };
}

type Props = { anchor: Date };

export function DayView({ anchor }: Props) {
  const ymd = jstYmd(anchor);
  const dayStart = useMemo(() => {
    const jst = new Date(anchor.getTime() + JST_OFFSET_MS);
    jst.setUTCHours(0, 0, 0, 0);
    return new Date(jst.getTime() - JST_OFFSET_MS);
  }, [anchor]);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: dayStart, to: dayEnd, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const { h: nh, m: nm } = jstHourMinutes(now);
  const nowOffset = (nh - 7) * HOUR_PX + (nm / 60) * HOUR_PX;
  const isToday = jstYmd(now) === ymd;

  const open = tasks.filter((t) => t.status === "open").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const high = tasks.filter((t) => (t.priority ?? 0) === 3).length;

  return (
    <div className="grid grid-cols-[280px_1fr] h-full overflow-hidden">
      <aside className="border-r border-border bg-surface-2 p-5 overflow-y-auto">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">{ymd}</div>
        <div className="font-mono text-[11px] text-ink-3 mb-4">// day stats</div>
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2.5"><span className="font-mono font-semibold text-[15px] text-crit min-w-[28px]">{high}</span><span className="text-ink-3">優先度 高 (P0)</span></div>
          <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2.5"><span className="font-mono font-semibold text-[15px] text-warn min-w-[28px]">{open}</span><span className="text-ink-3">未完了</span></div>
          <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2.5"><span className="font-mono font-semibold text-[15px] text-accent-deep min-w-[28px]">{done}</span><span className="text-ink-3">完了</span></div>
        </div>
      </aside>
      <div className="grid grid-cols-[56px_1fr] overflow-y-auto relative">
        <div className="border-r border-border bg-surface-2">
          {HOURS.map((h) => (
            <div key={h} className="border-b border-border-2 text-right pr-2 pt-1 font-mono text-[10px] text-ink-4 font-medium" style={{ height: HOUR_PX }}>{String(h).padStart(2, "0")}:00</div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map((h) => (<div key={h} className="border-b border-border-2" style={{ height: HOUR_PX }} />))}
          {tasks.filter((t) => t.due_at).map((t) => {
            const dt = new Date(t.due_at!);
            const { h, m } = jstHourMinutes(dt);
            const top = (h - 7) * HOUR_PX + (m / 60) * HOUR_PX;
            const proj = t.project_id ? projectMap[t.project_id] : null;
            const bg = proj ? `${proj.color}26` : "rgba(0,0,0,.06)";
            const fg = proj ? proj.color! : "#404040";
            return (
              <div key={t.id} className="absolute left-2 right-4 rounded px-3 py-2 text-[12.5px] cursor-pointer shadow-sm" style={{ top, minHeight: 48, background: bg, borderLeft: `3px solid ${fg}` }}>
                <div className="font-mono text-[10px] opacity-70" style={{ color: fg }}>{`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}</div>
                <div className="font-medium" style={{ color: "#0A0A0A" }}>{t.title}</div>
              </div>
            );
          })}
          {isToday && (
            <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffset }}>
              <div className="border-t-[1.5px] border-accent" />
              <div className="absolute -left-1.5 -top-1.5 w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 0 3px rgba(0,200,83,.18)" }} />
              <div className="absolute -left-12 -top-2 bg-accent text-white font-mono text-[9.5px] font-semibold px-1.5 py-px rounded">{`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
