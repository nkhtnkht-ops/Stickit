# Stickit Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stickit MVPの基盤を作る — ログイン後にタスクをCRUDし、今日/明日/7日間/すべての各ビューで閲覧でき、GitHub Pagesにデプロイ可能な状態まで。

**Architecture:** Vite + React + TypeScript の SPA を PWA 化。Supabase で Auth/Postgres、RLS で `user_id = auth.uid()` 分離。GitHub Actions で GitHub Pages にビルド配信。

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, vite-plugin-pwa, @supabase/supabase-js, React Router 6, Vitest + React Testing Library

## File Structure

```
Stickit/
├─ .github/workflows/deploy.yml         GitHub Pages 自動デプロイ
├─ public/
│  ├─ manifest.webmanifest              PWA マニフェスト（vite-plugin-pwaで自動生成）
│  └─ icons/                            PWA アイコン
├─ supabase/
│  └─ migrations/
│     ├─ 0001_init_schema.sql           profiles/projects/tags/tasks テーブル
│     └─ 0002_rls_policies.sql          RLS ポリシー
├─ src/
│  ├─ main.tsx                          エントリポイント
│  ├─ App.tsx                           ルーティング定義
│  ├─ lib/
│  │  ├─ supabase.ts                    Supabase クライアント
│  │  └─ database.types.ts              生成された型
│  ├─ contexts/
│  │  └─ AuthContext.tsx                認証状態管理
│  ├─ components/
│  │  ├─ Layout.tsx                     左サイドバー＋メイン
│  │  ├─ Sidebar.tsx                    ナビゲーション
│  │  ├─ ProtectedRoute.tsx             未ログインなら /login へ
│  │  └─ tasks/
│  │     ├─ TaskList.tsx                タスク一覧表示
│  │     ├─ TaskItem.tsx                1タスク行
│  │     └─ TaskForm.tsx                新規/編集フォーム
│  ├─ pages/
│  │  ├─ Login.tsx                      マジックリンク送信画面
│  │  ├─ AuthCallback.tsx               リンク戻り処理
│  │  ├─ Today.tsx
│  │  ├─ Tomorrow.tsx
│  │  ├─ Next7Days.tsx
│  │  └─ All.tsx
│  ├─ hooks/
│  │  └─ useTasks.ts                    タスクCRUDフック
│  ├─ utils/
│  │  └─ dateRange.ts                   today/tomorrow/next7days 期間計算
│  └─ styles/
│     └─ globals.css                    Tailwindベース
├─ tests/
│  ├─ utils/dateRange.test.ts
│  └─ hooks/useTasks.test.ts
├─ vite.config.ts
├─ tailwind.config.ts
├─ tsconfig.json
├─ package.json
├─ index.html
└─ .env.example
```

---

## Task 1: Vite + React + TypeScript プロジェクト初期化

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Vite scaffold**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit"
npm create vite@latest . -- --template react-ts
```
途中で「現在のディレクトリ非空」と聞かれたら `Ignore files and continue` を選択。

- [ ] **Step 2: 依存をインストール**

```bash
npm install
```

- [ ] **Step 3: 動作確認**

```bash
npm run dev
```
ブラウザで http://localhost:5173 が表示されればOK。Ctrl+C で停止。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS project"
```

---

## Task 2: Tailwind CSS + shadcn/ui セットアップ

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `src/styles/globals.css`, `components.json`
- Modify: `src/main.tsx` (globals.css をimport), `tsconfig.json`, `vite.config.ts`

- [ ] **Step 1: Tailwindと依存をインストール**

```bash
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: tailwind.config.js を tailwind.config.ts にリネームし内容を置換**

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 3: globals.css を作成**

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 221 83% 53%;
    --primary-foreground: 0 0% 100%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
  }
  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --primary: 217 91% 60%;
    --primary-foreground: 222 47% 11%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 217 33% 20%;
  }
  body { @apply bg-background text-foreground; }
}
```

- [ ] **Step 4: main.tsx で globals.css をimport**

`src/main.tsx` の `import './index.css'` を `import './styles/globals.css'` に置換。古い `src/index.css` と `src/App.css` を削除。

- [ ] **Step 5: tsconfig.json と vite.config.ts に @ alias を追加**

