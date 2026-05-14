# Stickit Views & UX Implementation Plan (Plan 2)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stickit にユーザー可視の主要ビューを追加 — Projects/Tags の CRUD、カレンダー（日/週/月、月は TickTick 風連続スクロール）、付箋ボード、付箋ポップアウト窓まで。Plan 1 の foundation を土台に、設計モック (`mocks/preview-tech-*.html`) のビジュアル仕様を忠実に実装する。

**Architecture:** 既存 Layout/Sidebar/useTasks に乗せる形で、`src/components/calendar/`, `src/components/sticky/`, `src/components/projects/`, `src/components/tags/` を追加。カレンダーは外部ライブラリを使わず自前実装（モックの連続スクロール挙動・他月ミュート・週6行固定を正確に出すため）。Popout は同 SPA を `?popout=1&project=xxx` で開く `window.open()` 方式。

**Tech Stack:** 既存 (React 18, Vite, TypeScript, Tailwind w/ tokens, Supabase, React Router). 新規ライブラリは追加しない。

## Design System Reference（必読）

全UIタスクは Plan 1 と同じく `mocks/preview-tech-*.html` を視覚リファレンスとして実装。

| タスク群 | 参照モック |
|---|---|
| Settings (Projects/Tags) | 設計書 §5'のサイドバー・「設定」想定（モック未作成。簡素な list + dialog で OK） |
| カレンダー（日/週/月） | `mocks/preview-tech-calendar.html` |
| 付箋ボード | `mocks/preview-tech-sticky.html` |
| ポップアウト窓 | `mocks/preview-tech-popout-flow.html` の右下 floating popout |
| TaskItem 拡張（プロジェクト色チップ） | `mocks/preview-tech.html` の `.task` 行 |

設計トークン（colors/fonts/shadow）は Plan 1 で `tailwind.config.ts` に反映済み。プロジェクトカラーは UI で動的に設定可能（HEX 文字列）にする。デフォルト色は `#94a3b8` (DB default)。

## File Structure

```
src/
├─ hooks/
│  ├─ useProjects.ts                NEW - Projects CRUD
│  ├─ useTags.ts                    NEW - Tags CRUD
│  └─ useTasks.ts                   MODIFY - add project_id filter
├─ utils/
│  ├─ dateRange.ts                  EXISTS
│  └─ calendar.ts                   NEW - week start, month grid generator (TDD)
├─ pages/
│  ├─ Calendar.tsx                  NEW - route /calendar, view switcher
│  ├─ Sticky.tsx                    NEW - route /sticky, project tabs
│  ├─ Popout.tsx                    NEW - route /popout, minimal sticky list
│  └─ Settings.tsx                  NEW - route /settings, projects/tags CRUD
├─ components/
│  ├─ calendar/
│  │  ├─ MonthView.tsx              NEW - continuous scroll, 6 weeks fixed
│  │  ├─ WeekView.tsx               NEW - timegrid 07:00-22:00, now-line
│  │  └─ DayView.tsx                NEW - timegrid + side stats
│  ├─ sticky/
│  │  ├─ StickyBoard.tsx            NEW - project tabs + card grid
│  │  ├─ StickyCard.tsx             NEW - individual sticky tile
│  │  └─ PopoutButton.tsx           NEW - opens window.open
│  ├─ projects/
│  │  ├─ ProjectList.tsx            NEW
│  │  └─ ProjectForm.tsx            NEW - create/edit modal
│  ├─ tags/
│  │  ├─ TagList.tsx                NEW
│  │  └─ TagForm.tsx                NEW
│  ├─ tasks/
│  │  └─ TaskItem.tsx               MODIFY - project chip + tag display
│  ├─ Sidebar.tsx                   MODIFY - replace dummy projects with useProjects
│  └─ Layout.tsx                    EXISTS
└─ App.tsx                          MODIFY - add new routes
```

---

## Task 1: useProjects hook (CRUD on projects table)

**Files:**
- Create: `src/hooks/useProjects.ts`

- [ ] **Step 1: Implement hook**

```ts
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
```

- [ ] **Step 2: Verify build**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add useProjects hook"
```

---

## Task 2: useTags hook

**Files:**
- Create: `src/hooks/useTags.ts`

- [ ] **Step 1: Implement**

```ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

export type Tag = Database["public"]["Tables"]["tags"]["Row"];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true });
    if (error) setError(error.message);
    else setTags(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const createTag = async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("not authenticated");
    const { data, error } = await supabase
      .from("tags")
      .insert({ name: name.trim(), user_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await fetchAll();
    return data;
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from("tags").delete().eq("id", id);
    if (error) throw error;
    await fetchAll();
  };

  return { tags, loading, error, createTag, deleteTag, refetch: fetchAll };
}
```

- [ ] **Step 2: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: add useTags hook"
```

---

## Task 3: Extend useTasks with project_id filter

**Files:**
- Modify: `src/hooks/useTasks.ts`

- [ ] **Step 1: Add `project_id?: string | "none"` to TaskFilter and apply in query**

Edit `src/hooks/useTasks.ts`. Locate the existing `TaskFilter` type and `fetchTasks` function. Update:

```ts
export type TaskFilter = {
  from?: Date;
  to?: Date;
  status?: "open" | "done" | "all";
  project_id?: string | "none";  // "none" = unassigned tasks
};

// In fetchTasks, after the date filters, add:
if (filter.project_id === "none") q = q.is("project_id", null);
else if (filter.project_id) q = q.eq("project_id", filter.project_id);
```

(Find the existing fetchTasks deps array and add `filter.project_id` to it.)

- [ ] **Step 2: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(useTasks): add project_id filter"
```

---

## Task 4: Settings page — Projects management UI

**Files:**
- Create: `src/pages/Settings.tsx`
- Create: `src/components/projects/ProjectList.tsx`
- Create: `src/components/projects/ProjectForm.tsx`
- Modify: `src/App.tsx` (add /settings route)

- [ ] **Step 1: ProjectForm modal**

`src/components/projects/ProjectForm.tsx`:
```tsx
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Project } from "@/hooks/useProjects";

const PRESET_COLORS = [
  "#00C853", "#EF4444", "#F97316", "#3B82F6", "#8B5CF6",
  "#EC4899", "#94A3B8", "#0A0A0A",
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | null;
  onSubmit: (input: { name: string; color: string }) => Promise<void>;
};

