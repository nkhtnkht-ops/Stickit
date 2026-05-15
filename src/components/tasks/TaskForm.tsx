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

const inputCls =
  "w-full rounded-md px-3 py-2 text-[14px] outline-none transition-all";
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.7)",
  border: "1px solid rgba(255,255,255,.55)",
  color: "#1A1A1F",
};

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
      <h2 className="font-display text-[20px] font-semibold tracking-display text-ink mb-4">
        {task ? "タスクを編集" : "新規タスク"}
      </h2>
      <form onSubmit={handle} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="タスクのタイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputCls}
          style={{ ...inputStyle, fontSize: 16, fontWeight: 500 }}
        />
        <textarea
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className={inputCls + " resize-none"}
          style={inputStyle}
          rows={3}
        />
        <input
          type="datetime-local"
          value={dueLocal}
          onChange={(e) => setDueLocal(e.target.value)}
          className={inputCls + " tabular-nums"}
          style={inputStyle}
        />
        <div className="flex gap-2">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value as string | "none")}
            className={inputCls + " flex-1"}
            style={inputStyle}
          >
            <option value="none">プロジェクトなし</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className={inputCls}
            style={inputStyle}
          >
            <option value={0}>優先度なし</option>
            <option value={1}>P2 低</option>
            <option value={2}>P1 中</option>
            <option value={3}>P0 高</option>
          </select>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase text-ink-3 mb-1.5" style={{ letterSpacing: "0.06em" }}>繰り返し</div>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as RecurrencePresetKey | "none")}
            className={inputCls}
            style={inputStyle}
          >
            <option value="none">なし</option>
            {(Object.keys(RECURRENCE_PRESETS) as RecurrencePresetKey[]).map((k) => (
              <option key={k} value={k}>{RECURRENCE_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase text-ink-3 mb-1.5" style={{ letterSpacing: "0.06em" }}>リマインダー</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(REMINDER_OFFSETS) as ReminderOffsetKey[]).map((k) => {
              const active = reminders.includes(k);
              return (
                <button
                  type="button"
                  key={k}
                  onClick={() => setReminders((prev) => active ? prev.filter((x) => x !== k) : [...prev, k])}
                  className="px-3 py-1 text-[12.5px] rounded-full font-medium transition-all"
                  style={
                    active
                      ? { background: "#7B5BFF", color: "#fff", border: "1px solid #7B5BFF", boxShadow: "0 2px 8px rgba(123,91,255,.35)" }
                      : { background: "rgba(255,255,255,.55)", color: "#4A4A52", border: "1px solid rgba(255,255,255,.55)" }
                  }
                >
                  {REMINDER_LABELS[k]}
                </button>
              );
            })}
          </div>
          <div className="text-[11px] text-ink-3 mt-1.5">期限の指定時間前に通知</div>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="btn-ghost-pill"
          >
            キャンセル
          </button>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {task ? "保存" : "追加"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
