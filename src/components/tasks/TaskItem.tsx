import type { Task } from "@/hooks/useTasks";
import type { Project } from "@/hooks/useProjects";

type Props = {
  task: Task;
  project?: Project | null;
  tagNames?: string[];
  hasReminder?: boolean;
  onToggle: (t: Task) => void;
  onClick?: (t: Task) => void;
  onDelete?: (id: string) => void;
};

const PRI_COLOR = ["", "#3B82F6", "#D9802A", "#B83232"]; // 0/P2/P1/P0
const PRI_LABEL = ["", "P2", "P1", "P0"];

function formatDue(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function TaskItem({ task, project, tagNames, hasReminder, onToggle, onClick, onDelete }: Props) {
  const done = task.status === "done";
  const pri = task.priority ?? 0;
  return (
    <div
      onClick={() => onClick?.(task)}
      className="grid items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/40 relative group"
      style={{ gridTemplateColumns: "20px 1fr auto" }}
    >
      {pri > 0 && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{ background: PRI_COLOR[pri] }}
        />
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        aria-label="toggle done"
        className="w-[18px] h-[18px] rounded-md grid place-items-center transition-all"
        style={
          done
            ? { background: "#7B5BFF", border: "1.5px solid #7B5BFF" }
            : { background: "rgba(255,255,255,.7)", border: "1.5px solid rgba(0,0,0,.18)" }
        }
      >
        {done && (
          <span
            className="block w-2 h-1 -translate-y-px translate-x-px -rotate-45"
            style={{ borderLeft: "1.6px solid #fff", borderBottom: "1.6px solid #fff" }}
          />
        )}
      </button>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={`text-[14.5px] font-medium leading-tight ${done ? "line-through text-ink-3" : "text-ink"}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-ink-3 flex-wrap">
          {task.due_at && <span className="tabular-nums">{formatDue(task.due_at)}</span>}
          {project && (
            <>
              {task.due_at && <span className="text-ink-4">·</span>}
              <span
                className="inline-flex items-center gap-1 px-2 py-px rounded-full font-medium text-[11.5px]"
                style={{ background: `${project.color}26`, color: project.color ?? "#7B5BFF" }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: project.color ?? "#7B5BFF" }} />
                {project.name}
              </span>
            </>
          )}
          {task.recurrence_rule && (
            <span title="繰り返し" className="inline-flex items-center text-ink-3">
              <svg className="w-3 h-3 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"/></svg>
            </span>
          )}
          {hasReminder && (
            <span title="リマインダー設定済" className="inline-flex items-center" style={{ color: "#7B5BFF" }}>
              <svg className="w-3 h-3 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
            </span>
          )}
          {tagNames && tagNames.length > 0 && tagNames.map((n) => (
            <span key={n} className="text-ink-3">#{n}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pri > 0 && (
          <span
            className="text-[10.5px] px-1.5 py-px rounded-full font-semibold tabular-nums"
            style={{ background: `${PRI_COLOR[pri]}1F`, color: PRI_COLOR[pri] }}
          >
            {PRI_LABEL[pri]}
          </span>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-ink-4 hover:text-crit text-base leading-none w-6 h-6 grid place-items-center rounded-md hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="delete"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
