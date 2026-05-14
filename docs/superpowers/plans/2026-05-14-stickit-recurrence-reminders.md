# Stickit Recurrence & Reminders Implementation Plan (Plan 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** タスクの繰り返し（毎日/毎週/毎月/平日）と、Web Push でのリマインダー通知を実装。Edge Function + pg_cron で毎分スキャンして送信。

**Architecture:**
- **Recurrence**: `tasks.recurrence_rule` (RFC 5545 RRULE) を使用。ユーザーが完了にした時、現タスクを done にして次の due_at を持つクローンを INSERT。
- **Reminders**: 新規テーブル `reminders`（task_id + remind_at + sent_at）と `push_subscriptions`。タスク保存時に `due_at - offset` を reminders に記録。Edge Function を pg_cron で毎分起動し、`remind_at <= now() AND sent_at IS NULL` を Web Push 送信。

**Tech Stack:** 既存 + `rrule` (RRULE parser, ~50KB), `web-push` (Edge Function 内 VAPID 署名), Supabase Edge Functions, pg_cron + pg_net 拡張, Service Worker push API.

## Phases

- **Phase A — Recurrence (Tasks 1-4)**: 完全に既存 `tasks` テーブルだけで動く。バックエンド変更不要。
- **Phase B — Reminders DB + UI (Tasks 5-8)**: 通知未設定でもタスク保存・表示は機能する。
- **Phase C — Web Push 配信 (Tasks 9-14)**: VAPID 鍵生成、Service Worker、Edge Function、cron。

Phase A 単独でもリリース価値あり。B/C で詰まったら A だけ push でもOK。

## File Structure

```
src/
├─ utils/
│  └─ recurrence.ts                NEW (TDD) - RRULE next-occurrence helpers
├─ hooks/
│  ├─ useTasks.ts                  MODIFY - recurrence on complete
│  ├─ useReminders.ts              NEW - sync reminders for a task
│  └─ usePush.ts                   NEW - subscription management
├─ components/
│  ├─ tasks/
│  │  ├─ TaskForm.tsx              MODIFY - recurrence + reminder pickers
│  │  └─ TaskItem.tsx              MODIFY - show 🔁 / 🔔 icons
│  └─ settings/
│     └─ NotificationSettings.tsx  NEW - enable push button + status
├─ pages/
│  └─ Settings.tsx                 MODIFY - add NotificationSettings section
public/
└─ (PWA SW handles push via vite-plugin-pwa injectManifest)
src/
└─ sw.ts                           NEW - custom service worker for push
supabase/
├─ migrations/
│  └─ 0004_reminders_and_push.sql  NEW - tables + RLS
└─ functions/
   └─ send-reminders/
      ├─ index.ts                  NEW - Edge Function
      └─ deno.json                 NEW
```

---

## PHASE A — Recurrence

## Task 1: rrule utility (TDD)

**Files:**
- Create: `src/utils/recurrence.ts`
- Create: `tests/utils/recurrence.test.ts`

- [ ] **Step 1: Install rrule**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm install rrule
```

- [ ] **Step 2: Write failing tests**

`tests/utils/recurrence.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { nextOccurrence, RECURRENCE_PRESETS } from "@/utils/recurrence";

