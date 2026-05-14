import { useEffect, useMemo, useState } from "react";
import { weekStart, weekDays, jstYmd } from "@/utils/calendar";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22
const HOUR_PX = 56;
const DOW_LABELS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function jstHourMinutes(d: Date): { h: number; m: number } {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  return { h: jst.getUTCHours(), m: jst.getUTCMinutes() };
}
function jstDate(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCDate();
}

type Props = { anchor: Date };

export function WeekView({ anchor }: Props) {
  const start = useMemo(() => weekStart(anchor), [anchor]);
  const days = useMemo(() => weekDays(start), [start]);
  const todayYmd = jstYmd(new Date());

  const fromDate = days[0];
  const toDate = new Date(days[6].getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: fromDate, to: toDate, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const { h, m } = jstHourMinutes(now);
  const nowOffset = (h - 7) * HOUR_PX + (m / 60) * HOUR_PX;

  return (
    <div className="grid grid-cols-[56px_1fr] grid-rows-[auto_1fr] h-full overflow-hidden bg-surface">
      <div className="border-r border-b border-border" />
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d, i) => {
          const ymd = jstYmd(d);
          const isToday = ymd === todayYmd;
          const isSun = i === 0, isSat = i === 6;
          return (
            <div key={ymd} className={`px-3 py-2 border-r border-border last:border-r-0 ${isToday ? "bg-accent-soft" : ""}`}>
              <div className={`font-mono text-[10.5px] uppercase tracking-wider font-semibold ${isToday ? "text-accent-deep" : isSun ? "text-crit" : isSat ? "text-info" : "text-ink-4"}`}>{DOW_LABELS_EN[i]}</div>
              <div className={`text-[17px] font-semibold tracking-tight mt-0.5 ${isToday ? "text-accent-deep" : ""}`}>{jstDate(d)}</div>
            </div>
          );
        })}
      </div>

      {/* Time labels column */}
      <div className="border-r border-border bg-surface-2 overflow-y-auto">
        {HOURS.map((h) => (
          <div key={h} className="border-b border-border-2 text-right pr-2 pt-1 font-mono text-[10px] text-ink-4 font-medium" style={{ height: HOUR_PX }}>
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 overflow-y-auto relative">
        {days.map((d) => {
          const ymd = jstYmd(d);
          const dayTasks = tasks.filter((t) => t.due_at && jstYmd(new Date(t.due_at)) === ymd);
          const isToday = ymd === todayYmd;
          return (
            <div key={ymd} className={`border-r border-border last:border-r-0 relative ${isToday ? "bg-accent-soft/20" : ""}`}>
              {HOURS.map((h) => (
                <div key={h} className="border-b border-border-2" style={{ height: HOUR_PX }} />
              ))}
              {dayTasks.map((t) => {
                const dt = new Date(t.due_at!);
                const { h: th, m: tm } = jstHourMinutes(dt);
                const top = (th - 7) * HOUR_PX + (tm / 60) * HOUR_PX;
                const proj = t.project_id ? projectMap[t.project_id] : null;
                const bg = proj ? `${proj.color}26` : "rgba(0,0,0,.06)";
                const fg = proj ? proj.color! : "#404040";
                return (
                  <div key={t.id} className="absolute left-1 right-1 rounded px-1.5 py-1 text-[11px] cursor-pointer overflow-hidden" style={{ top, minHeight: 32, background: bg, borderLeft: `3px solid ${fg}` }}>
                    <div className="font-mono text-[9.5px] opacity-70" style={{ color: fg }}>{`${String(th).padStart(2, "0")}:${String(tm).padStart(2, "0")}`}</div>
                    <div className="font-medium truncate" style={{ color: "#0A0A0A" }}>{t.title}</div>
                  </div>
                );
              })}
              {isToday && (
                <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffset }}>
                  <div className="border-t-[1.5px] border-accent" />
                  <div className="absolute -left-1.5 -top-1.5 w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 0 3px rgba(0,200,83,.18)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