`tsconfig.json` の `compilerOptions` に追加:
```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

`vite.config.ts`:
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 6: shadcn/ui CLI 初期化**

```bash
npx shadcn@latest init -d
```
プロンプトはデフォルト（Default style, Slate base color, CSS variables）でOK。

- [ ] **Step 7: 試しにButtonコンポーネントを追加**

```bash
npx shadcn@latest add button
```

- [ ] **Step 8: App.tsx を最小化**

`src/App.tsx`:
```tsx
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Stickit</h1>
      <Button>Hello</Button>
    </div>
  );
}
```

- [ ] **Step 9: 動作確認**

```bash
npm run dev
```
ボタンが表示されればOK。

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: setup Tailwind CSS and shadcn/ui"
```

---

## Task 3: Vitest + React Testing Library セットアップ

**Files:**
- Create: `vitest.config.ts`, `tests/setup.ts`
- Modify: `package.json` (test scripts)

- [ ] **Step 1: 依存インストール**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

- [ ] **Step 2: vitest.config.ts 作成**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
  },
});
```

- [ ] **Step 3: tests/setup.ts 作成**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: package.json の scripts に追加**

```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: スモークテストを書いて通す**

`tests/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: 実行**

```bash
npm run test:run
```
緑になることを確認。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: setup Vitest + React Testing Library"
```

---

## Task 4: Supabase プロジェクト作成 + ローカル接続

**Files:**
- Create: `.env.example`, `.env.local`（gitignore済み）, `src/lib/supabase.ts`

- [ ] **Step 1: Supabaseプロジェクト作成**

Supabase MCPまたはダッシュボードで `stickit` プロジェクトを作成（リージョン: Northeast Asia (Tokyo)）。

- [ ] **Step 2: anon key と URL を取得**

Project Settings → API から `Project URL` と `anon public key` をコピー。

- [ ] **Step 3: .env.example と .env.local 作成**

`.env.example`:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

`.env.local` には実値を記入（既に `.gitignore` 済み）。

- [ ] **Step 4: supabase-js インストール**

```bash
npm install @supabase/supabase-js
```

- [ ] **Step 5: src/lib/supabase.ts 作成**

```ts
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required");
}

export const supabase = createClient(url, key);
```

- [ ] **Step 6: 接続テスト**

`tests/lib/supabase.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { supabase } from "@/lib/supabase";

describe("supabase client", () => {
  it("is initialized", () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
  });
});
```

```bash
npm run test:run
```
PASSを確認。

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client"
```

---

## Task 5: データベーススキーマ（profiles / projects / tags / tasks）

**Files:**
- Create: `supabase/migrations/0001_init_schema.sql`

- [ ] **Step 1: マイグレーションファイル作成**

`supabase/migrations/0001_init_schema.sql`:
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text default 'staff',
  organization_id uuid,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  color text default '#94a3b8',
  organization_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  organization_id uuid,
  created_at timestamptz default now(),
  unique (user_id, name)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  project_id uuid references projects on delete set null,
  title text not null,
  memo text,
  due_at timestamptz,
  start_at timestamptz,
  priority smallint default 0,
  status text default 'open',
  recurrence_rule text,
  parent_task_id uuid references tasks on delete cascade,
  organization_id uuid,
  import_source text,
  import_source_id text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index tasks_user_due_idx on tasks (user_id, due_at);
create index tasks_user_status_idx on tasks (user_id, status);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
```

- [ ] **Step 2: マイグレーションを Supabase に適用**

Supabase MCP の `apply_migration` または ダッシュボードSQL Editor から実行。

- [ ] **Step 3: テーブル一覧を確認**

`list_tables` で profiles/projects/tags/tasks が存在することを確認。

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0001_init_schema.sql
git commit -m "feat: add initial database schema"
```

---

## Task 6: RLSポリシー

**Files:**
- Create: `supabase/migrations/0002_rls_policies.sql`

- [ ] **Step 1: RLSマイグレーション作成**

`supabase/migrations/0002_rls_policies.sql`:
```sql
alter table profiles enable row level security;
alter table projects enable row level security;
alter table tags enable row level security;
alter table tasks enable row level security;