describe("recurrence", () => {
  // Reference: 2026-05-13 Wed 10:30 JST = 2026-05-13T01:30:00Z
  const ref = new Date("2026-05-13T01:30:00Z");

  it("daily preset → next is 2026-05-14 same time", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.daily, ref);
    expect(next?.toISOString()).toBe("2026-05-14T01:30:00.000Z");
  });

  it("weekly preset → next is 2026-05-20 same time (next Wed)", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.weekly, ref);
    expect(next?.toISOString()).toBe("2026-05-20T01:30:00.000Z");
  });

  it("monthly preset → next is 2026-06-13 same time", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.monthly, ref);
    expect(next?.toISOString()).toBe("2026-06-13T01:30:00.000Z");
  });

  it("weekdays preset (5/13 Wed) → next is 2026-05-14 (Thu)", () => {
    const next = nextOccurrence(RECURRENCE_PRESETS.weekdays, ref);
    expect(next?.toISOString()).toBe("2026-05-14T01:30:00.000Z");
  });

  it("weekdays preset (5/15 Fri) → next is 2026-05-18 (Mon, skips Sat/Sun)", () => {
    const fri = new Date("2026-05-15T01:30:00Z");
    const next = nextOccurrence(RECURRENCE_PRESETS.weekdays, fri);
    expect(next?.toISOString()).toBe("2026-05-18T01:30:00.000Z");
  });

  it("returns null for invalid rule", () => {
    expect(nextOccurrence("invalid", ref)).toBeNull();
  });

  it("returns null for empty rule", () => {
    expect(nextOccurrence("", ref)).toBeNull();
    expect(nextOccurrence(null as unknown as string, ref)).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests, verify FAIL**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run test:run -- tests/utils/recurrence.test.ts
```

- [ ] **Step 4: Implement**

`src/utils/recurrence.ts`:
```ts
import { RRule } from "rrule";

export const RECURRENCE_PRESETS = {
  daily: "FREQ=DAILY",
  weekly: "FREQ=WEEKLY",
  monthly: "FREQ=MONTHLY",
  yearly: "FREQ=YEARLY",
  weekdays: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR",
} as const;

export type RecurrencePresetKey = keyof typeof RECURRENCE_PRESETS;

export const RECURRENCE_LABELS: Record<RecurrencePresetKey, string> = {
  daily: "毎日",
  weekly: "毎週",
  monthly: "毎月",
  yearly: "毎年",
  weekdays: "平日のみ (月-金)",
};

/**
 * Returns the next occurrence strictly after `after`, or null if rule is invalid/exhausted.
 * `after` is the previous occurrence's actual datetime.
 */
export function nextOccurrence(rule: string, after: Date): Date | null {
  if (!rule) return null;
  try {
    // RRule.fromString needs a DTSTART; if absent, use `after` so the rule is anchored to it.
    const fullRule = rule.includes("DTSTART") ? rule : `DTSTART:${formatRRuleDate(after)}\nRRULE:${rule}`;
    const rrule = RRule.fromString(fullRule);
    return rrule.after(after, false);
  } catch {
    return null;
  }
}

function formatRRuleDate(d: Date): string {
  const pad = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

/** Returns the preset key matching the rule string, or null if it's a custom/unknown rule. */
export function detectPreset(rule: string | null | undefined): RecurrencePresetKey | null {
  if (!rule) return null;
  for (const [k, v] of Object.entries(RECURRENCE_PRESETS)) {
    if (rule === v) return k as RecurrencePresetKey;
  }
  return null;
}
```

- [ ] **Step 5: Run tests, verify PASS**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run test:run
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add recurrence utilities with RRULE (TDD)"
```

---

## Task 2: useTasks.toggleComplete handles recurrence

**Files:**
- Modify: `src/hooks/useTasks.ts`

- [ ] **Step 1: Read existing useTasks.ts** to find `toggleComplete`. Then replace its body.

```ts
import { nextOccurrence } from "@/utils/recurrence";

// Inside useTasks, replace toggleComplete with:
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
```

- [ ] **Step 2: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(useTasks): create next instance when completing a recurring task"
```

---

## Task 3: TaskForm — recurrence picker

**Files:**
- Modify: `src/components/tasks/TaskForm.tsx`

- [ ] **Step 1: Read TaskForm.tsx**, then add recurrence state and selector.

At the top imports add:
```tsx
import { RECURRENCE_PRESETS, RECURRENCE_LABELS, detectPreset, type RecurrencePresetKey } from "@/utils/recurrence";
```

Update `Props.onSubmit` type to include `recurrence_rule`:
```tsx
onSubmit: (input: { title: string; memo: string | null; due_at: string | null; priority: number; project_id: string | null; recurrence_rule: string | null }) => Promise<void>;
```

Inside the component, add state:
```tsx
const [recurrence, setRecurrence] = useState<RecurrencePresetKey | "none">("none");
```

In the existing `useEffect` that resets state when `open`, also reset:
```tsx
setRecurrence(detectPreset(task?.recurrence_rule) ?? "none");
```

In the `handle` submit, include recurrence_rule:
```tsx
recurrence_rule: recurrence === "none" ? null : RECURRENCE_PRESETS[recurrence],
```

In the JSX, after the project/priority row, add a row for recurrence:
```tsx
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
```

- [ ] **Step 2: Update TaskList.handleSubmit signature**

In `src/components/tasks/TaskList.tsx`, find `handleSubmit` and update the type to include `recurrence_rule: string | null`. Pass-through is automatic (createTask/updateTask already accept the field via TaskInsert/TaskUpdate types).

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(task): recurrence picker in TaskForm"
```

---

## Task 4: TaskItem — show recurrence indicator

**Files:**
- Modify: `src/components/tasks/TaskItem.tsx`

- [ ] **Step 1: Read TaskItem.tsx** then add a small 🔁 badge in the meta row.

In the existing `task-meta` div (the one with project chip and tags), AFTER the project chip block but BEFORE the tags block, add:
```tsx
{task.recurrence_rule && (
  <>
    <span className="text-ink-5">·</span>
    <span title="繰り返し" className="inline-flex items-center text-ink-3">
      <svg className="w-3 h-3 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5"/></svg>
    </span>
  </>
)}
```

- [ ] **Step 2: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(TaskItem): show 🔁 indicator for recurring tasks"
```

---

## PHASE B — Reminders DB + UI

## Task 5: Migration — reminders + push_subscriptions tables

**Files:**
- Create: `supabase/migrations/0004_reminders_and_push.sql`

- [ ] **Step 1: Write SQL**

```sql
-- Reminders: scheduled push notifications for tasks
create table reminders (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  remind_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);
create index reminders_pending_idx on reminders (remind_at) where sent_at is null;
create index reminders_task_idx on reminders (task_id);

alter table reminders enable row level security;
create policy "reminders_select_own" on reminders for select using (auth.uid() = user_id);
create policy "reminders_insert_own" on reminders for insert with check (auth.uid() = user_id);
create policy "reminders_update_own" on reminders for update using (auth.uid() = user_id);
create policy "reminders_delete_own" on reminders for delete using (auth.uid() = user_id);

-- Web Push subscriptions
create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  unique (user_id, endpoint)
);
create index push_subs_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;
create policy "push_subs_select_own" on push_subscriptions for select using (auth.uid() = user_id);
create policy "push_subs_insert_own" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_subs_delete_own" on push_subscriptions for delete using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__supabase__apply_migration` (project id `mhvweowjjocnbmpvpjwi`, migration name `reminders_and_push`, the SQL above).

- [ ] **Step 3: Verify all 4 policies exist on reminders, 3 on push_subscriptions**

Use `mcp__supabase__execute_sql`:
```sql
select tablename, cmd, count(*) from pg_policies
where schemaname = 'public' and tablename in ('reminders', 'push_subscriptions')
group by tablename, cmd order by tablename, cmd;
```
Expected: reminders has 4 rows (SELECT/INSERT/UPDATE/DELETE), push_subscriptions has 3 (no UPDATE).

- [ ] **Step 4: Regenerate TS types**

Use `mcp__supabase__generate_typescript_types`. Replace `src/lib/database.types.ts` with the new content.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(db): add reminders and push_subscriptions tables with RLS"
```

---

## Task 6: useReminders hook

**Files:**
- Create: `src/hooks/useReminders.ts`

- [ ] **Step 1: Implement**

```ts
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
```

- [ ] **Step 2: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: add useReminders helpers (sync + fetch)"
```

---

## Task 7: TaskForm — reminder picker + save flow

**Files:**
- Modify: `src/components/tasks/TaskForm.tsx`
- Modify: `src/components/tasks/TaskList.tsx`

- [ ] **Step 1: Add reminder state to TaskForm**

Add imports:
```tsx
import { REMINDER_OFFSETS, REMINDER_LABELS, type ReminderOffsetKey, getReminderOffsets } from "@/hooks/useReminders";
```

Update Props.onSubmit type to include `reminderOffsets`:
```tsx
onSubmit: (input: {
  title: string; memo: string | null; due_at: string | null; priority: number;
  project_id: string | null; recurrence_rule: string | null;
  reminderOffsets: ReminderOffsetKey[];
}) => Promise<void>;
```

Inside the component, add state:
```tsx
const [reminders, setReminders] = useState<ReminderOffsetKey[]>([]);
```

In the `useEffect` that resets when `open`, fetch existing reminders for edit case:
```tsx
if (task?.id && task.due_at) {
  getReminderOffsets(task.id, task.due_at).then(setReminders);
} else {
  setReminders([]);
}
```

In `handle` submit include `reminderOffsets: reminders`.

In the JSX, after the recurrence section, add:
```tsx
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
```

- [ ] **Step 2: Update TaskList.handleSubmit to call syncReminders**

In `src/components/tasks/TaskList.tsx`, add import:
```tsx
import { syncReminders, type ReminderOffsetKey } from "@/hooks/useReminders";
```

Update `handleSubmit` signature and body:
```tsx
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
```

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(task): reminder picker + sync on save"
```

---

## Task 8: TaskItem — show reminder indicator (🔔)

**Files:**
- Modify: `src/components/tasks/TaskItem.tsx`

- [ ] **Step 1: Display indicator if task has any reminder**

Reminders aren't loaded into the task object by default, so we need a lightweight indicator. Quick approach: pass `hasReminder?: boolean` as a prop, computed in TaskList from a single bulk reminders fetch.

Add prop to Props:
```tsx
hasReminder?: boolean;
```

In the meta row, add after the recurrence indicator:
```tsx
{props.hasReminder && (
  <>
    <span className="text-ink-5">·</span>
    <span title="リマインダー設定済" className="inline-flex items-center text-accent-deep">
      <svg className="w-3 h-3 stroke-current fill-none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>
    </span>
  </>
)}
```

(Note: `props.hasReminder` — since we destructured props in original signature, change to take `hasReminder` in the destructuring.)

- [ ] **Step 2: TaskList — fetch reminders count per task**

In `src/components/tasks/TaskList.tsx`, after the existing useTasks call, add:
```tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
// inside component:
const [reminderTaskIds, setReminderTaskIds] = useState<Set<string>>(new Set());
useEffect(() => {
  if (tasks.length === 0) { setReminderTaskIds(new Set()); return; }
  const ids = tasks.map((t) => t.id);
  supabase.from("reminders").select("task_id").in("task_id", ids).then(({ data }) => {
    setReminderTaskIds(new Set((data ?? []).map((r) => r.task_id as string)));
  });
}, [tasks]);
// Pass to TaskItem:
<TaskItem ... hasReminder={reminderTaskIds.has(t.id)} />
```

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(TaskItem): show 🔔 reminder indicator"
```

---

## PHASE C — Web Push 配信

> **Note for executor**: Phase C requires manual user actions interleaved with automation. **Pause after Task 9** for the user to record the VAPID keys and add them to GitHub/Supabase secrets. Resume after they confirm.

## Task 9: Generate VAPID keys (manual user step)

**Files:**
- Modify: `.env.example` (add VITE_VAPID_PUBLIC_KEY)
- Modify: `.env.local` (user adds private + public keys locally)

- [ ] **Step 1: Generate keypair locally**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npx web-push generate-vapid-keys --json
```

Output is JSON: `{ "publicKey": "BJ...", "privateKey": "..." }`

- [ ] **Step 2: Add to local env**

Add to `.env.local`:
```
VITE_VAPID_PUBLIC_KEY=<paste publicKey>
```

Add to `.env.example`:
```
VITE_VAPID_PUBLIC_KEY=BJxxxxx...
```

- [ ] **Step 3: GitHub Secret**

```bash
gh secret set VITE_VAPID_PUBLIC_KEY --body "<paste publicKey>"
```

- [ ] **Step 4: Supabase secret (for Edge Function)**

In Supabase dashboard → Edge Functions → secrets, add:
- `VAPID_PUBLIC_KEY` = (publicKey)
- `VAPID_PRIVATE_KEY` = (privateKey)
- `VAPID_SUBJECT` = `mailto:nkhtnkht@gmail.com`

(Or use Supabase CLI: `supabase secrets set VAPID_PRIVATE_KEY=... VAPID_PUBLIC_KEY=... VAPID_SUBJECT=mailto:nkhtnkht@gmail.com`)

- [ ] **Step 5: Update workflow to pass VAPID public key**

Edit `.github/workflows/deploy.yml`. In the `npm run build` env block add:
```yaml
VITE_VAPID_PUBLIC_KEY: ${{ secrets.VITE_VAPID_PUBLIC_KEY }}
```

- [ ] **Step 6: Commit and push**

```bash
git add -A && git commit -m "ci: pass VAPID public key to build" && git push
```

---

## Task 10: Custom Service Worker for push

**Files:**
- Create: `src/sw.ts`
- Modify: `vite.config.ts` (switch to injectManifest mode)

- [ ] **Step 1: Switch vite-plugin-pwa to injectManifest**

In `vite.config.ts`, change the `VitePWA` config:
```ts
VitePWA({
  registerType: "autoUpdate",
  strategies: "injectManifest",
  srcDir: "src",
  filename: "sw.ts",
  injectManifest: { swSrc: "src/sw.ts", swDest: "dist/sw.js" },
  includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
  manifest: {
    name: "Stickit",
    short_name: "Stickit",
    description: "TickTick互換タスク管理 PWA",
    start_url: "/Stickit/",
    scope: "/Stickit/",
    display: "standalone",
    background_color: "#FAFAFA",
    theme_color: "#00C853",
    icons: [
      { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  },
}),
```

- [ ] **Step 2: Create src/sw.ts**

```ts
/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Push event: show notification
self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;
  const payload = event.data.json() as { title: string; body?: string; tag?: string; url?: string };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      icon: "/Stickit/icons/icon-192.png",
      badge: "/Stickit/icons/icon-192.png",
      data: { url: payload.url ?? "/Stickit/today" },
    })
  );
});

