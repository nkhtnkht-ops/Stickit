import { supabase } from "@/lib/supabase";

export const REMINDER_OFFSETS = {
  m5: 5 * 60 * 1000,
  m15: 15 * 60 * 1000,
  m30: 30 * 60 * 1000,
  h1: 60 * 60 * 1000,
  h2: 2 * 60 * 60 * 1000,
  d1: 24 * 60 * 60 * 1000,
} as const;

export type ReminderOffsetKey = keyof typeof REMINDER_OFFSETS;

export const REMINDER_LABELS: Record<ReminderOffsetKey, string> = {
  m5: "5 分前",
  m15: "15 分前",
  m30: "30 分前",
  h1: "1 時間前",
  h2: "2 時間前",
  d1: "1 日前",
};

/** Replace all reminders for a task with the given offsets. */
export async function syncReminders(taskId: string, dueAt: string | null, offsetKeys: ReminderOffsetKey[]) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Delete existing
  await supabase.from("reminders").delete().eq("task_id", taskId);

  if (!dueAt || offsetKeys.length === 0) return;

  const dueMs = new Date(dueAt).getTime();
  const rows = offsetKeys.map((k) => ({
    task_id: taskId,
    user_id: user.id,
    remind_at: new Date(dueMs - REMINDER_OFFSETS[k]).toISOString(),
  }));

  const { error } = await supabase.from("reminders").insert(rows);
  if (error) throw error;
}

/** Fetch existing reminder offsets for a task (used when editing). */
export async function getReminderOffsets(taskId: string, dueAt: string | null): Promise<ReminderOffsetKey[]> {
  if (!dueAt) return [];
  const { data, error } = await supabase
    .from("reminders")
    .select("remind_at")
    .eq("task_id", taskId);
  if (error || !data) return [];
  const dueMs = new Date(dueAt).getTime();
  const keys: ReminderOffsetKey[] = [];
  for (const r of data) {
    const offset = dueMs - new Date(r.remind_at).getTime();
    for (const [k, v] of Object.entries(REMINDER_OFFSETS)) {
      if (Math.abs(offset - v) < 1000) {
        keys.push(k as ReminderOffsetKey);
        break;
      }
    }
  }
  return keys;
}