-- profiles
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- projects
create policy "projects_select_own" on projects for select using (auth.uid() = user_id);
create policy "projects_insert_own" on projects for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on projects for update using (auth.uid() = user_id);
create policy "projects_delete_own" on projects for delete using (auth.uid() = user_id);

-- tags
create policy "tags_select_own" on tags for select using (auth.uid() = user_id);
create policy "tags_insert_own" on tags for insert with check (auth.uid() = user_id);
create policy "tags_update_own" on tags for update using (auth.uid() = user_id);
create policy "tags_delete_own" on tags for delete using (auth.uid() = user_id);

-- tasks
create policy "tasks_select_own" on tasks for select using (auth.uid() = user_id);
create policy "tasks_insert_own" on tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update_own" on tasks for update using (auth.uid() = user_id);
create policy "tasks_delete_own" on tasks for delete using (auth.uid() = user_id);
```

- [ ] **Step 2: 適用**

Supabase MCP の `apply_migration` で実行。

- [ ] **Step 3: 各テーブルでポリシーが4つ揃っていることを SQL で確認**

```sql
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, cmd;
```

profiles は2つ（select/update）、projects/tags/tasks は4つずつ存在することを確認。

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/0002_rls_policies.sql
git commit -m "feat: add RLS policies"
```

---

## Task 7: TypeScript 型生成

**Files:**
- Create: `src/lib/database.types.ts`

- [ ] **Step 1: Supabase MCPの `generate_typescript_types` で型を取得し保存**

または:
```bash
npx supabase gen types typescript --project-id <project-id> > src/lib/database.types.ts
```

- [ ] **Step 2: supabase.ts を型付きクライアントに更新**

`src/lib/supabase.ts`:
```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are required");
}

export const supabase = createClient<Database>(url, key);
```

- [ ] **Step 3: テスト**

```bash
npm run test:run
```
PASSを確認。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: generate database types"
```

---

## Task 8: AuthContext + マジックリンクログイン

**Files:**
- Create: `src/contexts/AuthContext.tsx`, `src/pages/Login.tsx`, `src/pages/AuthCallback.tsx`, `src/components/ProtectedRoute.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: react-router-dom をインストール**

```bash
npm install react-router-dom
```

- [ ] **Step 2: AuthContext 作成**

`src/contexts/AuthContext.tsx`:
```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthCtx = {
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Ctx.Provider value={{ session, loading, signInWithEmail, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: ProtectedRoute 作成**

`src/components/ProtectedRoute.tsx`:
```tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="p-8">Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 4: Login ページ作成**

`src/pages/Login.tsx`:
```tsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export default function Login() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const { error } = await signInWithEmail(email);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Stickit ログイン</h1>
        {sent ? (
          <p className="text-sm">メールを確認してリンクをクリックしてください。</p>
        ) : (
          <>
            <input
              type="email"
              required
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
            <Button type="submit" className="w-full">マジックリンクを送信</Button>
            {error && <p className="text-red-600 text-sm">{error}</p>}
          </>
        )}
      </form>
    </div>
  );
}
```

- [ ] **Step 5: AuthCallback ページ作成**

`src/pages/AuthCallback.tsx`:
```tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  useEffect(() => {
    if (!loading) navigate(session ? "/today" : "/login", { replace: true });
  }, [session, loading, navigate]);
  return <div className="p-8">Signing in...</div>;
}
```

- [ ] **Step 6: App.tsx と main.tsx を更新**

`src/main.tsx`:
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

`src/App.tsx`:
```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <div className="p-8">Logged in (placeholder)</div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 7: 動作確認**

```bash
npm run dev
```
http://localhost:5173 → /login にリダイレクト → 自分のメール入力 → マジックリンク受信 → クリックで /today 表示。

- [ ] **Step 8: Supabaseダッシュボードで Auth → URL Configuration の Redirect URLs に `http://localhost:5173/auth/callback` を追加**

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add auth context and magic link login"
```

---

## Task 9: Layout + Sidebar

**Files:**
- Create: `src/components/Layout.tsx`, `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Sidebar 作成**