export function ProjectForm({ open, onOpenChange, project, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setColor(project?.color ?? PRESET_COLORS[0]);
    }
  }, [open, project]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), color });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => onOpenChange(false)}>
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-4 mb-1">// {project ? "edit project" : "new project"}</div>
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] mb-3">{project ? "プロジェクトを編集" : "新規プロジェクト"}</h2>
      <form onSubmit={handle} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="プロジェクト名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[14px] focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
        />
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-3 mb-2">// カラー</div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded ${color === c ? "ring-2 ring-offset-2 ring-ink" : ""}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-3 py-1.5 text-[12.5px] text-ink-2 hover:bg-bg-2 rounded font-medium">キャンセル</button>
          <button type="submit" disabled={busy} className="px-3 py-1.5 text-[12.5px] bg-ink text-white rounded font-medium hover:bg-black disabled:opacity-50">{project ? "保存" : "追加"}</button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: ProjectList**

`src/components/projects/ProjectList.tsx`:
```tsx
import { useState } from "react";
import { useProjects, type Project } from "@/hooks/useProjects";
import { ProjectForm } from "./ProjectForm";

export function ProjectList() {
  const { projects, loading, createProject, updateProject, deleteProject } = useProjects();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);

  const handleSubmit = async (input: { name: string; color: string }) => {
    if (editing) await updateProject(editing.id, input);
    else await createProject(input);
    setEditing(null);
  };

  const handleDelete = async (p: Project) => {
    if (confirm(`プロジェクト「${p.name}」を削除します。配下のタスクは「未分類」に移動します。`)) {
      await deleteProject(p.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold tracking-tight">プロジェクト</h3>
        <button onClick={() => { setEditing(null); setOpen(true); }} className="text-[12px] font-medium px-2.5 py-1 bg-ink text-white rounded hover:bg-black">+ 追加</button>
      </div>
      {loading ? (
        <p className="text-ink-3 font-mono text-[12px]">// loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-ink-3 font-mono text-[12px]">// プロジェクトはありません</p>
      ) : (
        <div className="border border-border rounded">
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2 border-b border-border-2 last:border-b-0">
              <span className="w-3 h-3 rounded-sm" style={{ background: p.color ?? "#94a3b8" }} />
              <span className="flex-1 text-[13.5px] font-medium">{p.name}</span>
              <button onClick={() => { setEditing(p); setOpen(true); }} className="text-[11.5px] text-ink-3 hover:text-ink px-1.5">編集</button>
              <button onClick={() => handleDelete(p)} className="text-[11.5px] text-ink-3 hover:text-crit px-1.5">削除</button>
            </div>
          ))}
        </div>
      )}
      <ProjectForm open={open} onOpenChange={setOpen} project={editing} onSubmit={handleSubmit} />
    </div>
  );
}
```

- [ ] **Step 3: Settings page (projects only for now, tags added Task 5)**

`src/pages/Settings.tsx`:
```tsx
import { ProjectList } from "@/components/projects/ProjectList";

export default function Settings() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="font-mono text-[10.5px] text-ink-3 mb-2">// settings</div>
      <h1 className="text-[28px] font-semibold tracking-[-0.025em] leading-tight mb-6">設定</h1>
      <div className="space-y-8">
        <section>
          <ProjectList />
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add /settings route to App.tsx**

In `src/App.tsx`, inside the protected `<Route element={<ProtectedRoute><Layout/></ProtectedRoute>}>` block, add (and add the import at top):

```tsx
import Settings from "@/pages/Settings";
// inside Routes:
<Route path="/settings" element={<Settings />} />
```

- [ ] **Step 5: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: add Settings page with Projects CRUD"
```

---

## Task 5: Settings page — Tags management UI

**Files:**
- Create: `src/components/tags/TagList.tsx`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: TagList component (inline create, no modal needed for tags)**

