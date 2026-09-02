-- UnityIntelCRM — website lead-capture API + lead management
-- Run this in the Supabase SQL editor after 0001_init.sql.

-- ---------------------------------------------------------------------------
-- 1. Replace lead_status with the 5 follow-up statuses.
--    Existing rows are remapped to the closest new status.
-- ---------------------------------------------------------------------------
alter table leads alter column status drop default;
alter type lead_status rename to lead_status_old;
create type lead_status as enum ('no_answer', 'reconsidering', 'not_interested', 'call_back', 'closed');

alter table leads
  alter column status type lead_status
  using (
    case status::text
      when 'new' then 'call_back'
      when 'contacted' then 'call_back'
      when 'qualified' then 'reconsidering'
      when 'won' then 'closed'
      when 'lost' then 'not_interested'
      else 'call_back'
    end
  )::lead_status;

alter table leads alter column status set default 'call_back';
drop type lead_status_old;

-- ---------------------------------------------------------------------------
-- 2. New lead source for website form submissions.
-- ---------------------------------------------------------------------------
alter type lead_source add value 'website_form';

-- ---------------------------------------------------------------------------
-- 3. leads: name becomes optional, add group + preferred dates.
-- ---------------------------------------------------------------------------
alter table leads alter column name drop not null;
alter table leads add column group_name text;
alter table leads add column preferred_dates date[];

-- ---------------------------------------------------------------------------
-- 4. API keys for website form submissions (one per client).
--    Only a SHA-256 hash is stored; the raw key is shown once when generated.
-- ---------------------------------------------------------------------------
alter table clients add column api_key_hash text unique;
alter table clients add column api_key_prefix text;

-- ---------------------------------------------------------------------------
-- 5. lead_comments — append-only notes on a lead.
-- ---------------------------------------------------------------------------
create table lead_comments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create index lead_comments_lead_id_idx on lead_comments (lead_id);

-- ---------------------------------------------------------------------------
-- 6. lead_status_history — automatic audit trail of status changes.
-- ---------------------------------------------------------------------------
create table lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  old_status lead_status,
  new_status lead_status not null,
  changed_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_status_history_lead_id_idx on lead_status_history (lead_id);

create function log_lead_status_change() returns trigger as $$
begin
  if new.status is distinct from old.status then
    insert into lead_status_history (lead_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger leads_log_status_change
  after update on leads
  for each row execute function log_lead_status_change();

-- ---------------------------------------------------------------------------
-- 7. RLS for the new tables.
-- ---------------------------------------------------------------------------
alter table lead_comments enable row level security;
alter table lead_status_history enable row level security;

create policy lead_comments_agency_admin_all on lead_comments
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy lead_comments_client_user_select on lead_comments
  for select using (
    exists (
      select 1 from leads
      where leads.id = lead_comments.lead_id and leads.client_id = current_client_id()
    )
  );

create policy lead_comments_client_user_insert on lead_comments
  for insert with check (
    exists (
      select 1 from leads
      where leads.id = lead_comments.lead_id and leads.client_id = current_client_id()
    )
  );

create policy lead_status_history_agency_admin_all on lead_status_history
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy lead_status_history_client_user_select on lead_status_history
  for select using (
    exists (
      select 1 from leads
      where leads.id = lead_status_history.lead_id and leads.client_id = current_client_id()
    )
  );