`src/components/Sidebar.tsx`:
```tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/today", label: "今日" },
  { to: "/tomorrow", label: "明日" },
  { to: "/next7", label: "7日間" },
  { to: "/all", label: "すべて" },
];

export function Sidebar() {
  const { signOut } = useAuth();
  return (
    <aside className="w-56 border-r bg-muted/30 p-4 flex flex-col gap-1">
      <h1 className="text-lg font-bold mb-4">Stickit</h1>
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded text-sm ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`
          }
        >
          {it.label}
        </NavLink>
      ))}
      <div className="mt-auto">
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full">
          ログアウト
        </Button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Layout 作成**

`src/components/Layout.tsx`:
```tsx
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: App.tsx をネストルートに更新**

```tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import AuthCallback from "@/pages/AuthCallback";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/today" element={<div className="p-8">今日</div>} />
        <Route path="/tomorrow" element={<div className="p-8">明日</div>} />
        <Route path="/next7" element={<div className="p-8">7日間</div>} />
        <Route path="/all" element={<div className="p-8">すべて</div>} />
      </Route>
      <Route path="*" element={<Navigate to="/today" replace />} />
    </Routes>
  );
}
```

- [ ] **Step 4: 動作確認**

`npm run dev` → サイドバーが表示され、4ナビが切り替わる。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Layout and Sidebar"
```

---

## Task 10: dateRange ユーティリティ（TDD）

**Files:**
- Create: `src/utils/dateRange.ts`, `tests/utils/dateRange.test.ts`

- [ ] **Step 1: 失敗するテストを書く**

`tests/utils/dateRange.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { todayRange, tomorrowRange, next7DaysRange } from "@/utils/dateRange";

describe("dateRange (JST)", () => {
  const ref = new Date("2026-05-13T03:00:00Z"); // JST 12:00

  it("todayRange covers JST 00:00-24:00", () => {
    const { from, to } = todayRange(ref);
    expect(from.toISOString()).toBe("2026-05-12T15:00:00.000Z"); // JST 00:00
    expect(to.toISOString()).toBe("2026-05-13T15:00:00.000Z");   // 翌JST 00:00
  });

  it("tomorrowRange covers next JST day", () => {
    const { from, to } = tomorrowRange(ref);
    expect(from.toISOString()).toBe("2026-05-13T15:00:00.000Z");
    expect(to.toISOString()).toBe("2026-05-14T15:00:00.000Z");
  });

  it("next7DaysRange covers 7 days from today", () => {
    const { from, to } = next7DaysRange(ref);
    expect(from.toISOString()).toBe("2026-05-12T15:00:00.000Z");
    expect(to.toISOString()).toBe("2026-05-19T15:00:00.000Z");
  });
});
```

- [ ] **Step 2: テスト実行 → FAIL確認**

```bash
npm run test:run
```
"Cannot find module '@/utils/dateRange'" 等で失敗することを確認。

- [ ] **Step 3: 実装**

`src/utils/dateRange.ts`:
```ts
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function jstMidnight(d: Date): Date {
  const jst = new Date(d.getTime() + JST_OFFSET_MS);
  jst.setUTCHours(0, 0, 0, 0);
  return new Date(jst.getTime() - JST_OFFSET_MS);
}

export function todayRange(now: Date = new Date()) {
  const from = jstMidnight(now);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export function tomorrowRange(now: Date = new Date()) {
  const today = todayRange(now);
  const from = new Date(today.from.getTime() + 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  return { from, to };
}

export function next7DaysRange(now: Date = new Date()) {
  const { from } = todayRange(now);
  const to = new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
  return { from, to };
}
```

- [ ] **Step 4: テスト実行 → PASS確認**

```bash
npm run test:run
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add JST date range utilities with tests"
```

---

## Task 11: useTasks フック（CRUD）

**Files:**
- Create: `src/hooks/useTasks.ts`

- [ ] **Step 1: フック実装**

`src/hooks/useTasks.ts`:
```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add useTasks hook"
```

---

## Task 12: TaskItem コンポーネント

**Files:**
- Create: `src/components/tasks/TaskItem.tsx`

- [ ] **Step 1: 実装**

