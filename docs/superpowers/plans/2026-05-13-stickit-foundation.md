# Stickit Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stickit MVPの基盤を作る — ログイン後にタスクをCRUDし、今日/明日/7日間/すべての各ビューで閲覧でき、GitHub Pagesにデプロイ可能な状態まで。

**Architecture:** Vite + React + TypeScript の SPA を PWA 化。Supabase で Auth/Postgres、RLS で `user_id = auth.uid()` 分離。GitHub Actions で GitHub Pages にビルド配信。

**Tech Stack:** React 18, Vite 5, TypeScript, Tailwind CSS（カスタム設計トークン）, vite-plugin-pwa, @supabase/supabase-js, React Router 6, Vitest + React Testing Library
**フォント:** Geist Sans + Geist Mono + IBM Plex Sans JP（Google Fonts CDN）

## Design System Reference（必読）

**全UIタスクは `mocks/preview-tech-*.html` を視覚リファレンスとして実装すること。** モックと見比べて差分があれば調整する。

### モック対応表
| タスク | 参照モック |
|---|---|
| ログイン (Task 8) | `mocks/preview-tech.html` のログイン画面 |
| サイドバー / Layout (Task 9) | `mocks/preview-tech.html` のサイドバー |
| TaskItem (Task 12) | `mocks/preview-tech.html` の `.task` 行 |
| TaskForm (Task 13) | TickTick詳細風（`mocks/preview-tech-popout-flow.html` の `.popup-task`） |
| TaskList / 4ページ (Task 14-15) | `mocks/preview-tech.html` の今日ビュー |

### 設計トークン（モック由来、Tailwind config に反映）
```
背景: #FAFAFA / サーフェス: #FFFFFF / セカンダリ面: #F8F8F8
ボーダー: #E8E8E8 / ボーダー薄: #EFEFEF
インク: #0A0A0A / インク2: #404040 / インク3: #737373 / インク4: #A3A3A3 / インク5: #D4D4D4
アクセント: #00C853 / アクセントソフト: #DCFCE7 / アクセント濃: #047857
P0=#EF4444赤 / P1=#F97316橙 / P2=#3B82F6青
プロジェクト色: 支配人業務(青/#1E40AF) / CC(赤/#991B1B) / OTA(黄/#92400E) / 個人(青) / シフト(紫/#5B21B6)
角丸: 6 / 10 / 14
```

### 書体
- Sans: `"Geist", "IBM Plex Sans JP", -apple-system, sans-serif`
- Mono: `"Geist Mono", "IBM Plex Sans JP", "SF Mono", monospace`
- Inter / Roboto / 游ゴシック等の汎用フォントは使用禁止

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

## Task 2: Tailwind CSS + デザイントークン（モック準拠）

**Files:**
- Create: `tailwind.config.ts`, `postcss.config.js`, `src/styles/globals.css`
- Modify: `src/main.tsx`, `tsconfig.json`, `vite.config.ts`, `index.html`

shadcn/ui CLI は使わず、モック (`mocks/preview-tech.html` 等) で確定したデザイントークンを直接 Tailwind と CSS 変数にセットする。Dialog 等のコンポーネントは必要時に Radix UI から個別導入する。

- [ ] **Step 1: Tailwind と依存をインストール**

