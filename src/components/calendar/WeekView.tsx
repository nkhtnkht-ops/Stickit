import { useEffect, useMemo, useState } from "react";
import { weekStart, weekDays, jstYmd } from "@/utils/calendar";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22
const HOUR_PX = 56;
const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

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

  const HAIR = "1px solid rgba(0,0,0,.06)";

  return (
    <div className="grid h-full overflow-hidden" style={{ gridTemplateColumns: "64px 1fr", gridTemplateRows: "auto 1fr" }}>
      {/* Top-left empty */}
      <div style={{ borderRight: HAIR, borderBottom: HAIR }} />

      {/* Day header */}
      <div className="grid grid-cols-7" style={{ borderBottom: HAIR }}>
        {days.map((d, i) => {
          const ymd = jstYmd(d);
          const isToday = ymd === todayYmd;
          const isSun = i === 0;
          const isSat = i === 6;
          return (
            <div key={ymd} className="px-3 py-2.5 flex flex-col items-center gap-1" style={{ borderRight: i < 6 ? HAIR : "none" }}>
              <div
                className={`text-[11px] font-semibold uppercase ${
                  isSun ? "text-rose-700/80" : isSat ? "text-sky-700/80" : "text-ink-3"
                }`}
                style={{ letterSpacing: "0.06em" }}
              >
                {DOW_LABELS[i]}
              </div>
              {isToday ? (
                <div
                  className="w-7 h-7 rounded-full grid place-items-center text-white font-display font-semibold text-[14px]"
                  style={{
                    background: "linear-gradient(135deg, #7B5BFF, #5A3FD9)",
                    boxShadow: "0 2px 8px rgba(123,91,255,.35)",
                  }}
                >
                  {jstDate(d)}
                </div>
              ) : (
                <div
                  className={`font-display font-semibold text-[18px] tabular-nums ${
                    isSun ? "text-rose-700/80" : isSat ? "text-sky-700/80" : "text-ink"
                  }`}
                  style={{ letterSpacing: "-0.018em" }}
                >
                  {jstDate(d)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Time labels column */}
      <div className="overflow-y-auto" style={{ borderRight: HAIR }}>
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

      {/* Day columns */}
      <div className="grid grid-cols-7 overflow-y-auto relative">
        {days.map((d, di) => {
          const ymd = jstYmd(d);
          const dayTasks = tasks.filter((t) => t.due_at && jstYmd(new Date(t.due_at)) === ymd);
          const isToday = ymd === todayYmd;
          return (
            <div
              key={ymd}
              className="relative"
              style={{
                borderRight: di < 6 ? HAIR : "none",
                background: isToday ? "rgba(123,91,255,.04)" : "transparent",
              }}
            >
              {HOURS.map((hh) => (
                <div key={hh} style={{ height: HOUR_PX, borderBottom: "1px solid rgba(0,0,0,.04)" }} />
              ))}
              {dayTasks.map((t) => {
                const dt = new Date(t.due_at!);
                const { h: th, m: tm } = jstHourMinutes(dt);
                const top = (th - 7) * HOUR_PX + (tm / 60) * HOUR_PX;
                const proj = t.project_id ? projectMap[t.project_id] : null;
                const color = proj?.color ?? "#7B5BFF";
                return (
                  <div
                    key={t.id}
                    className="absolute left-1 right-1 rounded-md px-2 py-1.5 text-[12px] cursor-pointer overflow-hidden backdrop-blur-sm"
                    style={{
                      top,
                      minHeight: 36,
                      background: `${color}33`,
                      borderLeft: `3px solid ${color}`,
                      boxShadow: "0 2px 6px rgba(70,40,140,.06)",
                    }}
                    title={t.title}
                  >
                    <div className="text-[10.5px] tabular-nums opacity-80" style={{ color }}>
                      {`${String(th).padStart(2, "0")}:${String(tm).padStart(2, "0")}`}
                    </div>
                    <div className="font-medium text-ink truncate">{t.title}</div>
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
