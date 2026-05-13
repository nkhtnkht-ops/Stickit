# Stickit — 設計ドキュメント

- 作成日: 2026-05-13
- オーナー: NK（アコーディアゴルフ 泉佐野CC 支配人）
- ステータス: 設計（実装プラン未作成）

## 1. 概要
Stickitは、TickTickの中程度互換のタスク管理PWA。個人用タスク管理に加え、シフト表からの自動タスク生成と、付箋型ビュー（ポップアウト可能）を特徴とする。

### 目的
- TickTick有料プランからの脱却（コスト削減）
- 自社業務（シフト連携等）に特化したカスタマイズの自由度
- データの自前管理

### 非目標（MVPでは扱わない）
- ポモドーロ、習慣トラッカー
- コメント、メンション、コラボレーション機能（フェーズ2）
- 自然言語入力、AIアシスタント
- 外部カレンダー（Google/Outlook）双方向同期

## 2. 利用者・利用環境
- 一次ユーザー: NK個人
- 二次ユーザー: 泉佐野CCのスタッフ（フェーズ2で協業機能、MVPでは各自個人タスク管理として利用）
- デバイス: PCブラウザ（仕事PC・自宅PC）、スマホ（iPhone/Android PWA）

## 3. 機能スコープ（MVP）

### コアタスク管理
- タスクCRUD（タイトル、メモ、期限日時、開始日時）
- プロジェクト（リスト）分類、色設定可
- タグ（複数付与可）
- 優先度（高/中/低/なし）
- 繰り返し（毎日/毎週/毎月/カスタムRRULE）
- リマインダー（Web Push通知）

### ビュー
- 今日 / 明日 / 7日間 / すべて
- プロジェクト別 / タグ別
- カレンダービュー（月・週、ドラッグで期限変更）
- 付箋ビュー（カードグリッド、ポップアウトウィンドウ可）

### 添付ファイル
- タスクに画像/PDF等を添付（Supabase Storage）
- ユーザーごとにバケット内パスを分離

### 付箋ビュー
- プロジェクト/タグを選んで、タスクを付箋カード形式でグリッド表示
- カード色はプロジェクト色 or 優先度
- カード上で完了チェック・期限・メモ抜粋を表示
- 「ポップアウト」ボタンで小型別ウィンドウを `window.open()` で起動。URL: `/popout?project=<id>` 等。OS側で「常に手前」設定すれば常時表示の代わりになる。

### シフト連携
- ユーザーが自分のシフトPDFをUI経由でアップロード
- Supabase Edge Functionで解析し、勤務タスクを自動生成
- 既存ShiftToTickTickのロジックを移植

### TickTickデータ移行インポート
- TickTick公式エクスポートファイル（CSV/Backup zip）をUI経由でアップロード
- Edge Functionで解析し、プロジェクト・タグ・タスク・サブタスク・繰り返し設定をマッピングして取込
- マッピング:
  - `Folder Name`/`List Name` → projects（同名があれば再利用）
  - `Tags` → tags（カンマ区切りを分解）
  - `Title`/`Content` → tasks.title/memo
  - `Start Date`/`Due Date` → start_at/due_at（タイムゾーンはJSTに統一）
  - `Priority`(0/1/3/5) → tasks.priority(0..3)
  - `Repeat`(RRULE) → tasks.recurrence_rule
  - `Status`(0=open,2=done) → tasks.status
  - `parentId` → parent_task_id
- インポートプレビュー画面で件数・差分を確認してから確定
- 重複防止: TickTick task_idを `import_source_id` カラムに保存、再インポート時はskip
- 一回限りでなく何度でも実行可能（差分追加）

## 4. アーキテクチャ
```
[React PWA (GitHub Pages)]
        │
        ├─ Supabase Auth（マジックリンク）
        ├─ Supabase Postgres（RLSでuser_id分離）
        ├─ Supabase Storage（添付ファイル）
        └─ Supabase Edge Function
              ├─ シフトPDF→タスク変換
              └─ Web Push送信（cron毎分でリマインダーチェック）
```

### スタック詳細
- フロント: React + Vite + TypeScript + PWA (vite-plugin-pwa)
- UIライブラリ: shadcn/ui + Tailwind CSS（既存ポータルと統一）
- カレンダー: FullCalendar React
- バックエンド: Supabase（Auth / Postgres / Storage / Edge Functions）
- ホスティング: GitHub Pages
- 通知: Web Push API + Supabase Edge Function

## 5. データモデル

