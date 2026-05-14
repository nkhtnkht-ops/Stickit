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

  return (
    <div className="p-8 max-w-3xl">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-mono text-[12px] text-ink-3 flex items-center gap-1.5 mb-2">
            <span className="pulse-dot" /> 同期済
          </div>
          <h1 className="text-[32px] font-semibold tracking-[-0.025em] leading-tight">{title}</h1>
          {subtitle && <div className="font-mono text-[13.5px] text-ink-3 mt-1">{subtitle}</div>}
        </div>
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="px-3 py-1.5 bg-ink text-white rounded text-[14px] font-medium hover:bg-black flex items-center gap-1.5"
        >
          + 新規
          <span className="font-mono text-[11.5px] text-white/50 px-1 py-px rounded bg-white/10 ml-1">N</span>
        </button>
      </div>

      {error && <p className="text-crit text-[14px] mb-3">{error}</p>}
      {loading ? (
        <p className="text-ink-3 font-mono text-[13.5px]">// loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-ink-3 font-mono text-[13.5px]">// no tasks</p>
      ) : (
        <div className="bg-bg rounded-lg">
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

      <TaskForm open={open} onOpenChange={setOpen} task={editing} onSubmit={handleSubmit} />
    </div>
  );
}
