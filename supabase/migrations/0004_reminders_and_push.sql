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
