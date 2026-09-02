-- UnityIntelCRM — WhatsApp notification number per client
-- Run this in the Supabase SQL editor after 0005_leads_delete.sql.
-- Stores the WhatsApp number (Meta Cloud API recipient) notified when a new
-- lead is created for this client. See README "WhatsApp paziņojumi" section.

alter table clients add column whatsapp_phone text;
