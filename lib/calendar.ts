import { format, subMinutes } from "date-fns";
import type { CalendarEvent } from "@/lib/types";

export function reminderFireTime(startAt: string | Date, minutesBefore: number): Date {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  return subMinutes(start, minutesBefore);
}

export function isReminderDue(
  event: Pick<CalendarEvent, "reminder_enabled" | "start_at" | "reminder_minutes_before">,
  now: Date = new Date()
): boolean {
  if (!event.reminder_enabled) return false;
  return now >= reminderFireTime(event.start_at, event.reminder_minutes_before);
}

export function formatEventTime(value: string): string {
  return format(new Date(value), "dd.MM.yyyy HH:mm");
}
