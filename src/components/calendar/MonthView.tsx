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
  /** Anchor month to render around. */
  anchor: Date;
  onPeriodChange?: (label: string) => void;
};

export function MonthView({ anchor, onPeriodChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Build 3 months of slots (prev, current, next) for continuous scroll
  const slots = useMemo(() => {
    const prev = new Date(anchor.getTime() - 30 * 24 * 60 * 60 * 1000);
    const next = new Date(anchor.getTime() + 30 * 24 * 60 * 60 * 1000);
    return [...monthGridSlots(prev, 6), ...monthGridSlots(anchor, 6), ...monthGridSlots(next, 6)];
  }, [anchor]);

  // Remove duplicate dates (overlapping weeks between months)
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
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, [uniqueSlots, visibleMonth, visibleYear, onPeriodChange]);

  // Fetch tasks across the visible range
  const fromDate = uniqueSlots[0];
  const toDate = new Date(uniqueSlots[uniqueSlots.length - 1].getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: fromDate, to: toDate, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  // Index tasks by date
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
      <div className="grid grid-cols-7 border-b border-border bg-surface sticky top-0 z-10">
        {DOW_LABELS.map((d, i) => (
          <div key={d} className={`px-3.5 py-2.5 text-[13px] font-medium ${i === 0 ? "text-crit" : i === 6 ? "text-info" : "text-ink-3"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Scroll area */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
        <div
          className="grid grid-cols-7"
          style={{ gridAutoRows: "calc((100vh - 142px) / 6)" }}
        >
          {uniqueSlots.map((d, i) => {
            const ymd = jstYmd(d);
            const day = jstDate(d);
            const isFirst = day === 1;
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
                className={`border-r border-b border-border-2 px-2 py-1 flex flex-col gap-0.5 overflow-hidden cursor-pointer hover:bg-surface-2 ${isToday ? "bg-accent-soft/40" : ""}`}
              >
                <div className="flex items-baseline gap-1 min-h-[18px]">
                  {isFirst ? (
                    <span className={`text-[14px] font-semibold tracking-tightish ${isOther ? "text-ink-4 opacity-55" : "text-ink"}`}>
                      {cellMonth}月{day}日
                    </span>
                  ) : (
                    <span className={`text-[14px] font-medium font-mono ${isOther ? "text-ink-4 opacity-55" : isSun ? "text-crit" : isSat ? "text-info" : "text-ink-2"} ${isToday ? "bg-accent-deep text-white w-5 h-5 rounded-full grid place-items-center text-[12.5px] font-bold" : ""}`}>
                      {day}
                    </span>
                  )}
                </div>
                {dayTasks.slice(0, 3).map((t) => {
                  const proj = t.project_id ? projectMap[t.project_id] : null;
                  const bg = proj ? `${proj.color}1F` : "#F4F4F4";
                  const fg = proj ? proj.color! : "#404040";
                  return (
                    <div
                      key={t.id}
                      className={`text-[13px] px-2 py-px rounded font-medium overflow-hidden text-ellipsis whitespace-nowrap ${isOther ? "opacity-50" : ""}`}
                      style={{ background: bg, color: fg }}
                    >
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[12px] text-ink-3 px-2 font-mono">+{dayTasks.length - 3}件</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