// Click event: focus or open the app
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) || "/Stickit/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
```

- [ ] **Step 3: Install workbox-precaching**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm install workbox-precaching
```

- [ ] **Step 4: Build verification**

```bash
npm run build
```
Should produce `dist/sw.js`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(sw): custom service worker with push handler"
```

---

## Task 11: usePush hook + Settings UI

**Files:**
- Create: `src/hooks/usePush.ts`
- Create: `src/components/settings/NotificationSettings.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: usePush hook**

`src/hooks/usePush.ts`:
```ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function usePush() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
    })();
  }, []);

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) throw new Error("VITE_VAPID_PUBLIC_KEY not set");
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const json = sub.toJSON();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("not authenticated");
      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: json.keys?.p256dh ?? "",
        auth: json.keys?.auth ?? "",
        user_agent: navigator.userAgent,
      }, { onConflict: "user_id,endpoint" });
      setSubscribed(true);
    } finally {
      setBusy(false);
    }
  };

  const unsubscribe = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } finally {
      setBusy(false);
    }
  };

  return { permission, subscribed, busy, subscribe, unsubscribe };
}
```

- [ ] **Step 2: NotificationSettings component**

`src/components/settings/NotificationSettings.tsx`:
```tsx
import { usePush } from "@/hooks/usePush";

export function NotificationSettings() {
  const { permission, subscribed, busy, subscribe, unsubscribe } = usePush();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[17px] font-semibold tracking-tight">通知</h3>
      </div>
      {permission === "unsupported" && (
        <p className="text-ink-3 font-mono text-[13.5px]">// このブラウザは通知に対応していません</p>
      )}
      {permission !== "unsupported" && (
        <div className="border border-border rounded p-4 space-y-3">
          <div className="text-[14.5px]">
            状態:
            <span className="ml-2 font-mono text-[13.5px] text-ink-3">
              {subscribed ? "✅ 購読中" : permission === "denied" ? "❌ ブロック中" : "未購読"}
            </span>
          </div>
          {!subscribed && permission !== "denied" && (
            <button onClick={subscribe} disabled={busy} className="px-4 py-2 bg-ink text-white rounded font-medium text-[14.5px] hover:bg-black disabled:opacity-50">
              {busy ? "登録中…" : "通知を有効にする"}
            </button>
          )}
          {subscribed && (
            <button onClick={unsubscribe} disabled={busy} className="px-4 py-2 border border-border rounded font-medium text-[14.5px] hover:bg-bg-2 disabled:opacity-50">
              通知を停止
            </button>
          )}
          {permission === "denied" && (
            <p className="text-[13.5px] text-ink-3">ブラウザの設定から通知を許可してください。</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add to Settings page**

In `src/pages/Settings.tsx`, add import:
```tsx
import { NotificationSettings } from "@/components/settings/NotificationSettings";
```

Add a new `<section>` inside the existing `<div className="space-y-8">`:
```tsx
<section>
  <NotificationSettings />
