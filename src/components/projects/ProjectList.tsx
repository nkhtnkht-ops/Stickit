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
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-display font-semibold text-[17px] text-ink">プロジェクト</h2>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="btn-ghost-pill text-[12.5px]"
          style={{ height: 28, padding: "0 12px" }}
        >
          ＋ 追加
        </button>
      </div>
      <p className="text-[12.5px] text-ink-3 mb-4">タスク・付箋を分類するためのグループ。</p>

      {loading ? (
        <p className="text-ink-3 text-[13px]">読み込み中…</p>
      ) : projects.length === 0 ? (
        <p className="text-ink-3 text-[13px]">プロジェクトはありません。</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-white/55"
              style={{
                background: "rgba(255,255,255,.55)",
                border: "1px solid rgba(255,255,255,.55)",
              }}
            >
              <span className="w-3.5 h-3.5 rounded-md flex-shrink-0" style={{ background: p.color ?? "#94a3b8" }} />
              <span className="flex-1 text-[14px] font-medium text-ink">{p.name}</span>
              <button
                onClick={() => { setEditing(p); setOpen(true); }}
                className="text-[12.5px] text-ink-3 hover:text-ink px-2 py-1 rounded hover:bg-black/5"
              >
                編集
              </button>
              <button
                onClick={() => handleDelete(p)}
                className="text-[12.5px] text-ink-3 hover:text-crit px-2 py-1 rounded hover:bg-crit/10"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
      <ProjectForm open={open} onOpenChange={setOpen} project={editing} onSubmit={handleSubmit} />
    </div>
  );
}
