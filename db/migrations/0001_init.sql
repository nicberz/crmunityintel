-- UnityIntelCRM — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type user_role as enum ('agency_admin', 'client_user');
create type lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');
create type lead_source as enum ('manual', 'csv', 'facebook');
create type metrics_source as enum ('manual', 'facebook_api');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  commission_amount_eur numeric(10, 2) not null default 0 check (commission_amount_eur >= 0),
  created_at timestamptz not null default now()
);

-- Mirrors auth.users 1:1. Created automatically by the trigger below.
-- Note: client_user rows are expected to have a client_id (enforced in the
-- app, not the DB) but this isn't a hard DB constraint, because that would
-- block creating a user with no metadata at all (e.g. via the Supabase
-- dashboard "Add user" form, which is how the first agency_admin gets made).
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client_user',
  client_id uuid references clients (id) on delete set null,
  full_name text,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  source lead_source not null default 'manual',
  status lead_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table ad_metrics_daily (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  date date not null,
  spend_eur numeric(10, 2) not null check (spend_eur >= 0),
  leads_count integer not null check (leads_count >= 0),
  source metrics_source not null default 'manual',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (client_id, date)
);

create index leads_client_id_idx on leads (client_id);
create index leads_status_idx on leads (status);
create index ad_metrics_daily_client_id_date_idx on ad_metrics_daily (client_id, date);
create index profiles_client_id_idx on profiles (client_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger for leads
-- ---------------------------------------------------------------------------
create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create a profile row when a new auth user signs up / is invited.
-- Role and client_id are supplied via user metadata at invite time.
-- ---------------------------------------------------------------------------
create function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, role, client_id, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client_user'),
    nullif(new.raw_user_meta_data ->> 'client_id', '')::uuid,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Helper functions used by RLS policies (avoid recursive policy lookups)
-- ---------------------------------------------------------------------------
create function is_agency_admin() returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'agency_admin'
  );
$$ language sql security definer stable set search_path = public;

create function current_client_id() returns uuid as $$
  select client_id from profiles where id = auth.uid();
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table clients enable row level security;
alter table profiles enable row level security;
alter table leads enable row level security;
alter table ad_metrics_daily enable row level security;

-- clients: agency admins manage everything, client users can read their own row
create policy clients_agency_admin_all on clients
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy clients_client_user_select on clients
  for select using (id = current_client_id());

-- profiles: agency admins manage everything, users can read their own profile
create policy profiles_agency_admin_all on profiles
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy profiles_self_select on profiles
  for select using (id = auth.uid());

-- leads: agency admins manage everything, client users manage only their own client's leads
create policy leads_agency_admin_all on leads
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy leads_client_user_select on leads
  for select using (client_id = current_client_id());

create policy leads_client_user_insert on leads
  for insert with check (client_id = current_client_id());

create policy leads_client_user_update on leads
  for update using (client_id = current_client_id())
  with check (client_id = current_client_id());

-- ad_metrics_daily: agency admins manage everything, client users read-only for their client
create policy ad_metrics_agency_admin_all on ad_metrics_daily
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy ad_metrics_client_user_select on ad_metrics_daily
  for select using (client_id = current_client_id());
