-- UnityIntelCRM — tasks
-- Run this in the Supabase SQL editor after 0009_profiles_email.sql.

create type task_status as enum ('todo', 'in_progress', 'done');
create type task_priority as enum ('low', 'medium', 'high');

create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  assigned_to uuid references profiles (id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'todo',
  priority task_priority not null default 'medium',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_client_id_idx on tasks (client_id);
create index tasks_assigned_to_idx on tasks (assigned_to);
create index tasks_status_idx on tasks (status);

create trigger tasks_set_updated_at
  before update on tasks
  for each row execute function set_updated_at();

alter table tasks enable row level security;

create policy tasks_agency_admin_all on tasks
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy tasks_client_user_select on tasks
  for select using (client_id = current_client_id());

create policy tasks_client_user_insert on tasks
  for insert with check (client_id = current_client_id());

create policy tasks_client_user_update on tasks
  for update using (client_id = current_client_id())
  with check (client_id = current_client_id());

create policy tasks_client_user_delete on tasks
  for delete using (client_id = current_client_id());
