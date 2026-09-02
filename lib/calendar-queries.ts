import { createClient as createServerClient } from "@/lib/supabase/server";
import { isReminderDue, reminderFireTime } from "@/lib/calendar";

export interface DueReminder {
  id: string;
  title: string;
  start_at: string;
  clientId: string | null;
  leadId: string | null;
  leadName: string | null;
}

export async function fetchDueReminders(
  supabase: ReturnType<typeof createServerClient>
): Promise<DueReminder[]> {
  const { data } = await supabase
    .from("calendar_events")
    .select("id, title, start_at, client_id, lead_id, reminder_enabled, reminder_dismissed_at, reminder_minutes_before, lead:leads(name)")
    .eq("reminder_enabled", true)
    .is("reminder_dismissed_at", null);

  return ((data ?? []) as any[])
    .filter((e) => isReminderDue(e))
    .sort(
      (a, b) =>
        reminderFireTime(a.start_at, a.reminder_minutes_before).getTime() -
        reminderFireTime(b.start_at, b.reminder_minutes_before).getTime()
    )
    .map((e) => ({
      id: e.id,
      title: e.title,
      start_at: e.start_at,
      clientId: e.client_id,
      leadId: e.lead_id,
      leadName: e.lead?.name ?? null,
    }));
}
