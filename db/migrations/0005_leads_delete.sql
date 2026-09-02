-- UnityIntelCRM — allow client_user to delete their own client's leads
-- Run this in the Supabase SQL editor after 0004_custom_fields.sql.
-- Needed for the bulk "remove selected leads" action on the client leads page.
-- (agency_admin already has full access via the existing leads_agency_admin_all policy.)

create policy leads_client_user_delete on leads
  for delete using (client_id = current_client_id());