</section>
```

- [ ] **Step 4: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: push notification subscription UI in Settings"
```

---

## Task 12: Edge Function — send-reminders

**Files:**
- Create: `supabase/functions/send-reminders/index.ts`
- Create: `supabase/functions/send-reminders/deno.json`

- [ ] **Step 1: deno.json**

```json
{
  "imports": {
    "@supabase/supabase-js": "jsr:@supabase/supabase-js@2",
    "web-push": "npm:web-push@3.6.7"
  }
}
```

- [ ] **Step 2: Edge Function**

`supabase/functions/send-reminders/index.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:no-reply@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async () => {
  // Find pending reminders due now
  const nowIso = new Date().toISOString();
  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("id, task_id, user_id, remind_at, tasks(title, due_at)")
    .lte("remind_at", nowIso)
    .is("sent_at", null)
    .limit(200);

  if (error) return new Response(`Query error: ${error.message}`, { status: 500 });
  if (!reminders || reminders.length === 0) return new Response("no reminders");

  let sent = 0;
  for (const r of reminders as any[]) {
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", r.user_id);
    if (!subs || subs.length === 0) {
      await supabase.from("reminders").update({ sent_at: nowIso }).eq("id", r.id);
      continue;
    }
    const payload = JSON.stringify({
      title: r.tasks?.title ?? "リマインダー",
      body: r.tasks?.due_at ? `期限: ${new Date(r.tasks.due_at).toLocaleString("ja-JP")}` : undefined,
      tag: `task-${r.task_id}`,
      url: "/Stickit/today",
    });
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as any, payload);
        sent++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
        }
      }
    }
    await supabase.from("reminders").update({ sent_at: nowIso }).eq("id", r.id);
  }

  return new Response(JSON.stringify({ processed: reminders.length, sent }));
});
```

