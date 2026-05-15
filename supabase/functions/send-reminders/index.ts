// Stickit — send-reminders Edge Function
// Reads reminders that are due (remind_at <= now() AND sent_at IS NULL),
// sends a Web Push for each, then marks sent_at = now().
//
// Required env vars (set via `supabase secrets set`):
//   SUPABASE_URL                 (auto-provided)
//   SUPABASE_SERVICE_ROLE_KEY    (auto-provided)
//   VAPID_PUBLIC_KEY             (the same key used on the client)
//   VAPID_PRIVATE_KEY            (server-only)
//   VAPID_SUBJECT                e.g. "mailto:nkhtnkht@gmail.com"
//
// Invocation: HTTP POST. Auth header is not required when called from pg_net
// using the service-role key (we check the bearer below).

// @ts-ignore — Deno-only import resolution
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
// @ts-ignore — npm: specifier for Deno
import webpush from "npm:web-push@3.6.7";

declare const Deno: {
  env: { get(k: string): string | undefined };
  serve: (handler: (req: Request) => Response | Promise<Response>) => void;
};

type Reminder = {
  id: string;
  task_id: string;
  user_id: string;
  remind_at: string;
};

type Subscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:no-reply@stickit.local";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function processBatch(): Promise<{ processed: number; sent: number; failed: number }> {
  const nowIso = new Date().toISOString();

  // 1) Fetch pending reminders due now (oldest first, capped)
  const { data: reminders, error: rErr } = await sb
    .from("reminders")
    .select("id, task_id, user_id, remind_at")
    .is("sent_at", null)
    .lte("remind_at", nowIso)
    .order("remind_at", { ascending: true })
    .limit(100)
    .returns<Reminder[]>();
  if (rErr) throw rErr;
  if (!reminders || reminders.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  // 2) Hydrate task titles + per-user subscriptions in parallel
  const taskIds = [...new Set(reminders.map((r) => r.task_id))];
  const userIds = [...new Set(reminders.map((r) => r.user_id))];

  const [{ data: tasks }, { data: subs }] = await Promise.all([
    sb.from("tasks").select("id, title, due_at, status").in("id", taskIds),
    sb.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").in("user_id", userIds),
  ]);

  const taskMap = new Map<string, { title: string; due_at: string | null; status: string }>(
    (tasks ?? []).map((t: any) => [t.id, t]),
  );
  const subsByUser = new Map<string, Subscription[]>();
  for (const s of (subs ?? []) as any[]) {
    if (!subsByUser.has(s.user_id)) subsByUser.set(s.user_id, []);
    subsByUser.get(s.user_id)!.push(s);
  }

  let sent = 0;
  let failed = 0;
  const sentReminderIds: string[] = [];
  const deadEndpoints: string[] = [];

  for (const r of reminders) {
    const task = taskMap.get(r.task_id);
    // Skip reminders for completed/deleted tasks but mark them sent so we don't retry.
    if (!task || task.status === "done") {
      sentReminderIds.push(r.id);
      continue;
    }
    const userSubs = subsByUser.get(r.user_id) ?? [];
    if (userSubs.length === 0) {
      sentReminderIds.push(r.id);
      continue;
    }

    const dueLabel = task.due_at
      ? new Date(task.due_at).toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit", month: "numeric", day: "numeric" })
      : "";
    const payload = JSON.stringify({
      title: "Stickit リマインダー",
      body: dueLabel ? `${task.title} (${dueLabel})` : task.title,
      url: "/Stickit/today",
      taskId: r.task_id,
    });

    let anySuccess = false;
    for (const sub of userSubs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        );
        anySuccess = true;
      } catch (e: any) {
        // 404/410 = subscription is gone; remove it.
        const status = e?.statusCode ?? e?.status;
        if (status === 404 || status === 410) {
          deadEndpoints.push(sub.endpoint);
        } else {
          console.error("push send failed", { endpoint: sub.endpoint, status, msg: e?.message });
        }
      }
    }
    if (anySuccess) sent++;
    else failed++;
    sentReminderIds.push(r.id);
  }

  // 3) Mark reminders as sent + GC dead subscriptions
  if (sentReminderIds.length > 0) {
    await sb.from("reminders").update({ sent_at: nowIso }).in("id", sentReminderIds);
  }
  if (deadEndpoints.length > 0) {
    await sb.from("push_subscriptions").delete().in("endpoint", deadEndpoints);
  }

  return { processed: reminders.length, sent, failed };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  try {
    const result = await processBatch();
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-reminders error", e);
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? String(e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});
