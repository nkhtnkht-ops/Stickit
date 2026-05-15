import { useMemo } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { StickyCard } from "@/components/sticky/StickyCard";
import { PopoutButton } from "@/components/sticky/PopoutButton";

export default function Sticky() {
  const { projects } = useProjects();
  const { tasks, toggleComplete } = useTasks({ status: "all" });

  const columns = useMemo(() => {
    const byProject: Record<string, typeof tasks> = {};
    for (const p of projects) byProject[p.id] = [];
    const unassigned: typeof tasks = [];
    for (const t of tasks) {
      if (t.project_id && byProject[t.project_id]) {
        byProject[t.project_id].push(t);
      } else {
        unassigned.push(t);
      }
    }
    return { byProject, unassigned };
  }, [projects, tasks]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3.5 px-6"
        style={{ height: 60, borderBottom: "1px solid rgba(0,0,0,.06)" }}
      >
        <div className="font-display font-semibold text-[22px] tracking-display text-ink leading-none">
          付箋ボード
          <span className="text-ink-3 font-normal text-[14px] ml-2">プロジェクト別カンバン</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <PopoutButton projectId="all" />
          <button className="btn-primary">＋ 新規付箋</button>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {projects.map((p) => (
            <Column
              key={p.id}
              title={p.name}
              color={p.color ?? "#7B5BFF"}
              tasks={columns.byProject[p.id]}
              onToggle={toggleComplete}
            />
          ))}
          {columns.unassigned.length > 0 && (
            <Column
              title="未分類"
              color="#A0A0AE"
              tasks={columns.unassigned}
              onToggle={toggleComplete}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  color,
  tasks,
  onToggle,
}: {
  title: string;
  color: string;
  tasks: any[];
  onToggle: (t: any) => void;
}) {
  const projectForCard = { id: "", name: title, color } as any;
  return (
    <div
      className="flex flex-col gap-2.5 p-3.5 rounded-lg"
      style={{
        width: 296,
        flexShrink: 0,
        background: "rgba(255,255,255,.72)",
        border: "1px solid rgba(255,255,255,.55)",
        maxHeight: "100%",
      }}
    >
      <div
        className="flex items-center gap-2.5 pb-2"
        style={{ borderBottom: "1px solid rgba(0,0,0,.06)" }}
      >
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-display font-semibold text-[15px] tracking-tightish text-ink flex-1">{title}</span>
        <span className="text-[11px] text-ink-3 tabular-nums px-2 py-px rounded-full" style={{ background: "rgba(0,0,0,.05)" }}>
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 overflow-y-auto" style={{ flex: 1 }}>
        {tasks.length === 0 ? (
          <div className="text-[12px] text-ink-3 text-center py-6">付箋なし</div>
        ) : (
          tasks.map((t) => (
            <StickyCard key={t.id} task={t} project={projectForCard} onToggle={onToggle} />
          ))
        )}
      </div>
    </div>
  );
}