```bash
cd "/c/Users/keiji.nakahata/Desktop/Claude/Stickit"
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

- [ ] **Step 2: index.html に Google Fonts を追加**

`index.html` の `<head>` 内に追加:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Geist:wght@400;500;600;700&family=IBM+Plex+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: tailwind.config.js を tailwind.config.ts にリネームし、モック由来の設計トークンを反映**

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist"', '"IBM Plex Sans JP"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ['"Geist Mono"', '"IBM Plex Sans JP"', '"SF Mono"', "Menlo", "monospace"],
      },
      colors: {
        bg: { DEFAULT: "#FAFAFA", 2: "#F4F4F4" },
        surface: { DEFAULT: "#FFFFFF", 2: "#F8F8F8" },
        border: { DEFAULT: "#E8E8E8", 2: "#EFEFEF" },
        ink: { DEFAULT: "#0A0A0A", 2: "#404040", 3: "#737373", 4: "#A3A3A3", 5: "#D4D4D4" },
        accent: { DEFAULT: "#00C853", soft: "#DCFCE7", deep: "#047857" },
        crit: { DEFAULT: "#EF4444", soft: "#FEE2E2" },
        warn: { DEFAULT: "#F97316", soft: "#FFEDD5" },
        info: { DEFAULT: "#3B82F6", soft: "#DBEAFE" },
        // プロジェクトカラータイント
        proj: {
          mgmt:   { bg: "#DCEAF7", fg: "#1E40AF" },
          cc:     { bg: "#FCE0E0", fg: "#991B1B" },
          ota:    { bg: "#FCEACB", fg: "#92400E" },
          event:  { bg: "#EDE3FB", fg: "#5B21B6" },
        },
      },
      borderRadius: { sm: "6px", DEFAULT: "10px", lg: "14px" },
      boxShadow: {
        xs: "0 1px 2px rgba(0,0,0,.04)",
        sm: "0 1px 3px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.03)",
        md: "0 4px 12px rgba(0,0,0,.08)",
        lg: "0 12px 28px rgba(0,0,0,.16), 0 4px 10px rgba(0,0,0,.08)",
        xl: "0 24px 48px -8px rgba(0,0,0,.20), 0 8px 16px rgba(0,0,0,.06)",
      },
      letterSpacing: { tightish: "-0.005em" },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 4: globals.css を作成**

`src/styles/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body {
    margin: 0;
    background: #FAFAFA;
    color: #0A0A0A;
    font-family: "Geist", "IBM Plex Sans JP", -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 13.5px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    letter-spacing: -0.005em;
  }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: #D4D4D4; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: #A3A3A3; }
  ::-webkit-scrollbar-track { background: transparent; }
}

