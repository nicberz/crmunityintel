import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { requireClientUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEventAction, deleteCalendarEventAction } from "@/app/(client)/actions";
import { CalendarMonthGrid, type CalendarGridEvent } from "@/components/calendar-month-grid";

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const profile = await requireClientUser();
  const supabase = createClient();

  const now = new Date();
  const year = Number(param(searchParams, "year")) || now.getFullYear();
  const month = Number(param(searchParams, "month")) || now.getMonth() + 1;

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });

  const { data: eventsData } = await supabase
    .from("calendar_events")
    .select("*, lead:leads(name)")
    .eq("client_id", profile.client_id!)
    .gte("start_at", gridStart.toISOString())
    .lt("start_at", addDays(gridEnd, 1).toISOString())
    .order("start_at", { ascending: true });

  const events: CalendarGridEvent[] = ((eventsData ?? []) as any[]).map((e) => ({
    ...e,
    leadName: e.lead?.name ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Kalendārs</h1>
        <p className="text-muted-foreground">Pievieno notikumus, piezīmes un atgādinājumus.</p>
      </div>

      <CalendarMonthGrid
        year={year}
        month={month}
        events={events}
        basePath="/calendar"
        createEventAction={createCalendarEventAction}
        deleteEventAction={deleteCalendarEventAction}
      />
    </div>
  );
}
