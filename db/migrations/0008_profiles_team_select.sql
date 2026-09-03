-- UnityIntelCRM — let client_user accounts see their teammates' names
-- Run this in the Supabase SQL editor after 0007_calendar_events.sql.
--
-- profiles_self_select only allows reading your own row, so calendar events
-- created by a teammate (another client_user under the same client) show up
-- with no name attached. This adds a second, additive policy so a client_user
-- can also read profiles belonging to the same client_id.

create policy profiles_team_select on profiles
  for select using (client_id = current_client_id());
