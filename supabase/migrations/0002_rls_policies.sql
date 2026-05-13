-- Stickit RLS policies
-- Each user can only read/write their own rows.
-- Past lesson: UPDATE policy missing causes silent edit failures.

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
