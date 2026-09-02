"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { formatEventTime } from "@/lib/calendar";
import type { DueReminder } from "@/lib/calendar-queries";

const POLL_INTERVAL_MS = 60_000;

export function NotificationBell({
  getDueRemindersAction,
  dismissReminderAction,
  variant,
}: {
  getDueRemindersAction: () => Promise<DueReminder[]>;
  dismissReminderAction: (formData: FormData) => void;
  variant: "agency" | "client";
}) {
  function leadHref(r: DueReminder): string | null {
    if (!r.leadId) return null;
    return variant === "agency" ? `/clients/${r.clientId}/leads/${r.leadId}` : `/leads/${r.leadId}`;
  }

  const [reminders, setReminders] = useState<DueReminder[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    function poll() {
      getDueRemindersAction()
        .then((r) => {
          if (!cancelled) setReminders(r);
        })
        .catch(() => {});
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [getDueRemindersAction]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleDismiss(eventId: string) {
    setReminders((prev) => prev.filter((r) => r.id !== eventId));
    const formData = new FormData();
    formData.set("eventId", eventId);
    dismissReminderAction(formData);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {reminders.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
            {reminders.length > 9 ? "9+" : reminders.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-md border border-border bg-background shadow-md">
          <div className="border-b border-border px-3 py-2 text-sm font-medium">Atgādinājumi</div>
          <ul className="max-h-80 overflow-y-auto">
            {reminders.map((r) => {
              const href = leadHref(r);
              return (
                <li key={r.id} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
                  <p className="font-medium">{r.title}</p>
                  {href && (
                    <Link href={href} className="text-xs text-primary hover:underline">
                      {r.leadName ?? "Skatīt leadu"}
                    </Link>
                  )}
                  <p className="text-xs text-muted-foreground">{formatEventTime(r.start_at)}</p>
                  <button
                    type="button"
                    onClick={() => handleDismiss(r.id)}
                    className="mt-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    Atzīmēt kā redzētu
                  </button>
                </li>
              );
            })}
            {reminders.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">Nav aktīvu atgādinājumu.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
