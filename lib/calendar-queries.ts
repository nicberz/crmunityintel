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
  supabase: ReturnType<typeof createServerClient>,
  userId: string
): Promise<DueReminder[]> {
  const [{ data }, { data: dismissals }] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, start_at, client_id, lead_id, reminder_enabled, reminder_minutes_before, lead:leads(name)")
      .eq("reminder_enabled", true),
    supabase.from("reminder_dismissals").select("event_id").eq("user_id", userId),
  ]);

  const dismissedIds = new Set(((dismissals ?? []) as { event_id: string }[]).map((d) => d.event_id));

  return ((data ?? []) as any[])
    .filter((e) => !dismissedIds.has(e.id) && isReminderDue(e))
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
