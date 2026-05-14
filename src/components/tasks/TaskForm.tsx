import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  onSubmit: (input: { title: string; memo: string | null; due_at: string | null; priority: number; project_id: string | null }) => Promise<void>;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskForm({ open, onOpenChange, task, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [priority, setPriority] = useState(0);
  const [projectId, setProjectId] = useState<string | "none">("none");
  const [busy, setBusy] = useState(false);

  const { projects } = useProjects();

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setMemo(task?.memo ?? "");
      setDueLocal(toLocalInput(task?.due_at ?? null));
      setPriority(task?.priority ?? 0);
      setProjectId(task?.project_id ?? "none");
    }
  }, [open, task]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        title: title.trim(),
        memo: memo.trim() || null,
        due_at: dueLocal ? new Date(dueLocal).toISOString() : null,
        priority,
        project_id: projectId === "none" ? null : projectId,
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => onOpenChange(false)}>
      <div className="font-mono text-[12px] uppercase tracking-wider text-ink-4 mb-1">// {task ? "edit" : "new"}</div>
      <h2 className="text-[21px] font-semibold tracking-[-0.02em] mb-3">
        {task ? "タスクを編集" : "新規タスク"}
      </h2>
      <form onSubmit={handle} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="タスクのタイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[16px] focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
        />
        <textarea
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[14.5px] resize-none focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
          rows={3}
        />
        <input
          type="datetime-local"
          value={dueLocal}
          onChange={(e) => setDueLocal(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[14.5px] font-mono focus:outline-none focus:border-ink"
        />
        <div className="flex gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value as string | "none")}
            className="flex-1 border border-border rounded px-3 py-2 text-[14.5px] focus:outline-none focus:border-ink"
          >
            <option value="none">プロジェクトなし</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="border border-border rounded px-3 py-2 text-[14.5px] focus:outline-none focus:border-ink"
          >
            <option value={0}>優先度なし</option>
            <option value={1}>P2 低</option>
            <option value={2}>P1 中</option>
            <option value={3}>P0 高</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-[14px] text-ink-2 hover:bg-bg-2 rounded font-medium"
          >キャンセル</button>
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 text-[14px] bg-ink text-white rounded font-medium hover:bg-black disabled:opacity-50"
          >{task ? "保存" : "追加"}</button>
        </div>
      </form>
    </Modal>
  );
}
