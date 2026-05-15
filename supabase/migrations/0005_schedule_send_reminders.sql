-- Schedule the send-reminders Edge Function via pg_cron + pg_net.
--
-- Before applying this migration, set two database settings (run as superuser
-- or via the Supabase SQL editor):
--
--   alter database postgres set "app.settings.project_url" = 'https://<PROJECT_REF>.supabase.co';
--   alter database postgres set "app.settings.service_role_key" = '<SERVICE_ROLE_KEY>';
--
-- These are read at run time by the cron job below. Keeping them in DB
-- settings (instead of inlined into the schedule) means the secret never
-- appears in pg_cron.job and stays editable.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- Drop any previous schedule with the same name so this migration is rerunnable.
do $$
begin
  perform cron.unschedule('stickit-send-reminders');
exception when others then null;
end$$;

select cron.schedule(
  'stickit-send-reminders',
  '* * * * *',  -- every minute
  $$
  select net.http_post(
    url     := current_setting('app.settings.project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $$
);