- [ ] **Step 3: Deploy via Supabase MCP**

Use `mcp__supabase__deploy_edge_function` with project id `mhvweowjjocnbmpvpjwi`, function name `send-reminders`, and the file contents.

- [ ] **Step 4: Test invocation manually**

In Supabase dashboard → Edge Functions → send-reminders → Invoke. Should return `"no reminders"` if no pending rows. If it returns 500, check the function logs and ensure VAPID env vars are set.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: send-reminders Edge Function with web-push"
```

---

## Task 13: pg_cron schedule (every minute)

**Files:** none (configuration only)

- [ ] **Step 1: Enable pg_cron + pg_net extensions**

Use Supabase MCP `mcp__supabase__list_extensions` to check, then `mcp__supabase__execute_sql`:
```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;
```

- [ ] **Step 2: Schedule the job**

Get the function URL: `https://mhvweowjjocnbmpvpjwi.supabase.co/functions/v1/send-reminders`.

Get the anon key (already in env). Better: use service_role for cron call so RLS doesn't get in the way (service role bypasses RLS).

Run via `execute_sql`:
```sql
select cron.schedule(
  'stickit-send-reminders',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://mhvweowjjocnbmpvpjwi.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true),
      'Content-Type', 'application/json'
    )
  ) as request_id;
  $$
);
```

