import type { Task } from "@/hooks/useTasks";
import type { Project } from "@/hooks/useProjects";

type Props = { task: Task; project?: Project | null; onClick?: (t: Task) => void; onToggle?: (t: Task) => void };

const PRI_BAR = ["", "bg-info", "bg-warn", "bg-crit"];

function formatDue(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StickyCard({ task, project, onClick, onToggle }: Props) {
  const done = task.status === "done";
  const pri = task.priority ?? 0;
  const accent = pri > 0 ? PRI_BAR[pri] : project?.color ? "" : "bg-accent";
  return (
    <div
      onClick={() => onClick?.(task)}
      className={`bg-surface border border-border rounded-md p-3.5 pt-3 relative overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all min-h-[140px] flex flex-col gap-2 ${done ? "opacity-55" : ""}`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${accent}`}
        style={pri === 0 && project?.color ? { background: project.color } : undefined}
      />
      <div className="font-mono text-[10.5px] text-ink-3 uppercase tracking-wider flex items-center justify-between">
        <span>{project?.name ?? "—"}</span>
        <span>{formatDue(task.due_at)}</span>
      </div>
      <div className={`font-medium text-[14px] leading-snug ${done ? "line-through text-ink-3" : "text-ink"}`}>
        {task.title}
      </div>
      <div className="mt-auto pt-2 border-t border-border-2 flex items-center gap-2 text-[10.5px] font-mono text-ink-4">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(task); }}
          className={`w-4 h-4 rounded border-[1.4px] grid place-items-center ${done ? "bg-accent border-accent" : "border-ink-5"}`}
          aria-label="toggle done"
        >
          {done && <span className="block w-1.5 h-1 border-l-[1.5px] border-b-[1.5px] border-white -translate-y-px translate-x-px -rotate-45" />}
        </button>
        <span>{done ? "完了" : "未完了"}</span>
      </div>
    </div>
  );
}
