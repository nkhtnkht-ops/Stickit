import type { Task } from "@/hooks/useTasks";
import type { Project } from "@/hooks/useProjects";

type Props = { task: Task; project?: Project | null; onClick?: (t: Task) => void; onToggle?: (t: Task) => void };

const PRI_COLOR = ["", "#3B82F6", "#D9802A", "#B83232"];

function formatDue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StickyCard({ task, project, onClick, onToggle }: Props) {
  const done = task.status === "done";
  const pri = task.priority ?? 0;
  const bandColor = pri > 0 ? PRI_COLOR[pri] : project?.color ?? "#7B5BFF";
  return (
    <div
      onClick={() => onClick?.(task)}
      className={`relative overflow-hidden cursor-pointer transition-all flex flex-col gap-1.5 ${done ? "opacity-55" : ""}`}
      style={{
        background: "rgba(255,255,255,.92)",
        border: "1px solid rgba(255,255,255,.55)",
        borderRadius: 10,
        padding: "12px 12px 10px",
        boxShadow: "0 2px 8px rgba(70,40,140,.05)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(70,40,140,.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(70,40,140,.05)";
      }}
    >
      {/* color band */}
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: bandColor }} />

      <div className="flex items-center justify-between text-[10.5px] text-ink-3 tabular-nums mt-0.5">
        <span className="font-medium" style={{ color: project?.color ?? "#7B5BFF" }}>{project?.name ?? "—"}</span>
        {task.due_at && <span>{formatDue(task.due_at)}</span>}
      </div>

      <div className={`text-[13.5px] font-medium leading-snug ${done ? "line-through text-ink-3" : "text-ink"}`}>
        {task.title}
      </div>

      <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ borderTop: "1px solid rgba(0,0,0,.05)", paddingTop: 6 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(task); }}
          aria-label="toggle done"
          className="w-4 h-4 rounded grid place-items-center transition-all"
          style={
            done
              ? { background: "#7B5BFF", border: "1.4px solid #7B5BFF" }
              : { background: "rgba(255,255,255,.7)", border: "1.4px solid rgba(0,0,0,.18)" }
          }
        >
          {done && (
            <span
              className="block w-1.5 h-1 -translate-y-px translate-x-px -rotate-45"
              style={{ borderLeft: "1.4px solid #fff", borderBottom: "1.4px solid #fff" }}
            />
          )}
        </button>
        <span className="text-ink-3">{done ? "完了" : "未完了"}</span>
        {pri > 0 && (
          <span
            className="ml-auto text-[10px] px-1.5 py-px rounded-full font-semibold"
            style={{ background: `${PRI_COLOR[pri]}1F`, color: PRI_COLOR[pri] }}
          >
            {pri === 3 ? "P0" : pri === 2 ? "P1" : "P2"}
          </span>
        )}
      </div>
    </div>
  );
}
