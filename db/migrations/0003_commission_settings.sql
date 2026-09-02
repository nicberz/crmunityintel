-- UnityIntelCRM — optional percentage-based commission
-- Run this in the Supabase SQL editor after 0001_init.sql and 0002_website_leads.sql.

create type commission_type as enum ('flat', 'percentage');

alter table clients add column commission_type commission_type not null default 'flat';
alter table clients add column commission_percentage numeric(5, 2) check (commission_percentage >= 0);