### テーブル
```sql
profiles (
  id uuid PK references auth.users,
  display_name text,
  role text,                -- 'manager' | 'staff'
  organization_id uuid NULL -- フェーズ2用、MVPはNULL
)

projects (
  id uuid PK,
  user_id uuid FK,
  name text,
  color text,
  organization_id uuid NULL,
  created_at, updated_at
)

tags (
  id uuid PK,
  user_id uuid FK,
  name text,
  organization_id uuid NULL
)

tasks (
  id uuid PK,
  user_id uuid FK,
  project_id uuid FK NULL,
  title text NOT NULL,
  memo text,
  due_at timestamptz NULL,
  start_at timestamptz NULL,
  priority smallint,        -- 0..3
  status text,              -- 'open' | 'done' | 'archived'
  recurrence_rule text NULL,-- iCalendar RRULE
  parent_task_id uuid NULL, -- サブタスク用
  organization_id uuid NULL,
  import_source text NULL,        -- 'ticktick' 等
  import_source_id text NULL,     -- 元システムのID（重複防止）
  completed_at timestamptz NULL,
  created_at, updated_at
)

task_tags (
  task_id uuid FK,
  tag_id uuid FK,
  PRIMARY KEY (task_id, tag_id)
)

reminders (
  id uuid PK,
  task_id uuid FK,
  remind_at timestamptz,
  sent_at timestamptz NULL
)

attachments (
  id uuid PK,
  task_id uuid FK,
  storage_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at
)

import_jobs (
  id uuid PK,
  user_id uuid FK,
  source text,              -- 'ticktick_csv' | 'ticktick_backup'
  file_path text,
  status text,              -- 'pending' | 'previewing' | 'completed' | 'failed'
  task_count int,
  created_at, completed_at
)

shift_imports (
  id uuid PK,
  user_id uuid FK,
  source_pdf_path text,
  imported_at timestamptz,
  task_count int
)

push_subscriptions (
  id uuid PK,
  user_id uuid FK,
  endpoint text,
  p256dh text,
  auth text,
  created_at
)
```

### RLS方針
- 全テーブルで `user_id = auth.uid()` を SELECT/INSERT/UPDATE/DELETE すべてに設定
- 過去事故（社内ポータルでUPDATEポリシー漏れ）を踏まえチェックリスト化
- Storage: バケット `task-attachments`、パス `{user_id}/{task_id}/{filename}` で分離

## 6. UI構成

### レイアウト
- 左: サイドバー（折りたたみ可）
  - 今日 / 明日 / 7日間 / すべて
  - カレンダー
  - プロジェクト一覧
  - タグ一覧
  - シフト取込
  - データ移行（TickTickインポート）
  - 設定
- 中央: メインビュー（リスト or カレンダー or 付箋カード）
- 右: タスク詳細パネル（スライドイン）

### 主要画面
1. **タスクリスト** — 1行表示（チェック・タイトル・期限・優先度・タグ）
2. **タスク詳細パネル** — メモ・サブタスク・添付・繰り返し・リマインダー
3. **カレンダービュー** — 月/週切替、ドラッグで期限変更
4. **付箋ビュー** — カードグリッド、ポップアウト可
5. **シフト取込** — PDFアップロード、プレビュー、確定
6. **データ移行** — TickTickエクスポートファイルアップロード、マッピング確認、プレビュー件数表示、確定実行
7. **設定** — プロフィール、通知許可、テーマ、プッシュ購読管理

## 7. 認証
- Supabase Auth マジックリンク（メールリンク）
- パスワード不要、初回ログインで `profiles` 行作成

## 8. 通知（Web Push）
- フロントで通知許可を取得し、`push_subscriptions` に保存
- Edge Function（cron毎分起動）で `reminders` を走査し、未送信かつ `remind_at <= now()` のものを送信
- ペイロード: `{ task_id, title, due_at }`、クリックで該当タスクを開く

## 9. 非機能要件
- オフライン: MVPは閲覧のみ（最後に取得したリストをService Workerでキャッシュ）。編集はオンライン必須。フェーズ2でオフライン編集キュー検討。
- パフォーマンス: 1000タスク程度を想定、ページネーション不要
- ブラウザ: Chrome/Edge/Safari最新版

## 10. フェーズ分割
### MVP（このドキュメント範囲）
個人マルチテナント、上記全機能

### フェーズ2（別スペック）
- 組織機能（`organization_id` の活用、共有プロジェクト、タスクアサイン）
- オフライン編集キュー
- 自然言語入力
- 外部カレンダー連携

## 11. やらかし回避チェックリスト
- [ ] 全テーブルにRLS UPDATE/DELETEポリシーを設定したか
- [ ] 日時はすべてJST表示・UTC保存で統一したか
- [ ] GitHub Pages デプロイ後 `git push` まで完了確認したか
- [ ] PWAマニフェスト・Service Workerの動作をブラウザで実機確認したか
- [ ] Storage RLS（user_idパス分離）を確認したか

## 12. 未決事項
- 付箋ポップアウトウィンドウの最小サイズ仕様
- カレンダービューでの繰り返しタスク表示方針（全インスタンス展開 or 親のみ）
- リマインダーcronの精度（1分で十分か）
