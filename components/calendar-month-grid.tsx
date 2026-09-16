"use client";

import { useState } from "react";
import Link from "next/link";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { lv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TaskColorDot } from "@/components/ui/badge";
import { CalendarEventForm } from "@/components/calendar-event-form";
import { formatEventTime } from "@/lib/calendar";
import { formatDate } from "@/lib/dates";
import type { CalendarEvent, TaskColor, TaskStatus } from "@/lib/types";

const WEEKDAY_LABELS = ["Pr", "Ot", "Tr", "Ce", "Pk", "Se", "Sv"];

interface CalendarEventFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export interface CalendarGridEvent extends CalendarEvent {
  leadName?: string | null;
  clientName?: string | null;
  creatorName?: string | null;
}

export interface CalendarGridTask {
  id: string;
  title: string;
  due_date: string;
  color: TaskColor;
  status: TaskStatus;
  assigneeId?: string | null;
  assigneeName?: string | null;
}

type TypeFilter = "all" | "events" | "tasks";

export function CalendarMonthGrid({
  year,
  month,
  events,
  tasks = [],
  basePath,
  paramNames = { year: "year", month: "month" },
  hiddenFields = {},
  taskHiddenFields = {},
  createEventAction,
  deleteEventAction,
  updateTaskAction,
}: {
  year: number;
  month: number;
  events: CalendarGridEvent[];
  tasks?: CalendarGridTask[];
  basePath: string;
  paramNames?: { year: string; month: string };
  hiddenFields?: Record<string, string>;
  taskHiddenFields?: Record<string, string>;
  createEventAction: (prevState: CalendarEventFormState, formData: FormData) => Promise<CalendarEventFormState>;
  deleteEventAction: (formData: FormData) => void;
  updateTaskAction?: (formData: FormData) => void;
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [personFilter, setPersonFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const personOptions = Array.from(
    new Map(
      [
        ...events.filter((e) => e.created_by).map((e) => [e.created_by as string, e.creatorName || "Nezināms"] as const),
        ...tasks.filter((t) => t.assigneeId).map((t) => [t.assigneeId as string, t.assigneeName || "Nezināms"] as const),
      ]
    ).entries()
  );

  const visibleEvents =
    typeFilter === "tasks"
      ? []
      : personFilter === "all"
        ? events
        : events.filter((e) => e.created_by === personFilter);

  const visibleTasks =
    typeFilter === "events"
      ? []
      : personFilter === "all"
        ? tasks
        : tasks.filter((t) => t.assigneeId === personFilter);

  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = new Map<string, CalendarGridEvent[]>();
  for (const e of visibleEvents) {
    const key = format(new Date(e.start_at), "yyyy-MM-dd");
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  const tasksByDay = new Map<string, CalendarGridTask[]>();
  for (const t of visibleTasks) {
    const key = t.due_date;
    if (!tasksByDay.has(key)) tasksByDay.set(key, []);
    tasksByDay.get(key)!.push(t);
  }

  function toggleTaskDone(task: CalendarGridTask, done: boolean) {
    if (!updateTaskAction) return;
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("status", done ? "done" : "todo");
    for (const [k, v] of Object.entries(taskHiddenFields)) formData.set(k, v);
    updateTaskAction(formData);
  }

  function monthHref(y: number, m: number) {
    return `${basePath}?${paramNames.year}=${y}&${paramNames.month}=${m}`;
  }
  const prevMonth = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const today = new Date();

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay) ?? [] : [];
  const selectedDayTasks = selectedDay ? tasksByDay.get(selectedDay) ?? [] : [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Link
          href={monthHref(prevMonth.y, prevMonth.m)}
          scroll={false}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <p className="text-lg font-semibold capitalize">
          {format(monthStart, "LLLL yyyy", { locale: lv })}
        </p>
        <Link
          href={monthHref(nextMonth.y, nextMonth.m)}
          scroll={false}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className="h-9 w-auto"
        >
          <option value="all">Notikumi un uzdevumi</option>
          <option value="events">Tikai notikumi</option>
          <option value="tasks">Tikai uzdevumi</option>
        </Select>
        {personOptions.length > 1 && (
          <Select
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
            className="h-9 w-auto"
          >
            <option value="all">Visi cilvēki</option>
            {personOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border text-sm">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="bg-muted px-2 py-1 text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, today);
          const totalItems = dayEvents.length + dayTasks.length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDay(key)}
              onDoubleClick={() => setSelectedDay(key)}
              className={cn(
                "block min-h-24 bg-background p-1.5 text-left hover:bg-muted/60",
                !inMonth && "bg-muted/20 text-muted-foreground/50"
              )}
            >
              <span className={cn("text-xs", isToday && "font-bold text-primary")}>{format(day, "d")}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e) => (
                  <p key={e.id} className="truncate rounded bg-primary/10 px-1 text-[11px] text-primary">
                    {e.title}
                  </p>
                ))}
                {dayTasks.slice(0, 3).map((t) => (
                  <p
                    key={t.id}
                    className={cn(
                      "flex items-center gap-1 truncate rounded bg-muted px-1 text-[11px]",
                      t.status === "done" && "line-through opacity-60"
                    )}
                  >
                    <TaskColorDot color={t.color} className="h-1.5 w-1.5" />
                    {t.title}
                  </p>
                ))}
                {totalItems > 6 && (
                  <p className="text-[11px] text-muted-foreground">+{totalItems - 6} vairāk</p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Dialog
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? formatDate(selectedDay) : ""}
      >
        <ul className="space-y-3">
          {selectedDayEvents.map((e) => (
            <li key={e.id} className="rounded-md border border-border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{e.title}</p>
                  {e.clientName && <p className="text-xs text-muted-foreground">{e.clientName}</p>}
                  {e.note && <p className="whitespace-pre-wrap text-muted-foreground">{e.note}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{formatEventTime(e.start_at)}</p>
                  {e.creatorName && (
                    <p className="text-xs text-muted-foreground">Pievienoja: {e.creatorName}</p>
                  )}
                  {e.leadName && <p className="text-xs text-primary">Leads: {e.leadName}</p>}
                </div>
                <form action={deleteEventAction}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Dzēst
                  </Button>
                </form>
              </div>
            </li>
          ))}
          {selectedDayEvents.length === 0 && selectedDayTasks.length === 0 && (
            <p className="text-sm text-muted-foreground">Šai dienai vēl nav ierakstu.</p>
          )}
        </ul>

        {selectedDayTasks.length > 0 && (
          <ul className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Uzdevumi</p>
            {selectedDayTasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  checked={t.status === "done"}
                  disabled={!updateTaskAction}
                  onChange={(e) => toggleTaskDone(t, e.target.checked)}
                  aria-label="Pabeigts"
                  className="h-4 w-4"
                />
                <TaskColorDot color={t.color} />
                <div className="flex-1">
                  <p className={cn("font-medium", t.status === "done" && "text-muted-foreground line-through")}>
                    {t.title}
                  </p>
                  {t.assigneeName && (
                    <p className="text-xs text-muted-foreground">Atbildīgais: {t.assigneeName}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {selectedDay && (
          <CalendarEventForm
            action={createEventAction}
            hiddenFields={hiddenFields}
            defaultStartAt={`${selectedDay}T09:00`}
          />
        )}
      </Dialog>
    </div>
  );
}
