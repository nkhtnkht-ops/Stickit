import { useEffect, useMemo, useRef, useState } from "react";
import { monthGridSlots, jstYmd } from "@/utils/calendar";
import { useTasks, type Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function jstMonth(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCMonth() + 1;
}
function jstDate(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCDate();
}
function jstYear(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCFullYear();
}

type Props = {
  anchor: Date;
  onPeriodChange?: (label: string) => void;
};

export function MonthView({ anchor, onPeriodChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const slots = useMemo(() => {
    const prev = new Date(anchor.getTime() - 30 * 24 * 60 * 60 * 1000);
    const next = new Date(anchor.getTime() + 30 * 24 * 60 * 60 * 1000);
    return [...monthGridSlots(prev, 6), ...monthGridSlots(anchor, 6), ...monthGridSlots(next, 6)];
  }, [anchor]);

  const uniqueSlots = useMemo(() => {
    const seen = new Set<string>();
    return slots.filter((d) => {
      const k = jstYmd(d);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [slots]);

  const todayYmd = jstYmd(new Date());

  const [visibleMonth, setVisibleMonth] = useState(jstMonth(anchor));
  const [visibleYear, setVisibleYear] = useState(jstYear(anchor));

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => {
      const rect = scroller.getBoundingClientRect();
      const probe = rect.top + rect.height * 0.35;
      const cells = scroller.querySelectorAll<HTMLElement>("[data-cell-ymd]");
      for (const c of cells) {
        const r = c.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) {
          const ymd = c.dataset.cellYmd!;
          const [yy, mm] = ymd.split("-").map(Number);
          if (mm !== visibleMonth || yy !== visibleYear) {
            setVisibleMonth(mm);
            setVisibleYear(yy);
            onPeriodChange?.(`${yy}年 ${mm}月`);
          }
          break;
        }
      }
    };
    update();
    // also report initial label
    onPeriodChange?.(`${visibleYear}年 ${visibleMonth}月`);
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueSlots]);

  const fromDate = uniqueSlots[0];
  const toDate = new Date(uniqueSlots[uniqueSlots.length - 1].getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: fromDate, to: toDate, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.due_at) continue;
      const key = jstYmd(new Date(t.due_at));
      (map[key] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full">
      {/* DOW header */}
      <div
        className="grid grid-cols-7 sticky top-0 z-10"
        style={{ borderBottom: "1px solid rgba(0,0,0,.06)" }}
      >
        {DOW_LABELS.map((d, i) => (
          <div
            key={d}
            className={`px-3.5 py-2 text-[12px] font-semibold uppercase ${
              i === 0 ? "text-rose-700/70" : i === 6 ? "text-sky-700/70" : "text-ink-3"
            }`}
            style={{ letterSpacing: "0.06em" }}
          >
            {d}
          </div>
        ))}
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
        <div className="grid grid-cols-7" style={{ gridAutoRows: "calc((100vh - 14px - 14px - 60px - 28px) / 6)" }}>
          {uniqueSlots.map((d, i) => {
            const ymd = jstYmd(d);
            const day = jstDate(d);
            const cellMonth = jstMonth(d);
            const cellYear = jstYear(d);
            const isOther = cellMonth !== visibleMonth || cellYear !== visibleYear;
            const isToday = ymd === todayYmd;
            const dayTasks = tasksByDate[ymd] || [];
            const isSun = i % 7 === 0;
            const isSat = i % 7 === 6;
            return (
              <div
                key={ymd}
                data-cell-ymd={ymd}
                className={`px-2 py-1.5 flex flex-col gap-1 overflow-hidden cursor-pointer transition-colors hover:bg-white/30 ${
                  isOther ? "opacity-55" : ""
                }`}
                style={{
                  borderRight: "1px solid rgba(0,0,0,.06)",
                  borderBottom: "1px solid rgba(0,0,0,.06)",
                }}
              >
                <div className="flex items-center min-h-[24px]">
                  {isToday ? (
                    <span
                      className="w-6 h-6 rounded-full grid place-items-center text-white font-semibold text-[12.5px]"
                      style={{
                        background: "linear-gradient(135deg, #7B5BFF, #5A3FD9)",
                        boxShadow: "0 2px 8px rgba(123,91,255,.35)",
                      }}
                    >
                      {day}
                    </span>
                  ) : (
                    <span
                      className={`text-[13.5px] font-semibold tabular-nums ${
                        isSun ? "text-rose-700/80" : isSat ? "text-sky-700/80" : "text-ink"
                      }`}
                    >
                      {day}
                    </span>
                  )}
                </div>
                {dayTasks.slice(0, 3).map((t) => {
                  const proj = t.project_id ? projectMap[t.project_id] : null;
                  const color = proj?.color ?? "#7B5BFF";
                  return (
                    <div
                      key={t.id}
                      className="text-[12px] px-2 py-px rounded-full font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{
                        background: `${color}26`,
                        color: color,
                      }}
                      title={t.title}
                    >
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[11px] text-ink-3 px-1">+{dayTasks.length - 3}件</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
