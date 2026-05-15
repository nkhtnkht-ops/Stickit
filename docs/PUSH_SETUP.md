# Web Push セットアップ手順

Stickit のリマインダー機能（期限の指定時間前にプッシュ通知）を本番で動かすためのワンタイム設定。コードは既にリポジトリ内にある:

| パーツ | 場所 |
|---|---|
| カスタム Service Worker（push / notificationclick） | `src/sw.ts` |
| クライアント購読フック | `src/hooks/usePush.ts` |
| 設定ページのトグル | `src/pages/Settings.tsx` |
| Edge Function（送信処理） | `supabase/functions/send-reminders/index.ts` |
| pg_cron スケジュール | `supabase/migrations/0005_schedule_send_reminders.sql` |

---

## 1. VAPID 鍵を生成（既に完了）

このリポジトリには下記の鍵が登録済み（公開鍵のみ）:

```
publicKey:  BJgn5OSDGkyYuFa7ns1GpynhVmuUR4A_cWg5jc5Jl9Hph0ItoEBptlSlwW8NfKAT0ZacbFfvMdkn3xZtarv7E0s
privateKey: OFuGph5qbxI8MJqLd71siAOTQGRz9UzslKTE0mYcrxY
```

別の鍵に差し替えたい場合:

```bash
npx web-push generate-vapid-keys --json
```

> ⚠️ プライベート鍵は `.env.local` や Git に **絶対に** コミットしない。Supabase の Secrets にのみ入れる。

---

## 2. クライアント側（Vite + GitHub Pages）

`.env.local`（ローカル開発用）と GitHub Pages のビルド時に **公開鍵だけ** 渡す。

```env
VITE_VAPID_PUBLIC_KEY=BJgn5OSDGkyYuFa7ns1GpynhVmuUR4A_cWg5jc5Jl9Hph0ItoEBptlSlwW8NfKAT0ZacbFfvMdkn3xZtarv7E0s
```

GitHub Actions に同じ値を渡す方法は 2 通り:

- **(A) Repository Variable で公開**: `Settings → Secrets and variables → Actions → Variables → New variable` で `VITE_VAPID_PUBLIC_KEY` を作り、`.github/workflows/deploy.yml` の `env:` に追加。
- **(B) ハードコード**: 公開鍵なので `vite.config.ts` 経由で `define` するか、`.env.production` をコミット。秘匿性は不要。

---

## 3. Supabase 側 — マイグレーション

```bash
# プロジェクト紐付け（初回のみ）
supabase link --project-ref mhvweowjjocnbmpvpjwi

# 0005 を含めて適用
supabase db push
```

または Supabase Dashboard → SQL Editor で `supabase/migrations/0005_schedule_send_reminders.sql` の中身を実行。

### pg_cron が `app.settings.*` を読めるようにする

`0005_*.sql` の冒頭コメントの通り、SQL Editor で次を 1 回実行:

```sql
alter database postgres set "app.settings.project_url"      = 'https://mhvweowjjocnbmpvpjwi.supabase.co';
alter database postgres set "app.settings.service_role_key" = 'SERVICE_ROLE_KEY_HERE';
```

> ⚠️ Service Role Key は Dashboard → Project Settings → API → `service_role` の `secret`。

### スケジュール確認

```sql
select jobid, jobname, schedule, command from cron.job where jobname = 'stickit-send-reminders';
select * from cron.job_run_details order by start_time desc limit 5;
```

---

## 4. Edge Function — シークレット & デプロイ

```bash
# シークレット（プライベート鍵 + 公開鍵 + 連絡先）
supabase secrets set \
  VAPID_PUBLIC_KEY="BJgn5OSDGkyYuFa7ns1GpynhVmuUR4A_cWg5jc5Jl9Hph0ItoEBptlSlwW8NfKAT0ZacbFfvMdkn3xZtarv7E0s" \
  VAPID_PRIVATE_KEY="OFuGph5qbxI8MJqLd71siAOTQGRz9UzslKTE0mYcrxY" \
  VAPID_SUBJECT="mailto:nkhtnkht@gmail.com"

# デプロイ
supabase functions deploy send-reminders --no-verify-jwt
```

`--no-verify-jwt` は pg_net から Service Role Key の Bearer で叩くため。

### 動作確認（手動）

```bash
curl -X POST \
  -H "Authorization: Bearer SERVICE_ROLE_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{}' \
  https://mhvweowjjocnbmpvpjwi.supabase.co/functions/v1/send-reminders
```

レスポンス例:

```json
{ "ok": true, "processed": 0, "sent": 0, "failed": 0 }
```

---

## 5. 動作テスト（エンドツーエンド）

1. ビルド済みサイトを HTTPS で開く（`https://nkhtnkht-ops.github.io/Stickit/`）
2. Google でサインイン → 「設定」→「通知 / ブラウザ通知」をオン
3. 「今日」で適当なタスクを作成、期限を **2〜3 分後** に、リマインダーを **1分前** に設定
4. cron が毎分実行 → 期限の 1分前に通知が届けば成功
5. 動かない場合の見どころ:
   - DevTools → Application → Service Workers に `sw.js` が active か
   - DevTools → Application → Push Messaging で擬似 push を投げてみる
   - `cron.job_run_details` のステータス
   - Edge Function のログ: `supabase functions logs send-reminders --tail`

---

## トラブルシューティング

| 症状 | 確認 |
|---|---|
| 設定トグルが押せない（"VAPID 公開鍵が未設定です") | `VITE_VAPID_PUBLIC_KEY` がビルド時に渡っていない |
| トグルは ON だが通知が来ない | `push_subscriptions` テーブルに行があるか / Edge Function ログ |
| `cron.job_run_details` が `failed` | `app.settings.project_url` / `service_role_key` が未設定 |
| 410 Gone が大量に出る | `usePush.unsubscribe()` で削除済みのはず。手動で `delete from push_subscriptions where endpoint='...';` |