(If `current_setting` for service role key doesn't work, hardcode the service role key — DO NOT commit it to git.)

- [ ] **Step 3: Verify schedule**

```sql
select * from cron.job where jobname = 'stickit-send-reminders';
```

- [ ] **Step 4: Commit a note**

There's no code change. Document in `supabase/migrations/0005_schedule_reminders.sql` (for posterity, even though pg_cron state is not migration-managed):
```sql
-- Cron: every minute, invoke send-reminders Edge Function.
-- Run manually via Supabase SQL editor (not auto-applied):
--
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule('stickit-send-reminders', '* * * * *',
--   $$ select net.http_post(
--     url := 'https://mhvweowjjocnbmpvpjwi.supabase.co/functions/v1/send-reminders',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || '<SERVICE_ROLE_KEY>',
--       'Content-Type', 'application/json'
--     )
--   ); $$
-- );
```

```bash
git add -A && git commit -m "docs: pg_cron schedule for send-reminders (manual setup)"
```

---

## Task 14: End-to-end verification

- [ ] **Step 1: In production, register push subscription**

Login at https://nkhtnkht-ops.github.io/Stickit/ → Settings → 「通知を有効にする」 → grant browser permission. Check Supabase `push_subscriptions` table has 1 row.

- [ ] **Step 2: Create a test task with a 5-minute reminder**

In TaskForm, set due_at to "5 minutes from now" and pick "5 分前" (so it fires immediately). Save. Check `reminders` table: 1 row should appear with `remind_at` ≈ now.

- [ ] **Step 3: Wait for cron to fire (within 1 minute)**

Check `reminders.sent_at` becomes non-null. A push notification should appear in the OS notification center. Click → opens the Stickit app.

- [ ] **Step 4: Optional — manually invoke Edge Function**

If you don't want to wait: in Supabase dashboard → Edge Functions → send-reminders → "Run" to fire immediately.

- [ ] **Step 5: Push final commit + memory note**

```bash
git push
```

---

## Verification checklist

- [ ] Recurrence: 毎日タスクを完了 → 翌日同時刻に新タスクが自動生成される
- [ ] TaskItem: 繰り返しタスクに 🔁、リマインダー設定済みに 🔔 表示
- [ ] Settings: 「通知を有効にする」ボタンでブラウザ通知許可ダイアログ → 許可後「✅ 購読中」表示
- [ ] リマインダー: 期限の指定時間前に OS 通知が出る
- [ ] 通知タップで Stickit アプリにフォーカス

---

## Out of scope (Plan 4)

添付ファイル (Storage)、シフトPDF取込、TickTickインポート。
