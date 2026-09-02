-- UnityIntelCRM — calendar events + reminders
-- Run this in the Supabase SQL editor after 0006_client_whatsapp.sql.

create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients (id) on delete cascade,
  lead_id uuid references leads (id) on delete cascade,
  created_by uuid references profiles (id) on delete set null,
  title text not null,
  note text,
  start_at timestamptz not null,
  reminder_enabled boolean not null default false,
  reminder_minutes_before int not null default 60 check (reminder_minutes_before >= 0),
  reminder_dismissed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index calendar_events_client_id_idx on calendar_events (client_id);
create index calendar_events_lead_id_idx on calendar_events (lead_id);
create index calendar_events_start_at_idx on calendar_events (start_at);
create index calendar_events_due_reminder_idx on calendar_events (client_id, start_at)
  where reminder_enabled and reminder_dismissed_at is null;

create trigger calendar_events_set_updated_at
  before update on calendar_events
  for each row execute function set_updated_at();

alter table calendar_events enable row level security;

create policy calendar_events_agency_admin_all on calendar_events
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy calendar_events_client_user_select on calendar_events
  for select using (client_id = current_client_id());

create policy calendar_events_client_user_insert on calendar_events
  for insert with check (client_id = current_client_id());

create policy calendar_events_client_user_update on calendar_events
  for update using (client_id = current_client_id())
  with check (client_id = current_client_id());

create policy calendar_events_client_user_delete on calendar_events
  for delete using (client_id = current_client_id());
