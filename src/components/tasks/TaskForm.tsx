import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { RECURRENCE_PRESETS, RECURRENCE_LABELS, detectPreset, type RecurrencePresetKey } from "@/utils/recurrence";
import { REMINDER_OFFSETS, REMINDER_LABELS, type ReminderOffsetKey, getReminderOffsets } from "@/hooks/useReminders";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  onSubmit: (input: {
    title: string; memo: string | null; due_at: string | null; priority: number;
    project_id: string | null; recurrence_rule: string | null;
    reminderOffsets: ReminderOffsetKey[];
  }) => Promise<void>;
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
  const [recurrence, setRecurrence] = useState<RecurrencePresetKey | "none">("none");
  const [reminders, setReminders] = useState<ReminderOffsetKey[]>([]);
  const [busy, setBusy] = useState(false);

  const { projects } = useProjects();

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setMemo(task?.memo ?? "");
      setDueLocal(toLocalInput(task?.due_at ?? null));
      setPriority(task?.priority ?? 0);
      setProjectId(task?.project_id ?? "none");
      setRecurrence(detectPreset(task?.recurrence_rule) ?? "none");
      if (task?.id && task.due_at) {
        getReminderOffsets(task.id, task.due_at).then(setReminders);
      } else {
        setReminders([]);
      }
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
        recurrence_rule: recurrence === "none" ? null : RECURRENCE_PRESETS[recurrence],
        reminderOffsets: reminders,
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
        <div>
          <div className="font-mono text-[12px] uppercase tracking-wider text-ink-3 mb-1.5">// 繰り返し</div>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrencePresetKey | "none")}
            className="w-full border border-border rounded px-3 py-2 text-[14.5px] focus:outline-none focus:border-ink"
          >
            <option value="none">なし</option>
            {(Object.keys(RECURRENCE_PRESETS) as RecurrencePresetKey[]).map((k) => (
              <option key={k} value={k}>{RECURRENCE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="font-mono text-[12px] uppercase tracking-wider text-ink-3 mb-1.5">// リマインダー</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(REMINDER_OFFSETS) as ReminderOffsetKey[]).map((k) => {
              const active = reminders.includes(k);
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setReminders((prev) => active ? prev.filter((x) => x !== k) : [...prev, k])}
                  className={`px-2.5 py-1 text-[13px] rounded font-medium border ${active ? "bg-ink text-white border-ink" : "bg-surface text-ink-2 border-border hover:border-ink-5"}`}
                >
                  {REMINDER_LABELS[k]}
                </button>
              );
            })}
          </div>
          <div className="font-mono text-[12px] text-ink-4 mt-1.5">期限の指定時間前に通知</div>
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
