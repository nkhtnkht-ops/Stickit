-- Schedule the send-reminders Edge Function via pg_cron + pg_net.
--
-- The Edge Function is deployed with `verify_jwt: false`, so we don't need
-- to send an Authorization header from cron. The function URL is public but
-- only does work when there are due reminders, so the worst-case from random
-- callers is a 200 with `processed: 0`.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

do $$
begin
  perform cron.unschedule('stickit-send-reminders');
exception when others then null;
end$$;

select cron.schedule(
  'stickit-send-reminders',
  '* * * * *',  -- every minute
  $cmd$
  select net.http_post(
    url     := 'https://mhvweowjjocnbmpvpjwi.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb,
    timeout_milliseconds := 10000
  );
  $cmd$
);
