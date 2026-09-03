-- UnityIntelCRM — store email on profiles so it can be shown/joined normally
-- Run this in the Supabase SQL editor after 0008_profiles_team_select.sql.
--
-- Email lives on auth.users, which isn't exposed to normal PostgREST queries.
-- Denormalizing it onto public.profiles lets calendar events (and anything
-- else) show/join the creator's email without needing the service role.

alter table profiles add column email text;

update profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- Keep it populated for every new signup/invite going forward.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, role, client_id, full_name, email)
  values (
    new.id,
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'client_user'),
    nullif(new.raw_user_meta_data ->> 'client_id', '')::uuid,
    new.raw_user_meta_data ->> 'full_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