`src/components/tags/TagList.tsx`:
```tsx
import { useState } from "react";
import { useTags, type Tag } from "@/hooks/useTags";

export function TagList() {
  const { tags, loading, createTag, deleteTag } = useTags();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createTag(name);
      setName("");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (t: Tag) => {
    if (confirm(`タグ「#${t.name}」を削除しますか？`)) {
      await deleteTag(t.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold tracking-tight">タグ</h3>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          placeholder="新規タグ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border border-border rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-ink"
        />
        <button type="submit" disabled={busy || !name.trim()} className="px-3 py-1.5 text-[12.5px] bg-ink text-white rounded font-medium hover:bg-black disabled:opacity-50">+ 追加</button>
      </form>
      {loading ? (
        <p className="text-ink-3 font-mono text-[12px]">// loading…</p>
      ) : tags.length === 0 ? (
        <p className="text-ink-3 font-mono text-[12px]">// タグはありません</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {tags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5 bg-bg-2 px-2.5 py-1 rounded text-[12px] font-medium text-ink-2">
              #{t.name}
              <button onClick={() => handleDelete(t)} className="text-ink-4 hover:text-crit">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add TagList to Settings page**

In `src/pages/Settings.tsx` add the import and another `<section>` block:
```tsx
import { TagList } from "@/components/tags/TagList";
// add inside the space-y-8 div, after the Projects section:
<section>
  <TagList />
</section>
```

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: add Tags CRUD to Settings page"
```

---

## Task 6: Sidebar — replace dummy projects with real useProjects, link Settings

**Files:**
- Modify: `src/components/Sidebar.tsx`

- [ ] **Step 1: Replace the dummy data block**

In `src/components/Sidebar.tsx`, find the `dummyProjects` constant and the projects rendering block. Replace with:

```tsx
import { useProjects } from "@/hooks/useProjects";
import { useTags } from "@/hooks/useTags";

// inside the Sidebar component, replace dummy with:
const { projects } = useProjects();
const { tags } = useTags();

// In JSX, replace the project rendering with:
<div className="px-1">
  <div className="font-mono text-[10px] uppercase tracking-wider text-ink-4 px-2 py-1.5">// プロジェクト</div>
  {projects.length === 0 && (
    <div className="px-2 py-1.5 text-[11.5px] text-ink-4 font-mono">// 未作成</div>
  )}
  {projects.map((p) => (
    <NavLink
      key={p.id}
      to={`/project/${p.id}`}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium transition-colors ${
          isActive ? "bg-ink text-white" : "text-ink-2 hover:bg-bg-2 hover:text-ink"
        }`
      }
    >
      <span className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: p.color ?? "#94a3b8" }} />
      {p.name}
    </NavLink>
  ))}
</div>

{tags.length > 0 && (
  <div className="px-1">
    <div className="font-mono text-[10px] uppercase tracking-wider text-ink-4 px-2 py-1.5">// タグ</div>
    {tags.map((t) => (
      <button key={t.id} className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium text-ink-2 hover:bg-bg-2 hover:text-ink transition-colors">
        <span className="font-mono text-ink-4">#</span>{t.name}
      </button>
    ))}
  </div>
)}
```

(Also: in the existing tools section, change the "設定" button to a `<NavLink to="/settings">` with the same icon. Replace `<button>` wrapping the gear icon with NavLink.)

- [ ] **Step 2: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(sidebar): wire real projects/tags + settings link"
```

---

## Task 7: TaskItem — show project chip + tags

**Files:**
- Modify: `src/components/tasks/TaskItem.tsx`

- [ ] **Step 1: Extend TaskItem to take projects/tags maps**

Currently TaskItem only shows title + due time + priority. Extend it to receive a project (optional) and tag names array (optional).

Edit `src/components/tasks/TaskItem.tsx`:
```tsx
import type { Task } from "@/hooks/useTasks";
import type { Project } from "@/hooks/useProjects";

type Props = {
  task: Task;
  project?: Project | null;
  tagNames?: string[];
  onToggle: (t: Task) => void;
  onClick?: (t: Task) => void;
  onDelete?: (id: string) => void;
};

const PRI_BAR = ["", "bg-info", "bg-warn", "bg-crit"];
const PRI_BADGE = ["", "P2", "P1", "P0"];

function formatDue(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
}

export function TaskItem({ task, project, tagNames, onToggle, onClick, onDelete }: Props) {
  const done = task.status === "done";
  const pri = task.priority ?? 0;
  return (
    <div
      onClick={() => onClick?.(task)}
      className="grid grid-cols-[18px_1fr_auto] items-center gap-3 px-3 py-2.5 rounded-md border border-transparent hover:bg-surface hover:border-border cursor-pointer relative"
    >
      {pri > 0 && <div className={`absolute left-0 top-2 bottom-2 w-0.5 rounded ${PRI_BAR[pri]}`} />}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggle(task); }}
        aria-label="toggle done"
        className={`w-[17px] h-[17px] rounded border-[1.4px] grid place-items-center transition-colors ${
          done ? "bg-accent border-accent" : "border-ink-5 bg-surface hover:border-accent"
        }`}
      >
        {done && (
          <span className="block w-2 h-1 border-l-[1.6px] border-b-[1.6px] border-white -translate-y-px translate-x-px -rotate-45" />
        )}
      </button>

      <div className="flex flex-col gap-0.5 min-w-0">
        <div className={`text-[13.5px] font-medium leading-tight ${done ? "line-through text-ink-4" : "text-ink"}`}>
          {task.title}
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-4 flex-wrap">
          <span>{formatDue(task.due_at)}</span>
          {project && (
            <>
              <span className="text-ink-5">·</span>
              <span
                className="inline-flex items-center gap-1 px-1.5 py-px rounded font-medium"
                style={{ background: `${project.color}1F`, color: project.color ?? "#94a3b8" }}
              >
                <span className="w-1.5 h-1.5 rounded-sm" style={{ background: project.color ?? "#94a3b8" }} />
                {project.name}
              </span>
            </>
          )}
          {tagNames && tagNames.length > 0 && (
            <>
              <span className="text-ink-5">·</span>
              {tagNames.map((n) => (
                <span key={n} className="text-accent-deep">#{n}</span>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {pri > 0 && (
          <span className={`font-mono text-[10px] px-1.5 py-px rounded font-medium ${
            pri === 3 ? "bg-crit-soft text-[#991B1B]" : "bg-bg-2 text-ink-3"
          }`}>{PRI_BADGE[pri]}</span>
        )}
        {onDelete && (
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-ink-4 hover:text-crit text-sm px-1" aria-label="delete">×</button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update TaskList to pass project lookup**

In `src/components/tasks/TaskList.tsx`, import `useProjects` and pass project to each TaskItem:
```tsx
import { useProjects } from "@/hooks/useProjects";
// inside TaskList:
const { projects } = useProjects();
const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
// in the map:
<TaskItem
  key={t.id}
  task={t}
  project={t.project_id ? projectMap[t.project_id] : null}
  onToggle={...}
  ...
/>
```

(Tags wired in Task 13 when we add task_tags relation. For now omit tagNames.)

- [ ] **Step 3: Extend TaskForm to choose project**

Edit `src/components/tasks/TaskForm.tsx`. Add project selector after the priority select. Update onSubmit type.

```tsx
import { useProjects } from "@/hooks/useProjects";

// In component, top:
const { projects } = useProjects();
const [projectId, setProjectId] = useState<string | "none">("none");

// In useEffect when open:
setProjectId(task?.project_id ?? "none");

// Update Props.onSubmit type to include project_id:
onSubmit: (input: { title: string; memo: string | null; due_at: string | null; priority: number; project_id: string | null }) => Promise<void>;

// In handle, include project_id:
await onSubmit({
  ...,
  project_id: projectId === "none" ? null : projectId,
});

// JSX: add a select below the priority select
<select value={projectId} onChange={(e) => setProjectId(e.target.value as string | "none")} className="border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:border-ink">
  <option value="none">プロジェクトなし</option>
  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
```

(Also update `TaskList.tsx`'s handleSubmit signature to accept project_id and pass through to createTask/updateTask.)

- [ ] **Step 4: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(task): show project chip in TaskItem + project picker in TaskForm"
```

---

## Task 8: calendar utils (TDD)

**Files:**
- Create: `src/utils/calendar.ts`
- Create: `tests/utils/calendar.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/utils/calendar.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { weekStart, weekDays, monthGridSlots, jstYmd } from "@/utils/calendar";

describe("calendar utils (JST)", () => {
  // Reference: 2026-05-13 Wed (JST 12:00) = 2026-05-13T03:00:00Z
  const ref = new Date("2026-05-13T03:00:00Z");

  it("weekStart returns the previous Sunday at JST 00:00", () => {
    const ws = weekStart(ref);
    // 5/13 Wed → previous Sun = 5/10
    expect(jstYmd(ws)).toBe("2026-05-10");
  });

  it("weekDays returns 7 dates Sun..Sat", () => {
    const days = weekDays(weekStart(ref));
    expect(days).toHaveLength(7);
    expect(jstYmd(days[0])).toBe("2026-05-10");
    expect(jstYmd(days[6])).toBe("2026-05-16");
  });

  it("monthGridSlots(ref, 6) returns 42 days starting from week containing 5/1", () => {
    const slots = monthGridSlots(ref, 6);
    expect(slots).toHaveLength(42);
    // First day: previous Sunday relative to 5/1 = 4/26
    expect(jstYmd(slots[0])).toBe("2026-04-26");
    // Day index 17 = first row+ second row + 4 days = 5/13 (today)
    expect(jstYmd(slots[17])).toBe("2026-05-13");
  });

  it("jstYmd formats UTC date as JST YYYY-MM-DD", () => {
    expect(jstYmd(new Date("2026-05-13T15:00:00Z"))).toBe("2026-05-14");
    expect(jstYmd(new Date("2026-05-13T14:59:00Z"))).toBe("2026-05-13");
  });
});
```

- [ ] **Step 2: Run tests, verify FAIL**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run test:run -- tests/utils/calendar.test.ts
```
Expected: fails with "Cannot find module '@/utils/calendar'".

- [ ] **Step 3: Implement**

`src/utils/calendar.ts`:
```ts
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function jstMidnight(d: Date): Date {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - JST_OFFSET_MS);
}

/** Returns YYYY-MM-DD in JST. */
export function jstYmd(d: Date): string {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Returns the JST midnight of the Sunday on or before the given date. */
export function weekStart(d: Date): Date {
  const mid = jstMidnight(d);
  const jstDow = new Date(mid.getTime() + JST_OFFSET_MS).getUTCDay(); // 0=Sun
  return new Date(mid.getTime() - jstDow * DAY_MS);
}

/** 7 sequential JST midnights starting from `start` (Sun). */
export function weekDays(start: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
}

/**
 * Returns N*7 dates representing N weeks of grid for the month containing `ref`.
 * Starts from the Sunday of the week containing day 1.
 */
export function monthGridSlots(ref: Date, weeks: number): Date[] {
  // First day of ref's JST month
  const jst = new Date(ref.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear();
  const month = jst.getUTCMonth();
  const firstUtc = new Date(Date.UTC(year, month, 1, 0, 0, 0)).getTime() - JST_OFFSET_MS;
  const start = weekStart(new Date(firstUtc));
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getTime() + i * DAY_MS));
}
```

- [ ] **Step 4: Run tests, verify PASS**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run test:run
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add calendar date utilities (TDD)"
```

---

## Task 9: Calendar page shell + view selector

**Files:**
- Create: `src/pages/Calendar.tsx`
- Modify: `src/App.tsx`, `src/components/Sidebar.tsx`

- [ ] **Step 1: Create page shell**

`src/pages/Calendar.tsx`:
```tsx
import { useState } from "react";

type View = "day" | "week" | "month";

export default function Calendar() {
  const [view, setView] = useState<View>("week");

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border bg-surface flex-wrap">
        <div className="flex gap-1">
          <button className="w-8 h-8 rounded border border-border bg-surface text-ink-2 grid place-items-center text-sm hover:bg-bg-2">‹</button>
          <button className="px-3 py-1.5 rounded border border-border bg-surface text-ink-2 text-[12px] font-medium hover:bg-bg-2">今日</button>
          <button className="w-8 h-8 rounded border border-border bg-surface text-ink-2 grid place-items-center text-sm hover:bg-bg-2">›</button>
        </div>
        <div className="font-semibold text-[16px] tracking-tight">2026年 5月</div>
        <div className="ml-auto inline-flex bg-bg-2 rounded p-[3px] border border-border-2">
          {(["day", "week", "month"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-[12px] font-mono font-semibold rounded ${
                view === v ? "bg-surface text-ink shadow-xs" : "text-ink-3"
              }`}
            >
              {v === "day" ? "日" : v === "week" ? "週" : "月"}
            </button>
          ))}
        </div>
      </div>

      {/* View body (placeholder) */}
      <div className="flex-1 overflow-hidden grid place-items-center">
        <div className="text-ink-4 font-mono text-[12px]">// {view} view — Task 10/11/12 で実装</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add /calendar route**

In `src/App.tsx`, add the import and route:
```tsx
import Calendar from "@/pages/Calendar";
// inside protected routes:
<Route path="/calendar" element={<Calendar />} />
```

- [ ] **Step 3: Add Calendar nav item to Sidebar mainNav**

In `src/components/Sidebar.tsx`, locate the `mainNav` array. Insert a Calendar entry between "今後7日間" and "すべて":
```ts
{ to: "/calendar", label: "カレンダー", icon: <Ic d='<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/>' /> },
```
(Note: no `count` for calendar.)

- [ ] **Step 4: Build verification**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build
```
Must succeed. (Visual verification will happen after Tasks 10-12 are complete.)

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add Calendar page shell with view selector"
```

---

## Task 10: Calendar Month View — continuous scroll, 6 weeks fixed

**Files:**
- Create: `src/components/calendar/MonthView.tsx`
- Modify: `src/pages/Calendar.tsx`

- [ ] **Step 1: Implement MonthView**

Reference: `mocks/preview-tech-calendar.html` 月ビュー section. Key behaviors:
- 6 weeks fit exactly in viewport (row height = `(viewport - toolbar) / 6`)
- Continuous scroll showing 3+ months stacked
- DOW header sticky at top
- Day=1 cells show "5月1日" inline label
- Cells from non-currently-viewed-month are muted (`is-other-month` class)

`src/components/calendar/MonthView.tsx`:
```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { monthGridSlots, jstYmd } from "@/utils/calendar";
import { useTasks, type Task } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function jstMonth(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCMonth() + 1;
}
function jstDate(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCDate();
}
function jstYear(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCFullYear();
}

type Props = {
  /** Anchor month to render around. */
  anchor: Date;
  onPeriodChange?: (label: string) => void;
};

export function MonthView({ anchor, onPeriodChange }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Build 3 months of slots (prev, current, next) for continuous scroll
  const slots = useMemo(() => {
    const prev = new Date(anchor.getTime() - 30 * 24 * 60 * 60 * 1000);
    const next = new Date(anchor.getTime() + 30 * 24 * 60 * 60 * 1000);
    return [...monthGridSlots(prev, 6), ...monthGridSlots(anchor, 6), ...monthGridSlots(next, 6)];
  }, [anchor]);

  // Remove duplicate dates (overlapping weeks between months)
  const uniqueSlots = useMemo(() => {
    const seen = new Set<string>();
    return slots.filter((d) => {
      const k = jstYmd(d);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [slots]);

  // Today
  const todayYmd = jstYmd(new Date());

  // Current visible month (for muting non-current cells)
  const [visibleMonth, setVisibleMonth] = useState(jstMonth(anchor));
  const [visibleYear, setVisibleYear] = useState(jstYear(anchor));

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const update = () => {
      const rect = scroller.getBoundingClientRect();
      const probe = rect.top + rect.height * 0.35;
      const cells = scroller.querySelectorAll<HTMLElement>("[data-cell-ymd]");
      for (const c of cells) {
        const r = c.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) {
          const ymd = c.dataset.cellYmd!;
          const [yy, mm] = ymd.split("-").map(Number);
          if (mm !== visibleMonth || yy !== visibleYear) {
            setVisibleMonth(mm);
            setVisibleYear(yy);
            onPeriodChange?.(`${yy}年 ${mm}月`);
          }
          break;
        }
      }
    };
    update();
    scroller.addEventListener("scroll", update, { passive: true });
    return () => scroller.removeEventListener("scroll", update);
  }, [uniqueSlots, visibleMonth, visibleYear, onPeriodChange]);

  // Fetch tasks across the visible range
  const fromDate = uniqueSlots[0];
  const toDate = new Date(uniqueSlots[uniqueSlots.length - 1].getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: fromDate, to: toDate, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  // Index tasks by date
  const tasksByDate = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const t of tasks) {
      if (!t.due_at) continue;
      const key = jstYmd(new Date(t.due_at));
      (map[key] ||= []).push(t);
    }
    return map;
  }, [tasks]);

  return (
    <div className="flex flex-col h-full">
      {/* DOW header */}
      <div className="grid grid-cols-7 border-b border-border bg-surface sticky top-0 z-10">
        {DOW_LABELS.map((d, i) => (
          <div key={d} className={`px-3.5 py-2.5 text-[11.5px] font-medium ${i === 0 ? "text-crit" : i === 6 ? "text-info" : "text-ink-3"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Scroll area */}
      <div ref={scrollerRef} className="flex-1 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
        <div
          className="grid grid-cols-7"
          style={{ gridAutoRows: "calc((100vh - 142px) / 6)" }}
        >
          {uniqueSlots.map((d, i) => {
            const ymd = jstYmd(d);
            const day = jstDate(d);
            const isFirst = day === 1;
            const cellMonth = jstMonth(d);
            const cellYear = jstYear(d);
            const isOther = cellMonth !== visibleMonth || cellYear !== visibleYear;
            const isToday = ymd === todayYmd;
            const dayTasks = tasksByDate[ymd] || [];
            const isSun = i % 7 === 0;
            const isSat = i % 7 === 6;
            return (
              <div
                key={ymd}
                data-cell-ymd={ymd}
                className={`border-r border-b border-border-2 px-2 py-1 flex flex-col gap-0.5 overflow-hidden cursor-pointer hover:bg-surface-2 ${isToday ? "bg-accent-soft/40" : ""}`}
              >
                <div className="flex items-baseline gap-1 min-h-[18px]">
                  {isFirst ? (
                    <span className={`text-[12.5px] font-semibold tracking-tightish ${isOther ? "text-ink-4 opacity-55" : "text-ink"}`}>
                      {cellMonth}月{day}日
                    </span>
                  ) : (
                    <span className={`text-[12.5px] font-medium font-mono ${isOther ? "text-ink-4 opacity-55" : isSun ? "text-crit" : isSat ? "text-info" : "text-ink-2"} ${isToday ? "bg-accent-deep text-white w-5 h-5 rounded-full grid place-items-center text-[11px] font-bold" : ""}`}>
                      {day}
                    </span>
                  )}
                </div>
                {dayTasks.slice(0, 3).map((t) => {
                  const proj = t.project_id ? projectMap[t.project_id] : null;
                  const bg = proj ? `${proj.color}1F` : "var(--color-bg-2, #F4F4F4)";
                  const fg = proj ? proj.color! : "#404040";
                  return (
                    <div
                      key={t.id}
                      className={`text-[11.5px] px-2 py-px rounded font-medium overflow-hidden text-ellipsis whitespace-nowrap ${isOther ? "opacity-50" : ""}`}
                      style={{ background: bg, color: fg }}
                    >
                      {t.title}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <div className="text-[10.5px] text-ink-3 px-2 font-mono">+{dayTasks.length - 3}件</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire MonthView into Calendar page**

Edit `src/pages/Calendar.tsx`. Replace the placeholder body with:
```tsx
import { MonthView } from "@/components/calendar/MonthView";
// inside the component, top:
const [anchor] = useState(new Date());
const [period, setPeriod] = useState("");
// In the toolbar, replace "2026年 5月" with: {period || "—"}
// In the body:
<div className="flex-1 overflow-hidden">
  {view === "month" && <MonthView anchor={anchor} onPeriodChange={setPeriod} />}
  {view !== "month" && <div className="grid place-items-center h-full text-ink-4 font-mono text-[12px]">// {view} view — Task 11/12 で実装</div>}
</div>
```

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(calendar): add MonthView with continuous scroll + 6-week fixed grid"
```

---

## Task 11: Calendar Week View

**Files:**
- Create: `src/components/calendar/WeekView.tsx`
- Modify: `src/pages/Calendar.tsx`

- [ ] **Step 1: Implement WeekView with timegrid + now-line**

Reference: `mocks/preview-tech-calendar.html` 週ビュー. 07:00–22:00, current time green line.

`src/components/calendar/WeekView.tsx`:
```tsx
import { useEffect, useMemo, useState } from "react";
import { weekStart, weekDays, jstYmd } from "@/utils/calendar";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 7..22
const HOUR_PX = 56;
const DOW_LABELS_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function jstHourMinutes(d: Date): { h: number; m: number } {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  return { h: jst.getUTCHours(), m: jst.getUTCMinutes() };
}
function jstDate(d: Date): number {
  return new Date(d.getTime() + JST_OFFSET_MS).getUTCDate();
}

type Props = { anchor: Date };

export function WeekView({ anchor }: Props) {
  const start = useMemo(() => weekStart(anchor), [anchor]);
  const days = useMemo(() => weekDays(start), [start]);
  const todayYmd = jstYmd(new Date());

  const fromDate = days[0];
  const toDate = new Date(days[6].getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: fromDate, to: toDate, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  // Now-line position
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  const { h, m } = jstHourMinutes(now);
  const nowOffset = (h - 7) * HOUR_PX + (m / 60) * HOUR_PX;
  const nowYmd = jstYmd(now);

  return (
    <div className="grid grid-cols-[56px_1fr] grid-rows-[auto_1fr] h-full overflow-hidden bg-surface">
      <div className="border-r border-b border-border" />
      <div className="grid grid-cols-7 border-b border-border">
        {days.map((d, i) => {
          const ymd = jstYmd(d);
          const isToday = ymd === todayYmd;
          const isSun = i === 0, isSat = i === 6;
          return (
            <div key={ymd} className={`px-3 py-2 border-r border-border last:border-r-0 ${isToday ? "bg-accent-soft" : ""}`}>
              <div className={`font-mono text-[10.5px] uppercase tracking-wider font-semibold ${isToday ? "text-accent-deep" : isSun ? "text-crit" : isSat ? "text-info" : "text-ink-4"}`}>{DOW_LABELS_EN[i]}</div>
              <div className={`text-[17px] font-semibold tracking-tight mt-0.5 ${isToday ? "text-accent-deep" : ""}`}>{jstDate(d)}</div>
            </div>
          );
        })}
      </div>

      {/* Time labels column */}
      <div className="border-r border-border bg-surface-2 overflow-y-auto">
        {HOURS.map((h) => (
          <div key={h} className="border-b border-border-2 text-right pr-2 pt-1 font-mono text-[10px] text-ink-4 font-medium" style={{ height: HOUR_PX }}>
            {String(h).padStart(2, "0")}:00
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7 overflow-y-auto relative">
        {days.map((d) => {
          const ymd = jstYmd(d);
          const dayTasks = tasks.filter((t) => t.due_at && jstYmd(new Date(t.due_at)) === ymd);
          const isToday = ymd === todayYmd;
          return (
            <div key={ymd} className={`border-r border-border last:border-r-0 relative ${isToday ? "bg-accent-soft/20" : ""}`}>
              {HOURS.map((h) => (
                <div key={h} className="border-b border-border-2" style={{ height: HOUR_PX }} />
              ))}
              {dayTasks.map((t) => {
                const dt = new Date(t.due_at!);
                const { h: th, m: tm } = jstHourMinutes(dt);
                const top = (th - 7) * HOUR_PX + (tm / 60) * HOUR_PX;
                const proj = t.project_id ? projectMap[t.project_id] : null;
                const bg = proj ? `${proj.color}26` : "rgba(0,0,0,.06)";
                const fg = proj ? proj.color! : "#404040";
                return (
                  <div key={t.id} className="absolute left-1 right-1 rounded px-1.5 py-1 text-[11px] cursor-pointer overflow-hidden" style={{ top, minHeight: 32, background: bg, borderLeft: `3px solid ${fg}` }}>
                    <div className="font-mono text-[9.5px] opacity-70" style={{ color: fg }}>{`${String(th).padStart(2, "0")}:${String(tm).padStart(2, "0")}`}</div>
                    <div className="font-medium truncate" style={{ color: "#0A0A0A" }}>{t.title}</div>
                  </div>
                );
              })}
              {isToday && (
                <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffset }}>
                  <div className="border-t-[1.5px] border-accent" />
                  <div className="absolute -left-1.5 -top-1.5 w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 0 3px rgba(0,200,83,.18)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire into Calendar page**

In `src/pages/Calendar.tsx`:
```tsx
import { WeekView } from "@/components/calendar/WeekView";
// In the body:
{view === "week" && <WeekView anchor={anchor} />}
```

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(calendar): add WeekView with now-line"
```

---

## Task 12: Calendar Day View

**Files:**
- Create: `src/components/calendar/DayView.tsx`
- Modify: `src/pages/Calendar.tsx`

- [ ] **Step 1: Implement DayView (left side stats + right timegrid)**

`src/components/calendar/DayView.tsx`:
```tsx
import { useEffect, useMemo, useState } from "react";
import { jstYmd } from "@/utils/calendar";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOURS = Array.from({ length: 16 }, (_, i) => i + 7);
const HOUR_PX = 56;

function jstHourMinutes(d: Date) {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  return { h: jst.getUTCHours(), m: jst.getUTCMinutes() };
}

type Props = { anchor: Date };

export function DayView({ anchor }: Props) {
  const ymd = jstYmd(anchor);
  const dayStart = useMemo(() => {
    const jst = new Date(anchor.getTime() + JST_OFFSET_MS);
    jst.setUTCHours(0, 0, 0, 0);
    return new Date(jst.getTime() - JST_OFFSET_MS);
  }, [anchor]);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const { tasks } = useTasks({ from: dayStart, to: dayEnd, status: "all" });
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);

  const [now, setNow] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(id); }, []);
  const { h: nh, m: nm } = jstHourMinutes(now);
  const nowOffset = (nh - 7) * HOUR_PX + (nm / 60) * HOUR_PX;
  const isToday = jstYmd(now) === ymd;

  const open = tasks.filter((t) => t.status === "open").length;
  const done = tasks.filter((t) => t.status === "done").length;
  const high = tasks.filter((t) => (t.priority ?? 0) === 3).length;

  return (
    <div className="grid grid-cols-[280px_1fr] h-full overflow-hidden">
      <aside className="border-r border-border bg-surface-2 p-5 overflow-y-auto">
        <div className="text-[22px] font-semibold tracking-[-0.02em]">{ymd}</div>
        <div className="font-mono text-[11px] text-ink-3 mb-4">// day stats</div>
        <div className="flex flex-col gap-1.5 text-[12.5px]">
          <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2.5"><span className="font-mono font-semibold text-[15px] text-crit min-w-[28px]">{high}</span><span className="text-ink-3">優先度 高 (P0)</span></div>
          <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2.5"><span className="font-mono font-semibold text-[15px] text-warn min-w-[28px]">{open}</span><span className="text-ink-3">未完了</span></div>
          <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2.5"><span className="font-mono font-semibold text-[15px] text-accent-deep min-w-[28px]">{done}</span><span className="text-ink-3">完了</span></div>
        </div>
      </aside>
      <div className="grid grid-cols-[56px_1fr] overflow-y-auto relative">
        <div className="border-r border-border bg-surface-2">
          {HOURS.map((h) => (
            <div key={h} className="border-b border-border-2 text-right pr-2 pt-1 font-mono text-[10px] text-ink-4 font-medium" style={{ height: HOUR_PX }}>{String(h).padStart(2, "0")}:00</div>
          ))}
        </div>
        <div className="relative">
          {HOURS.map((h) => (<div key={h} className="border-b border-border-2" style={{ height: HOUR_PX }} />))}
          {tasks.filter((t) => t.due_at).map((t) => {
            const dt = new Date(t.due_at!);
            const { h, m } = jstHourMinutes(dt);
            const top = (h - 7) * HOUR_PX + (m / 60) * HOUR_PX;
            const proj = t.project_id ? projectMap[t.project_id] : null;
            const bg = proj ? `${proj.color}26` : "rgba(0,0,0,.06)";
            const fg = proj ? proj.color! : "#404040";
            return (
              <div key={t.id} className="absolute left-2 right-4 rounded px-3 py-2 text-[12.5px] cursor-pointer shadow-sm" style={{ top, minHeight: 48, background: bg, borderLeft: `3px solid ${fg}` }}>
                <div className="font-mono text-[10px] opacity-70" style={{ color: fg }}>{`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`}</div>
                <div className="font-medium" style={{ color: "#0A0A0A" }}>{t.title}</div>
              </div>
            );
          })}
          {isToday && (
            <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: nowOffset }}>
              <div className="border-t-[1.5px] border-accent" />
              <div className="absolute -left-1.5 -top-1.5 w-2.5 h-2.5 rounded-full bg-accent" style={{ boxShadow: "0 0 0 3px rgba(0,200,83,.18)" }} />
              <div className="absolute -left-12 -top-2 bg-accent text-white font-mono text-[9.5px] font-semibold px-1.5 py-px rounded">{`${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire**

In `src/pages/Calendar.tsx`:
```tsx
import { DayView } from "@/components/calendar/DayView";
// In body:
{view === "day" && <DayView anchor={anchor} />}
```
Also remove the placeholder fallback line (it's no longer needed since all 3 views are now implemented).

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat(calendar): add DayView with stats sidebar"
```

---

## Task 13: Sticky Board page

**Files:**
- Create: `src/pages/Sticky.tsx`
- Create: `src/components/sticky/StickyBoard.tsx`
- Create: `src/components/sticky/StickyCard.tsx`
- Modify: `src/App.tsx`, `src/components/Sidebar.tsx`

- [ ] **Step 1: StickyCard component**

`src/components/sticky/StickyCard.tsx`:
```tsx
import type { Task } from "@/hooks/useTasks";
import type { Project } from "@/hooks/useProjects";

type Props = { task: Task; project?: Project | null; onClick?: (t: Task) => void; onToggle?: (t: Task) => void };

const PRI_BAR = ["", "bg-info", "bg-warn", "bg-crit"];

function formatDue(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function StickyCard({ task, project, onClick, onToggle }: Props) {
  const done = task.status === "done";
  const pri = task.priority ?? 0;
  const accent = pri > 0 ? PRI_BAR[pri] : project?.color ? "" : "bg-accent";
  return (
    <div
      onClick={() => onClick?.(task)}
      className={`bg-surface border border-border rounded-md p-3.5 pt-3 relative overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all min-h-[140px] flex flex-col gap-2 ${done ? "opacity-55" : ""}`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-[3px] ${accent}`}
        style={pri === 0 && project?.color ? { background: project.color } : undefined}
      />
      <div className="font-mono text-[10.5px] text-ink-3 uppercase tracking-wider flex items-center justify-between">
        <span>{project?.name ?? "—"}</span>
        <span>{formatDue(task.due_at)}</span>
      </div>
      <div className={`font-medium text-[14px] leading-snug ${done ? "line-through text-ink-3" : "text-ink"}`}>
        {task.title}
      </div>
      <div className="mt-auto pt-2 border-t border-border-2 flex items-center gap-2 text-[10.5px] font-mono text-ink-4">
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.(task); }}
          className={`w-4 h-4 rounded border-[1.4px] grid place-items-center ${done ? "bg-accent border-accent" : "border-ink-5"}`}
          aria-label="toggle done"
        >
          {done && <span className="block w-1.5 h-1 border-l-[1.5px] border-b-[1.5px] border-white -translate-y-px translate-x-px -rotate-45" />}
        </button>
        <span>{done ? "完了" : "未完了"}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: StickyBoard component**

`src/components/sticky/StickyBoard.tsx`:
```tsx
import { useMemo, useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { StickyCard } from "./StickyCard";

type Props = { projectId?: string | "none" | "all" };

export function StickyBoard({ projectId = "all" }: Props) {
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const filter = projectId === "all" ? { status: "all" as const } : { status: "all" as const, project_id: projectId };
  const { tasks, toggleComplete, loading } = useTasks(filter);

  if (loading) return <div className="p-6 text-ink-3 font-mono text-[12px]">// loading…</div>;
  if (tasks.length === 0) return <div className="p-6 text-ink-3 font-mono text-[12px]">// このボードにタスクはありません</div>;

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3.5 p-6">
      {tasks.map((t) => (
        <StickyCard key={t.id} task={t} project={t.project_id ? projectMap[t.project_id] : null} onToggle={toggleComplete} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Sticky page with project tabs**

`src/pages/Sticky.tsx`:
```tsx
import { useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { StickyBoard } from "@/components/sticky/StickyBoard";
import { PopoutButton } from "@/components/sticky/PopoutButton";

export default function Sticky() {
  const { projects } = useProjects();
  const [tab, setTab] = useState<string | "all">("all");

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-6 py-4 border-b border-border bg-surface gap-3">
        <h1 className="text-[20px] font-semibold tracking-tight">付箋ボード</h1>
        <div className="ml-auto">
          <PopoutButton projectId={tab} />
        </div>
      </div>
      <div className="px-4 border-b border-border bg-surface flex gap-1 overflow-x-auto">
        <TabBtn label="すべて" active={tab === "all"} onClick={() => setTab("all")} />
        {projects.map((p) => (
          <TabBtn key={p.id} label={p.name} color={p.color ?? undefined} active={tab === p.id} onClick={() => setTab(p.id)} />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-bg">
        <StickyBoard projectId={tab as any} />
      </div>
    </div>
  );
}

function TabBtn({ label, color, active, onClick }: { label: string; color?: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-medium whitespace-nowrap border-b-2 -mb-px ${
        active ? "text-ink border-accent font-semibold" : "text-ink-3 border-transparent hover:text-ink-2"
      }`}
    >
      {color && <span className="w-2 h-2 rounded-sm" style={{ background: color }} />}
      {label}
    </button>
  );
}
```

- [ ] **Step 4: Add /sticky route + sidebar nav**

In `src/App.tsx`:
```tsx
import Sticky from "@/pages/Sticky";
<Route path="/sticky" element={<Sticky />} />
```

In `src/components/Sidebar.tsx` `mainNav`, add after Calendar:
```ts
{ to: "/sticky", label: "付箋ボード", icon: <Ic d='<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>' /> },
```

- [ ] **Step 5: Build + Commit (Popout button stub for now)**

Create stub `src/components/sticky/PopoutButton.tsx`:
```tsx
type Props = { projectId: string | "all" };
export function PopoutButton({ projectId }: Props) {
  const open = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/popout?project=${encodeURIComponent(projectId)}`;
    window.open(url, "stickit-popout", "width=320,height=480,resizable=yes,scrollbars=yes");
  };
  return (
    <button onClick={open} className="px-3 py-1.5 text-[12.5px] font-medium bg-surface border border-border rounded text-ink-2 hover:border-ink-5 inline-flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H3v-6M21 9V3h-6M21 3l-7 7M3 21l7-7"/></svg>
      ポップアウト
    </button>
  );
}
```

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: add Sticky Board page with project tabs"
```

---

## Task 14: Popout window

**Files:**
- Create: `src/pages/Popout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Popout page (minimal compact list)**

`src/pages/Popout.tsx`:
```tsx
import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

export default function Popout() {
  const [params] = useSearchParams();
  const projectId = params.get("project") ?? "all";
  const { session, loading } = useAuth();
  const { projects } = useProjects();
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const filter = projectId === "all"
    ? { status: "open" as const }
    : { status: "open" as const, project_id: projectId };
  const { tasks, toggleComplete } = useTasks(filter);

  useEffect(() => { document.title = `Stickit · ${projectId === "all" ? "all" : projectMap[projectId]?.name ?? "—"}`; }, [projectId, projectMap]);

  if (loading) return <div className="p-3 font-mono text-[10px] text-ink-3">// loading</div>;
  if (!session) return <Navigate to="/login" replace />;

  const projName = projectId === "all" ? "all" : projectMap[projectId]?.name ?? "—";

  return (
    <div className="bg-ink text-white min-h-screen flex flex-col">
      <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border-b border-white/10">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <span className="font-mono text-[10.5px] text-white/60 ml-1.5">stickit · {projName}</span>
        <span className="ml-auto font-mono text-[9.5px] bg-accent/20 border border-accent/35 text-accent px-1.5 py-px rounded">📌 PINNED</span>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
        {tasks.length === 0 && <div className="font-mono text-[10.5px] text-white/50 text-center py-6">// no tasks</div>}
        {tasks.map((t) => {
          const proj = t.project_id ? projectMap[t.project_id] : null;
          const accent = proj?.color ?? "#00C853";
          return (
            <div key={t.id} className="bg-white/5 border border-white/10 rounded-md px-2.5 py-2 text-[11.5px] leading-snug" style={{ borderLeftColor: accent, borderLeftWidth: 2 }}>
              <div className="font-mono text-[9.5px] text-white/50 flex justify-between mb-0.5">
                <span>{proj?.name ?? "—"}</span>
                <span>{t.due_at ? `${new Date(t.due_at).getMonth() + 1}/${new Date(t.due_at).getDate()}` : "—"}</span>
              </div>
              <div className="font-medium text-white flex items-center justify-between gap-2">
                <span>{t.title}</span>
                <button onClick={() => toggleComplete(t)} className="text-white/40 hover:text-accent">✓</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-1.5 border-t border-white/10 bg-white/5 font-mono text-[9.5px] text-white/50 flex justify-between">
        <span>{tasks.length} active</span>
        <span className="text-accent">live</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add /popout route OUTSIDE Layout**

In `src/App.tsx`, add the route OUTSIDE the layout-wrapped section so the popout doesn't show the sidebar:

```tsx
import Popout from "@/pages/Popout";
// inside Routes, between login and the protected layout block:
<Route path="/popout" element={<Popout />} />
```

(Note: Popout has its own auth check via Navigate, so it's not wrapped in ProtectedRoute.)

- [ ] **Step 3: Build + Commit**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run build && git add -A && git commit -m "feat: add Popout window page (small floating sticky list)"
```

---

## Task 15: Today page subtitle uses project counts + final integration test

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/pages/Today.tsx`

- [ ] **Step 1: Sidebar — show today/tomorrow counts dynamically**

In `src/components/Sidebar.tsx`, replace the hardcoded count: 0 entries in `mainNav` with real values. Use `useTasks` with todayRange/tomorrowRange/next7DaysRange:

```tsx
import { useTasks } from "@/hooks/useTasks";
import { todayRange, tomorrowRange, next7DaysRange } from "@/utils/dateRange";

// In Sidebar component, top:
const todayCount = useTasks(todayRange()).tasks.length;
const tomorrowCount = useTasks(tomorrowRange()).tasks.length;
const next7Count = useTasks(next7DaysRange()).tasks.length;
const allCount = useTasks({ status: "all" }).tasks.length;

// In mainNav definitions, replace count: 0 with the dynamic values.
```

(Note: this triggers 4 Supabase queries on every Sidebar render, but Plan 1 already made this acceptable. We'll batch in Plan 3 if needed.)

- [ ] **Step 2: Build + test**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit" && npm run test:run && npm run build
```
Both should succeed.

- [ ] **Step 3: Commit + push**

```bash
git add -A && git commit -m "feat(sidebar): show real task counts per nav item" && git push
```

---

## Verification checklist (after Task 15 deployed)

In production https://nkhtnkht-ops.github.io/Stickit/ logged in:

- [ ] **Settings**: 設定 ページでプロジェクトを2つ追加（例: 業務 / 個人）、タグを2つ追加
- [ ] **Tasks**: 今日に新規タスクを追加、プロジェクトを選択。一覧でプロジェクトカラーチップが表示される
- [ ] **Sidebar**: プロジェクト一覧に追加したものが表示される。各ナビアイテムに件数が出る
- [ ] **Calendar**: カレンダー画面で 日/週/月 切替できる
  - 月: 6週固定で表示、スクロールで連続、月名表示が変わる、当日は緑丸
  - 週: 07:00-22:00 のグリッド、現在時刻に緑線、タスクが時刻位置に表示
  - 日: 左に統計、右にタイムグリッド
- [ ] **Sticky Board**: 付箋ボード画面でプロジェクトタブ切替、カードグリッド表示
- [ ] **Popout**: ポップアウトボタンで小窓が開く（320×480）。背景黒、タスクリスト表示

---

## Plan 3 / Plan 4 (out of scope for this plan)

- **Plan 3 - Backend**: 繰り返しタスク (RRULE), リマインダー (Web Push + Edge Function cron)
- **Plan 4 - Integrations**: 添付ファイル (Storage), シフトPDF取込, TickTickインポート
