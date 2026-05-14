import { useState } from "react";
import { useProjects, type Project } from "@/hooks/useProjects";
import { ProjectForm } from "./ProjectForm";

export function ProjectList() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const handleSubmit = async (input: { name: string; color: string }) => {
    if (editing) await updateProject(editing.id, input);
    else await createProject(input);
    setEditing(null);
  };

  const handleDelete = async (p: Project) => {
    if (confirm(`プロジェクト「${p.name}」を削除します。配下のタスクは「未分類」に移動します。`)) {
      await deleteProject(p.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold tracking-tight">プロジェクト</h3>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="text-[12px] font-medium px-2.5 py-1 bg-ink text-white rounded hover:bg-black">+ 追加</button>
      </div>
      {loading ? (
        <p className="text-ink-3 font-mono text-[12px]">// loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-ink-3 font-mono text-[12px]">// プロジェクトはありません</p>
      ) : (
        <div className="border border-border rounded">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 border-b border-border-2 last:border-b-0">
              <span className="w-3 h-3 rounded-sm" style={{ background: p.color ?? "#94a3b8" }} />
              <span className="flex-1 text-[13.5px] font-medium">{p.name}</span>
              <button onClick={() => { setEditing(p); setOpen(true); }} className="text-[11.5px] text-ink-3 hover:text-ink px-1.5">編集</button>
              <button onClick={() => handleDelete(p)} className="text-[11.5px] text-ink-3 hover:text-crit px-1.5">削除</button>
            </div>
          ))}
        </div>
      )}
      <ProjectForm open={open} onOpenChange={setOpen} project={editing} onSubmit={handleSubmit} />
    </div>
  );
}
