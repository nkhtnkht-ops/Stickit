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
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const { h: nh, m: nm } = jstHourMinutes(now);
  const nowOffset = (nh - 7) * HOUR_PX + (nm / 60) * HOUR_PX;
  const isToday = jstYmd(now) === ymd;

  const open = tasks.filter((t) => t.status === "open").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const high = tasks.filter((t) => (t.priority ?? 0) === 3).length;

  const HAIR = "1px solid rgba(0,0,0,.06)";

  return (
    <div className="grid h-full overflow-hidden" style={{ gridTemplateColumns: "300px 1fr" }}>
      {/* Stats sidebar */}
      <aside className="overflow-y-auto p-6" style={{ borderRight: HAIR }}>
        <div className="font-display font-semibold text-[28px] tracking-display text-ink">{ymd}</div>
        <div className="text-[12px] text-ink-3 mb-5">日次サマリー</div>
        <div className="flex flex-col gap-2 text-[14px]">
          <StatRow value={high} label="優先度 高" color="#B83232" />
          <StatRow value={open} label="未完了" color="#D9802A" />
          <StatRow value={done} label="完了" color="#1F5A3A" />
        </div>
      </aside>

      {/* Timeline */}
      <div className="grid overflow-y-auto relative" style={{ gridTemplateColumns: "64px 1fr" }}>
        <div style={{ borderRight: HAIR }}>
          {HOURS.map((hh) => (
            <div
              key={hh}
              className="text-right pr-2 pt-1 text-[11px] text-ink-4 font-medium tabular-nums"
              style={{ height: HOUR_PX, borderBottom: "1px solid rgba(0,0,0,.04)" }}
            >
              {String(hh).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map((hh) => (
            <div key={hh} style={{ height: HOUR_PX, borderBottom: "1px solid rgba(0,0,0,.04)" }} />
          ))}
          {tasks
            .filter((t) => t.due_at)
            .map((t) => {
              const dt = new Date(t.due_at!);
              const { h, m } = jstHourMinutes(dt);
              const top = (h - 7) * HOUR_PX + (m / 60) * HOUR_PX;
              const proj = t.project_id ? projectMap[t.project_id] : null;
              const color = proj?.color ?? "#7B5BFF";
              return (
                <div
                  key={t.id}
                  className="absolute left-2 right-4 rounded-md px-3 py-2 text-[14px] cursor-pointer backdrop-blur-sm"
                  style={{
                    top,
                    minHeight: 52,
                    background: `${color}33`,
                    borderLeft: `3px solid ${color}`,
                    boxShadow: "0 2px 8px rgba(70,40,140,.06)",
                  }}
                >
                  <div className="text-[11.5px] tabular-nums opacity-80" style={{ color }}>
                    {`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}
                  </div>
                  <div className="font-medium text-ink">{t.title}</div>
                </div>
              );
            })}
          {isToday && (
            <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffset }}>
              <div style={{ borderTop: "1.5px solid #7B5BFF" }} />
              <div
                className="absolute -left-1.5 -top-1.5 w-2.5 h-2.5 rounded-full"
                style={{ background: "#7B5BFF", boxShadow: "0 0 0 3px rgba(123,91,255,.18)" }}
              />
              <div
                className="absolute -left-14 -top-2.5 text-white text-[11px] font-semibold px-2 py-px rounded-full tabular-nums"
                style={{ background: "#7B5BFF" }}
              >
                {`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div
      className="glass-card rounded-md px-3.5 py-2.5 flex items-center gap-3"
      style={{ borderRadius: 10 }}
    >
      <span className="font-display font-semibold text-[20px] tabular-nums min-w-[28px]" style={{ color }}>
        {value}
      </span>
      <span className="text-ink-2">{label}</span>
    </div>
  );
}
