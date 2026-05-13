import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];

export type TaskFilter = {
  from?: Date;
  to?: Date;
  status?: "open" | "done" | "all";
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
    const { data, error } = await q;
    if (error) setError(error.message);
    else setTasks(data ?? []);
    setLoading(false);
  }, [filter.from?.getTime(), filter.to?.getTime(), filter.status]);

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
    const next = task.status === "done" ? "open" : "done";
    await updateTask(task.id, {
      status: next,
      completed_at: next === "done" ? new Date().toISOString() : null,
    });
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) throw error;
    await fetchTasks();
  };

  return { tasks, loading, error, createTask, updateTask, toggleComplete, deleteTask, refetch: fetchTasks };
}
