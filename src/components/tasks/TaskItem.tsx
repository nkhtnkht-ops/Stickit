import type { Task } from "@/hooks/useTasks";
import type { Project } from "@/hooks/useProjects";

type Props = {
  task: Task;
  project?: Project | null;
  tagNames?: string[];
  onToggle: (t: Task) => void;
  onClick?: (t: Task) => void;
  onDelete?: (id: string) => void;
};

const PRI_BAR = ["", "bg-info", "bg-warn", "bg-crit"];
const PRI_BADGE = ["", "P2", "P1", "P0"];

function formatDue(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function TaskItem({ task, project, tagNames, onToggle, onClick, onDelete }: Props) {
  const done = task.status === "done";
  const pri = task.priority ?? 0;
  return (
    <div
      onClick={() => onClick?.(task)}
      className="grid grid-cols-[18px_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-md border border-transparent hover:bg-surface hover:border-border cursor-pointer relative"
    >
      {pri > 0 && <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded ${PRI_BAR[pri]}`} />}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        aria-label="toggle done"
        className={`w-[17px] h-[17px] rounded border-[1.4px] grid place-items-center transition-colors ${
          done ? "bg-accent border-accent" : "border-ink-5 bg-surface hover:border-accent"
        }`}
      >
        {done && (
          <span className="block w-2 h-1 border-l-[1.6px] border-b-[1.6px] border-white -translate-y-px translate-x-px -rotate-45" />
        )}
      </button>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={`text-[15px] font-medium leading-tight ${done ? "line-through text-ink-4" : "text-ink"}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 font-mono text-[12.5px] text-ink-4 flex-wrap">
          <span>{formatDue(task.due_at)}</span>
          {project && (
            <>
              <span className="text-ink-5">·</span>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-px rounded font-medium"
                style={{ background: `${project.color}1F`, color: project.color ?? "#94a3b8" }}
              >
                <span className="w-1.5 h-1.5 rounded-sm" style={{ background: project.color ?? "#94a3b8" }} />
                {project.name}
              </span>
            </>
          )}
          {task.recurrence_rule && (
            <>
              <span className="text-ink-5">·</span>
              <span title="繰り返し" className="inline-flex items-center text-ink-3">
                <svg className="w-3 h-3 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"/></svg>
              </span>
            </>
          )}
          {tagNames && tagNames.length > 0 && (
            <>
              <span className="text-ink-5">·</span>
              {tagNames.map((n) => (
                <span key={n} className="text-accent-deep">#{n}</span>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {pri > 0 && (
          <span className={`font-mono text-[11.5px] px-1.5 py-px rounded font-medium ${
            pri === 3 ? "bg-crit-soft text-[#991B1B]" : "bg-bg-2 text-ink-3"
          }`}>{PRI_BADGE[pri]}</span>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-ink-4 hover:text-crit text-sm px-1" aria-label="delete">×</button>
        )}
      </div>
    </div>
  );
}
