-- UnityIntelCRM — per-client custom lead fields
-- Run this in the Supabase SQL editor after 0001_init.sql, 0002_website_leads.sql and
-- 0003_commission_settings.sql.

create type lead_field_type as enum ('text', 'number', 'date', 'select');

create table lead_field_definitions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  key text not null,
  label text not null,
  field_type lead_field_type not null default 'text',
  options jsonb,
  is_required boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (client_id, key)
);

create table lead_field_values (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  field_definition_id uuid not null references lead_field_definitions (id) on delete cascade,
  value text,
  unique (lead_id, field_definition_id)
);

create index lead_field_definitions_client_id_idx on lead_field_definitions (client_id);
create index lead_field_values_lead_id_idx on lead_field_values (lead_id);
create index lead_field_values_field_definition_id_idx on lead_field_values (field_definition_id);

alter table lead_field_definitions enable row level security;
alter table lead_field_values enable row level security;

create policy lead_field_definitions_agency_admin_all on lead_field_definitions
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy lead_field_definitions_client_user_all on lead_field_definitions
  for all
  using (client_id = current_client_id())
  with check (client_id = current_client_id());

create policy lead_field_values_agency_admin_all on lead_field_values
  for all using (is_agency_admin()) with check (is_agency_admin());

create policy lead_field_values_client_user_select on lead_field_values
  for select using (
    exists (
      select 1 from leads
      where leads.id = lead_field_values.lead_id and leads.client_id = current_client_id()
    )
  );

create policy lead_field_values_client_user_insert on lead_field_values
  for insert with check (
    exists (
      select 1 from leads
      where leads.id = lead_field_values.lead_id and leads.client_id = current_client_id()
    )
  );
