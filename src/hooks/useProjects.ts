import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    else setProjects(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createProject = async (input: { name: string; color?: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("projects")
      .insert({ name: input.name, color: input.color ?? "#94a3b8", user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await fetchAll();
    return data;
  };

  const updateProject = async (id: string, patch: ProjectUpdate) => {
    const { error } = await supabase.from("projects").update(patch).eq("id", id);
    if (error) throw error;
    await fetchAll();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
    await fetchAll();
  };

  return { projects, loading, error, createProject, updateProject, deleteProject, refetch: fetchAll };
}
