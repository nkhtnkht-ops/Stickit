import { useMemo } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { StickyCard } from "./StickyCard";

type Props = { projectId?: string | "none" | "all" };

export function StickyBoard({ projectId = "all" }: Props) {
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const filter = projectId === "all"
    ? { status: "all" as const }
    : { status: "all" as const, project_id: projectId };
  const { tasks, toggleComplete, loading } = useTasks(filter);

  if (loading) return <div className="p-6 text-ink-3 font-mono text-[13.5px]">// loading…</div>;
  if (tasks.length === 0) return <div className="p-6 text-ink-3 font-mono text-[13.5px]">// このボードにタスクはありません</div>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5 p-6">
      {tasks.map((t) => (
        <StickyCard key={t.id} task={t} project={t.project_id ? projectMap[t.project_id] : null} onToggle={toggleComplete} />
      ))}
    </div>
  );
}
