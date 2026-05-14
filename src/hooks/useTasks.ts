import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import { nextOccurrence } from "@/utils/recurrence";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TaskFilter = {
  from?: Date;
  to?: Date;
  status?: "open" | "done" | "all";
  project_id?: string | "none";  // "none" = unassigned tasks
};

export function useTasks(filter: TaskFilter = {}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("tasks").select("*").order("due_at", { ascending: true });
    if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
    else if (!filter.status) q = q.eq("status", "open");
    if (filter.from) q = q.gte("due_at", filter.from.toISOString());
    if (filter.to) q = q.lt("due_at", filter.to.toISOString());
    if (filter.project_id === "none") q = q.is("project_id", null);
    else if (filter.project_id) q = q.eq("project_id", filter.project_id);
    const { data, error } = await q;
    if (error) setError(error.message);
    else setTasks(data ?? []);
    setLoading(false);
  }, [filter.from?.getTime(), filter.to?.getTime(), filter.status, filter.project_id]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (input: Omit<TaskInsert, "user_id">) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await fetchTasks();
    return data;
  };

  const updateTask = async (id: string, patch: TaskUpdate) => {
    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) throw error;
    await fetchTasks();
  };

  const toggleComplete = async (task: Task) => {
    const completing = task.status !== "done";

    if (completing && task.recurrence_rule && task.due_at) {
      // Recurring: mark current as done AND clone next instance
      const next = nextOccurrence(task.recurrence_rule, new Date(task.due_at));
      await updateTask(task.id, { status: "done", completed_at: new Date().toISOString() });
      if (next) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        // Compute next start_at preserving the original delta
        let nextStart: string | null = null;
        if (task.start_at) {
          const delta = new Date(task.due_at).getTime() - new Date(task.start_at).getTime();
          nextStart = new Date(next.getTime() - delta).toISOString();
        }
        await supabase.from("tasks").insert({
          user_id: user.id,
          project_id: task.project_id,
          title: task.title,
          memo: task.memo,
          priority: task.priority,
          start_at: nextStart,
          due_at: next.toISOString(),
          recurrence_rule: task.recurrence_rule,
          status: "open",
        });
        await fetchTasks();
      }
    } else {
      const next = completing ? "done" : "open";
      await updateTask(task.id, {
        status: next,
        completed_at: next === "done" ? new Date().toISOString() : null,
      });
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    await fetchTasks();
  };

  return { tasks, loading, error, createTask, updateTask, toggleComplete, deleteTask, refetch: fetchTasks };
}