`src/components/tasks/TaskItem.tsx`:
```tsx
import type { Task } from "@/hooks/useTasks";

type Props = {
  task: Task;
  onToggle: (t: Task) => void;
  onClick?: (t: Task) => void;
  onDelete?: (id: string) => void;
};

const PRIORITY_COLOR = ["text-muted-foreground", "text-blue-500", "text-amber-500", "text-red-500"];

function formatDue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function TaskItem({ task, onToggle, onClick, onDelete }: Props) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b hover:bg-muted/50">
      <input
        type="checkbox"
        checked={task.status === "done"}
        onChange={() => onToggle(task)}
        className="h-4 w-4"
      />
      <button
        type="button"
        onClick={() => onClick?.(task)}
        className="flex-1 text-left"
      >
        <span className={task.status === "done" ? "line-through text-muted-foreground" : ""}>
          {task.title}
        </span>
        {task.due_at && (
          <span className="ml-2 text-xs text-muted-foreground">{formatDue(task.due_at)}</span>
        )}
      </button>
      <span className={`text-xs ${PRIORITY_COLOR[task.priority ?? 0]}`}>
        {["", "低", "中", "高"][task.priority ?? 0]}
      </span>
      {onDelete && (
        <button
          onClick={() => onDelete(task.id)}
          className="text-xs text-muted-foreground hover:text-red-500"
          aria-label="delete"
        >
          ×
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add TaskItem component"
```

---

## Task 13: TaskForm（追加・編集モーダル）

**Files:**
- Create: `src/components/tasks/TaskForm.tsx`

- [ ] **Step 1: shadcn dialog を追加**

```bash
npx shadcn@latest add dialog
```

- [ ] **Step 2: TaskForm 実装**

`src/components/tasks/TaskForm.tsx`:
```tsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Task } from "@/hooks/useTasks";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  onSubmit: (input: { title: string; memo: string | null; due_at: string | null; priority: number }) => Promise<void>;
};

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskForm({ open, onOpenChange, task, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [memo, setMemo] = useState("");
  const [dueLocal, setDueLocal] = useState("");
  const [priority, setPriority] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setMemo(task?.memo ?? "");
      setDueLocal(toLocalInput(task?.due_at ?? null));
      setPriority(task?.priority ?? 0);
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
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "タスク編集" : "新規タスク"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <input
            autoFocus
            required
            placeholder="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            placeholder="メモ"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
          <div className="flex gap-3">
            <input
              type="datetime-local"
              value={dueLocal}
              onChange={(e) => setDueLocal(e.target.value)}
              className="flex-1 border rounded px-3 py-2"
            />
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="border rounded px-3 py-2"
            >
              <option value={0}>優先度なし</option>
              <option value={1}>低</option>
              <option value={2}>中</option>
              <option value={3}>高</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit" disabled={busy}>{task ? "保存" : "追加"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add TaskForm dialog"
```

---

## Task 14: TaskList コンポーネント

**Files:**
- Create: `src/components/tasks/TaskList.tsx`

- [ ] **Step 1: 実装**

`src/components/tasks/TaskList.tsx`:
```tsx
import { useState } from "react";
import { useTasks, type TaskFilter, type Task } from "@/hooks/useTasks";
import { TaskItem } from "./TaskItem";
import { TaskForm } from "./TaskForm";
import { Button } from "@/components/ui/button";

type Props = { title: string; filter: TaskFilter };

export function TaskList({ title, filter }: Props) {
  const { tasks, loading, error, createTask, updateTask, toggleComplete, deleteTask } = useTasks(filter);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const handleSubmit = async (input: { title: string; memo: string | null; due_at: string | null; priority: number }) => {
    if (editing) await updateTask(editing.id, input);
    else await createTask(input);
    setEditing(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <Button onClick={() => { setEditing(null); setOpen(true); }}>+ 新規</Button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {loading ? (
        <p className="text-muted-foreground">読み込み中...</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted-foreground">タスクはありません</p>
      ) : (
        <div className="border rounded">
          {tasks.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
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
```

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add TaskList component"
```

---

## Task 15: 4つのページを実装してルーティングに接続

**Files:**
- Create: `src/pages/Today.tsx`, `src/pages/Tomorrow.tsx`, `src/pages/Next7Days.tsx`, `src/pages/All.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: ページを作成**

`src/pages/Today.tsx`:
```tsx
import { TaskList } from "@/components/tasks/TaskList";
import { todayRange } from "@/utils/dateRange";

export default function Today() {
  return <TaskList title="今日" filter={todayRange()} />;
}
```

