import { useEffect, useMemo } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";

export default function Popout() {
  const [params] = useSearchParams();
  const projectId = params.get("project") ?? "all";
  const { session, loading } = useAuth();
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const filter = projectId === "all"
    ? { status: "open" as const }
    : { status: "open" as const, project_id: projectId };
  const { tasks, toggleComplete } = useTasks(filter);

  const projName = projectId === "all" ? "all" : projectMap[projectId]?.name ?? "—";

  useEffect(() => { document.title = `Stickit · ${projName}`; }, [projName]);

  if (loading) return <div className="p-3 font-mono text-[11.5px] text-ink-3">// loading</div>;
  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="bg-ink text-white min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-mono text-[12px] text-white/60 ml-1.5">stickit · {projName}</span>
        <span className="ml-auto font-mono text-[11px] bg-accent/20 border border-accent/35 text-accent px-1.5 py-px rounded">📌 PINNED</span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
        {tasks.length === 0 && <div className="font-mono text-[12px] text-white/50 text-center py-6">// no tasks</div>}
        {tasks.map((t) => {
          const proj = t.project_id ? projectMap[t.project_id] : null;
          const accent = proj?.color ?? "#00C853";
          return (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-md px-2.5 py-2 text-[13px] leading-snug" style={{ borderLeftColor: accent, borderLeftWidth: 2 }}>
              <div className="font-mono text-[11px] text-white/50 flex justify-between mb-0.5">
                <span>{proj?.name ?? "—"}</span>
                <span>{t.due_at ? `${new Date(t.due_at).getMonth() + 1}/${new Date(t.due_at).getDate()}` : "—"}</span>
              </div>
              <div className="font-medium text-white flex items-center justify-between gap-2">
                <span>{t.title}</span>
                <button onClick={() => toggleComplete(t)} className="text-white/40 hover:text-accent">✓</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-1.5 border-t border-white/10 bg-white/5 font-mono text-[11px] text-white/50 flex justify-between">
        <span>{tasks.length} active</span>
        <span className="text-accent">live</span>
      </div>
    </div>
  );
}