@layer components {
  /* パルスドット同期インジケータ（モック共通） */
  .pulse-dot {
    @apply relative inline-block w-1.5 h-1.5 rounded-full bg-accent;
  }
  .pulse-dot::after {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 9999px;
    background: #00C853;
    opacity: .3;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: .3; }
    50% { transform: scale(1.6); opacity: 0; }
  }
}
```

- [ ] **Step 5: main.tsx で globals.css を import**

`src/main.tsx` で `import "./styles/globals.css"` を追加。古い `src/index.css` と `src/App.css` を削除。

- [ ] **Step 6: tsconfig と vite.config に @ alias を追加**

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

- [ ] **Step 7: スモーク App.tsx で書体・配色を確認**

`src/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Stickit</h1>
      <p className="font-mono text-xs text-ink-3">// design tokens loaded</p>
      <div className="flex gap-2 items-center">
        <span className="pulse-dot"></span>
        <span className="font-mono text-xs">SYNCED</span>
      </div>
      <button className="bg-ink text-white px-3 py-1.5 rounded text-sm font-medium">新規 <span className="font-mono text-[10px] text-white/50 ml-1 px-1 py-px rounded bg-white/10">N</span></button>
    </div>
  );
}
```

- [ ] **Step 8: 動作確認**

```bash
npm run dev
```
- Geist 書体でレンダリングされている（ブラウザDevToolsの Computed → font-family で確認）
- 緑のパルスドットが脈動している
- ボタンが黒地・白文字で `N` キーバッジ付き

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: setup Tailwind with tech design tokens (Geist + IBM Plex JP)"
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

- [ ] **Step 4: Login ページ作成（モック準拠 — `mocks/preview-tech.html` のログイン画面を見ながら実装）**

`src/pages/Login.tsx`:
```tsx
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
    <div className="min-h-screen grid place-items-center p-4 relative overflow-hidden">
      {/* 背景: 微妙なグリッド + 緑/青のラジアルグロー */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 20% 0%, #DCFCE7 0%, transparent 40%), radial-gradient(circle at 80% 100%, #DBEAFE 0%, transparent 40%)",
        }} />
      <div className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: "linear-gradient(#EFEFEF 1px, transparent 1px), linear-gradient(90deg, #EFEFEF 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(circle at 50% 50%, #000 20%, transparent 70%)",
        }} />

      <form onSubmit={onSubmit} className="relative w-full max-w-[380px] bg-surface border border-border rounded-lg shadow-lg p-8">
        {/* ブランド */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-[26px] h-[26px] rounded-md bg-ink text-accent grid place-items-center font-mono font-semibold text-[13px] relative">
            S
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border-2 border-surface" />
          </div>
          <span className="font-semibold text-[15px] tracking-tightish">Stickit</span>
          <span className="ml-auto font-mono text-[10px] text-ink-4 bg-bg-2 px-1.5 py-px rounded">v0.1</span>
        </div>

        <h1 className="text-[22px] font-semibold tracking-[-0.025em] leading-tight">サインイン</h1>
        <p className="text-ink-3 text-[13px] mt-1 mb-6">パスワード不要。ご登録メールにマジックリンクをお送りします。</p>

        {sent ? (
          <p className="text-[13px] text-ink-2">メールを確認してリンクをクリックしてください。</p>
        ) : (
          <>
            <label className="flex items-center gap-1.5 font-mono text-[10.5px] font-medium uppercase tracking-wider text-ink-3 mb-1.5">
              → メールアドレス
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded text-[13px] bg-surface focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
            />
            <button
              type="submit"
              className="w-full mt-4 py-2.5 bg-ink text-white rounded font-medium text-[13px] flex items-center justify-center gap-2 hover:bg-black transition-colors"
            >
              マジックリンクを送る <span className="font-mono">→</span>
            </button>
            {error && <p className="mt-3 text-crit text-[12px]">{error}</p>}
          </>
        )}

        <div className="flex items-center justify-center gap-1.5 text-ink-4 font-mono text-[10.5px] mt-5">
          <span className="pulse-dot" /> 稼働中
        </div>
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

- [ ] **Step 1: Sidebar 作成（モック準拠 — `mocks/preview-tech.html` のサイドバー）**

`src/components/Sidebar.tsx`:
```tsx
import { NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Item = { to: string; label: string; count?: number; icon: React.ReactNode };

const Ic = ({ d }: { d: string }) => (
  <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: d }} />
);

const mainNav: Item[] = [
  { to: "/today",    label: "今日",      count: 7,  icon: <Ic d='<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' /> },
  { to: "/tomorrow", label: "明日",      count: 3,  icon: <Ic d='<path d="M3 6h18M3 12h18M3 18h18"/>' /> },
  { to: "/next7",    label: "今後7日間",  count: 19, icon: <Ic d='<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>' /> },
  { to: "/all",      label: "すべて",    count: 42, icon: <Ic d='<path d="M5 6h14M5 12h14M5 18h14"/>' /> },
];

export function Sidebar() {
  const { signOut } = useAuth();
  return (
    <aside className="w-60 bg-surface border-r border-border p-2.5 pt-3.5 flex flex-col gap-4 overflow-y-auto">
      {/* ブランド */}
      <div className="flex items-center gap-2 px-2.5 pt-1">
        <div className="w-[26px] h-[26px] rounded-md bg-ink text-accent grid place-items-center font-mono font-semibold text-[13px] relative">
          S
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent border-2 border-surface" />
        </div>
        <span className="font-semibold text-[15px] tracking-tightish">Stickit</span>
        <span className="ml-auto font-mono text-[10px] text-ink-4 bg-bg-2 px-1.5 py-px rounded">v0.1</span>
      </div>

      {/* 検索（プレースホルダ — Task 別実装） */}
      <div className="mx-1 flex items-center gap-2 px-2.5 py-1.5 bg-bg-2 rounded text-ink-3 text-[12.5px]">
        <Ic d='<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>' />
        <span>タスクを検索...</span>
        <span className="ml-auto font-mono text-[10.5px] text-ink-4 bg-surface border border-border px-1.5 py-px rounded">⌘K</span>
      </div>

      {/* メインナビ */}
      <nav className="px-1 flex flex-col gap-px">
        {mainNav.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium ${
                isActive ? "bg-ink text-white" : "text-ink-2 hover:bg-bg-2 hover:text-ink"
              }`
            }
          >
            {it.icon}
            {it.label}
            {it.count !== undefined && (
              <span className={`ml-auto font-mono text-[11px] ${false ? "text-white/55" : "text-ink-4"}`}>{it.count}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* プロジェクト（Plan 1 ではダミー静的、Plan 2 で動的化） */}
      <div className="px-1">
        <div className="font-mono text-[10px] uppercase tracking-wider text-ink-4 px-2 py-1.5">// プロジェクト</div>
        {[
          { name: "支配人業務", color: "#00C853", count: 12 },
          { name: "キャプテンカップ", color: "#EF4444", count: 8 },
          { name: "OTA戦略", color: "#F97316", count: 5 },
          { name: "個人", color: "#3B82F6", count: 9 },
        ].map((p) => (
          <button key={p.name} className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded text-[13px] font-medium text-ink-2 hover:bg-bg-2 hover:text-ink">
            <span className="w-2 h-2 rounded-sm" style={{ background: p.color }} />
            {p.name}
            <span className="ml-auto font-mono text-[11px] text-ink-4">{p.count}</span>
          </button>
        ))}
      </div>

      {/* アバター */}
      <div className="mt-auto pt-3 px-2 border-t border-border flex items-center gap-2.5">
        <div className="w-[26px] h-[26px] rounded-full grid place-items-center text-white font-mono font-semibold text-[11px]"
             style={{ background: "linear-gradient(135deg, #00C853, #00A152)" }}>
          NK
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-[12.5px]">中畑 慶治</span>
          <button onClick={signOut} className="font-mono text-[10.5px] text-ink-4 hover:text-ink text-left">支配人 · 退出</button>
        </div>
      </div>
    </aside>
  );
}
```

> **Note:** 上の static なプロジェクト・タグリストは Plan 1 範囲では仮データ。Plan 2 で `useProjects`/`useTags` フックを作って動的化する。

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

- [ ] **Step 1: 実装（モック準拠 — `mocks/preview-tech.html` の `.task` 行）**

`src/components/tasks/TaskItem.tsx`:
```tsx
import type { Task } from "@/hooks/useTasks";

