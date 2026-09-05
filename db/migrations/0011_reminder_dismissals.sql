-- UnityIntelCRM — per-user reminder dismissals
-- Run this in the Supabase SQL editor after 0010_tasks.sql.
--
-- calendar_events.reminder_dismissed_at is a single shared column, so one
-- user dismissing a reminder hid it for everyone. This table lets each user
-- dismiss reminders independently. The old column is left in place (unused
-- from now on) rather than dropped, to avoid a destructive schema change.

create table reminder_dismissals (
  event_id uuid not null references calendar_events (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  dismissed_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table reminder_dismissals enable row level security;

create policy reminder_dismissals_own_all on reminder_dismissals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
