-- Stickit initial schema
-- profiles, projects, tags, tasks

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

-- auto-create profile on auth signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