`src/pages/Tomorrow.tsx`:
```tsx
import { TaskList } from "@/components/tasks/TaskList";
import { tomorrowRange } from "@/utils/dateRange";

export default function Tomorrow() {
  return <TaskList title="明日" filter={tomorrowRange()} />;
}
```

`src/pages/Next7Days.tsx`:
```tsx
import { TaskList } from "@/components/tasks/TaskList";
import { next7DaysRange } from "@/utils/dateRange";

export default function Next7Days() {
  return <TaskList title="7日間" filter={next7DaysRange()} />;
}
```

`src/pages/All.tsx`:
```tsx
import { TaskList } from "@/components/tasks/TaskList";

export default function All() {
  return <TaskList title="すべて" filter={{ status: "all" }} />;
}
```

- [ ] **Step 2: App.tsx のプレースホルダを置き換え**

```tsx
import Today from "@/pages/Today";
import Tomorrow from "@/pages/Tomorrow";
import Next7Days from "@/pages/Next7Days";
import All from "@/pages/All";
// ...
<Route path="/today" element={<Today />} />
<Route path="/tomorrow" element={<Tomorrow />} />
<Route path="/next7" element={<Next7Days />} />
<Route path="/all" element={<All />} />
```

- [ ] **Step 3: 動作確認**

`npm run dev` → ログイン → 各ビューでタスク追加/完了/編集/削除が動くこと、当日中の期限のものは「今日」、翌日のものは「明日」に表示されることを目視確認。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire up Today/Tomorrow/Next7/All pages"
```

---

## Task 16: PWA 化

**Files:**
- Modify: `vite.config.ts`, `package.json`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png`

- [ ] **Step 1: vite-plugin-pwa インストール**

```bash
npm install -D vite-plugin-pwa
```

- [ ] **Step 2: アイコンを用意**

`public/icons/` に 192x192 と 512x512 のPNGを配置。仮で単色でも可。

- [ ] **Step 3: vite.config.ts 更新**

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  base: "/Stickit/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
      manifest: {
        name: "Stickit",
        short_name: "Stickit",
        start_url: "/Stickit/",
        scope: "/Stickit/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#3b82f6",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
```

- [ ] **Step 4: ビルド確認**

```bash
npm run build
npm run preview
```
ブラウザの DevTools → Application → Manifest が認識されることを確認。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: enable PWA with vite-plugin-pwa"
```

---

## Task 17: GitHub Pages デプロイ

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: workflow 作成**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: GitHub リポジトリ設定**

ブラウザで https://github.com/nkhtnkht-ops/Stickit/settings/pages を開き、Source を **GitHub Actions** に設定。

- [ ] **Step 3: シークレット登録**

https://github.com/nkhtnkht-ops/Stickit/settings/secrets/actions で:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
を登録。

- [ ] **Step 4: Supabase の Auth Redirect URLs に本番URLを追加**

`https://nkhtnkht-ops.github.io/Stickit/auth/callback` を Supabase Auth → URL Configuration → Redirect URLs に追加。

- [ ] **Step 5: push してCI実行**

```bash
git add -A
git commit -m "ci: deploy to GitHub Pages"
git push
```
Actions タブで成功を確認。

- [ ] **Step 6: 本番URLにアクセス**

`https://nkhtnkht-ops.github.io/Stickit/` でログイン〜タスクCRUDまで動作確認。
（PWAインストールも試す: ブラウザのアドレスバー横の「インストール」アイコン）

- [ ] **Step 7: 完了確認**

```bash
git status
git log origin/main..HEAD
```
未push commitがゼロであることを確認。

---

## 完了基準
- [ ] ログインしてタスクをCRUDできる
- [ ] 今日/明日/7日間/すべての各ビューで期限フィルタが正しく動く
- [ ] RLSにより他ユーザーのデータが見えない（別アカウントで確認）
- [ ] GitHub Pagesに自動デプロイされ、本番URLでも同じ動作
- [ ] PWAとしてインストール可能

## 次のプラン
Plan 2: Views & UX（カレンダー、付箋ビュー、繰り返し、リマインダー、プロジェクト/タグ管理）