type Props = {
  task: Task;
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

export function TaskItem({ task, onToggle, onClick, onDelete }: Props) {
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
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-4">
          <span>{formatDue(task.due_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {pri > 0 && (
          <span className={`font-mono text-[10px] px-1.5 py-px rounded font-medium ${
            pri === 3 ? "bg-crit-soft text-[#991B1B]" : "bg-bg-2 text-ink-3"
          }`}>{PRI_BADGE[pri]}</span>
        )}
        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="text-ink-4 hover:text-crit text-sm px-1"
            aria-label="delete"
          >×</button>
        )}
      </div>
    </div>
  );
}
```

> **Note:** プロジェクト色タグ・タグ表示は Plan 2 で `tasks` テーブルに `project_id` を結合した時に追加。Plan 1 はタイトル・期限・優先度のみ。

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "feat: add TaskItem component"
```

---

## Task 13: TaskForm（追加・編集モーダル）

**Files:**
- Create: `src/components/tasks/TaskForm.tsx`

- [ ] **Step 1: 軽量モーダルラッパーを作成（shadcn は使わない）**

`src/components/ui/Modal.tsx`:
```tsx
import { ReactNode, useEffect } from "react";

type Props = { open: boolean; onClose: () => void; children: ReactNode };

export function Modal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-[420px] p-5">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TaskForm 実装（モック準拠 — `mocks/preview-tech-popout-flow.html` の `.popup-task` 構造を参考）**

`src/components/tasks/TaskForm.tsx`:
```tsx
import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
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
    <Modal open={open} onClose={() => onOpenChange(false)}>
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-ink-4 mb-1">// {task ? "edit" : "new"}</div>
      <h2 className="text-[18px] font-semibold tracking-[-0.02em] mb-3">
        {task ? "タスクを編集" : "新規タスク"}
      </h2>
      <form onSubmit={handle} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="タスクのタイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[14px] focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
        />
        <textarea
          placeholder="メモ（任意）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
          rows={3}
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={dueLocal}
            onChange={(e) => setDueLocal(e.target.value)}
            className="flex-1 border border-border rounded px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-ink"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="border border-border rounded px-3 py-2 text-[13px] focus:outline-none focus:border-ink"
          >
            <option value={0}>優先度なし</option>
            <option value={1}>P2 低</option>
            <option value={2}>P1 中</option>
            <option value={3}>P0 高</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-1.5 text-[12.5px] text-ink-2 hover:bg-bg-2 rounded font-medium"
          >キャンセル</button>
          <button
            type="submit"
            disabled={busy}
            className="px-3 py-1.5 text-[12.5px] bg-ink text-white rounded font-medium hover:bg-black disabled:opacity-50"
          >{task ? "保存" : "追加"}</button>
        </div>
      </form>
    </Modal>
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
