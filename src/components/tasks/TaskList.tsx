import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useTasks, type TaskFilter, type Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { syncReminders, type ReminderOffsetKey } from "@/hooks/useReminders";

type Props = { title: string; subtitle?: string; filter: TaskFilter };

export function TaskList({ title, subtitle, filter }: Props) {
  const { tasks, loading, error, createTask, updateTask, toggleComplete, deleteTask } = useTasks(filter);
  const { projects } = useProjects();
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [reminderTaskIds, setReminderTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (tasks.length === 0) {
      setReminderTaskIds(new Set());
      return;
    }
    const ids = tasks.map((t) => t.id);
    supabase.from("reminders").select("task_id").in("task_id", ids).then(({ data }) => {
      setReminderTaskIds(new Set((data ?? []).map((r) => r.task_id as string)));
    });
  }, [tasks]);

  const handleSubmit = async (input: {
    title: string; memo: string | null; due_at: string | null; priority: number;
    project_id: string | null; recurrence_rule: string | null;
    reminderOffsets: ReminderOffsetKey[];
  }) => {
    const { reminderOffsets, ...rest } = input;
    let id: string;
    if (editing) {
      await updateTask(editing.id, rest);
      id = editing.id;
    } else {
      const created = await createTask(rest);
      id = created.id;
    }
    await syncReminders(id, rest.due_at, reminderOffsets);
    setEditing(null);
  };

  const open_ = tasks.filter((t) => t.status !== "done").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3.5 px-6"
        style={{ height: 60, borderBottom: "1px solid rgba(0,0,0,.06)" }}
      >
        <div className="font-display font-semibold text-[22px] tracking-display text-ink leading-none">
          {title}
          {subtitle && <span className="text-ink-3 font-normal text-[14px] ml-2">{subtitle}</span>}
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="btn-primary ml-auto"
        >
          ＋ 新規
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {/* Hero stats card */}
          <div className="glass-card rounded-lg shadow-glass px-5 py-4 flex items-center gap-5">
            <div className="flex-1">
              <div className="text-[12px] text-ink-3 mb-0.5">進捗</div>
              <div className="font-display font-semibold text-[20px] tracking-display text-ink">
                {done} / {total} 完了
              </div>
            </div>
            <div className="flex-[2] min-w-0">
              <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,.06)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: "linear-gradient(90deg, #7B5BFF, #5A3FD9)",
                  }}
                />
              </div>
              <div className="flex justify-between text-[11.5px] text-ink-3 mt-1.5">
                <span>{pct}%</span>
                <span>未完了 {open_}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-crit text-[13.5px]">{error}</p>}

          {loading ? (
            <p className="text-ink-3 text-[13.5px]">読み込み中…</p>
          ) : tasks.length === 0 ? (
            <div className="glass-card rounded-lg shadow-glass p-10 text-center">
              <div className="text-ink-3 text-[14px] mb-3">タスクはありません</div>
              <button onClick={() => { setEditing(null); setOpen(true); }} className="btn-primary">
                ＋ 最初のタスクを追加
              </button>
            </div>
          ) : (
            <div className="glass-card rounded-lg shadow-glass overflow-hidden divide-y" style={{ borderColor: "rgba(0,0,0,.06)" }}>
              {tasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  project={t.project_id ? projectMap[t.project_id] : null}
                  hasReminder={reminderTaskIds.has(t.id)}
                  onToggle={toggleComplete}
                  onClick={(task) => { setEditing(task); setOpen(true); }}
                  onDelete={deleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <TaskForm open={open} onOpenChange={setOpen} task={editing} onSubmit={handleSubmit} />
    </div>
  );
}
