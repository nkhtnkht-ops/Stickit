import { useState } from "react";
import { MonthView } from "@/components/calendar/MonthView";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";

type View = "day" | "week" | "month";

export default function Calendar() {
  const [view, setView] = useState<View>("month");
  const [anchor] = useState(new Date());
  const [period, setPeriod] = useState("");

  const parseLabel = (label: string) => {
    // expects "YYYY年 M月" — split year vs month
    const m = label.match(/^(\d{4})年\s*(\d{1,2})月/);
    if (!m) return { main: label, year: "" };
    return { main: `${m[2]}月`, year: m[1] };
  };
  const { main, year } = parseLabel(period);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3.5 px-6"
        style={{ height: 60, borderBottom: "1px solid rgba(0,0,0,.06)" }}
      >
        <div className="font-display font-semibold text-[22px] tracking-display text-ink leading-none">
          {main || "—"}
          {year && <span className="text-ink-3 font-normal text-[17px] ml-1">{year}</span>}
        </div>

        <div className="flex items-center gap-1">
          <button className="w-[30px] h-[30px] rounded-full text-ink-2 grid place-items-center text-base hover:bg-white/55 transition-colors">‹</button>
          <button className="w-[30px] h-[30px] rounded-full text-ink-2 grid place-items-center text-base hover:bg-white/55 transition-colors">›</button>
        </div>

        <button className="btn-ghost-pill ml-1">今日</button>

        {/* Segmented control */}
        <div
          className="inline-flex ml-auto"
          style={{
            background: "rgba(255,255,255,.55)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 9999,
            padding: 3,
            height: 32,
            border: "1px solid rgba(255,255,255,.55)",
          }}
        >
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`h-[26px] px-4 text-[13px] font-medium rounded-full transition-colors ${
                view === v ? "text-white" : "text-ink-2"
              }`}
              style={
                view === v
                  ? {
                      background: "#7B5BFF",
                      boxShadow: "0 2px 8px rgba(123,91,255,.35)",
                      letterSpacing: "-0.014em",
                    }
                  : { letterSpacing: "-0.014em" }
              }
            >
              {v === "day" ? "日" : v === "week" ? "週" : "月"}
            </button>
          ))}
        </div>

        <button className="btn-primary ml-1">＋ 新規</button>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === "month" && <MonthView anchor={anchor} onPeriodChange={setPeriod} />}
        {view === "week" && <WeekView anchor={anchor} />}
        {view === "day" && <DayView anchor={anchor} />}
      </div>
    </div>
  );
}
