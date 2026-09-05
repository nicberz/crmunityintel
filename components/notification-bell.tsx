"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { formatEventTime } from "@/lib/calendar";
import type { DueReminder } from "@/lib/calendar-queries";

const POLL_INTERVAL_MS = 60_000;
const TOAST_DURATION_MS = 10_000;

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
  const [toasts, setToasts] = useState<DueReminder[]>([]);
  const [unseenIds, setUnseenIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toastedIds = useRef<Set<string>>(new Set());
  const toastTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  function closeToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }

  useEffect(() => {
    let cancelled = false;
    function poll() {
      getDueRemindersAction()
        .then((r) => {
          if (cancelled) return;
          setReminders(r);

          const freshOnes = r.filter((reminder) => !toastedIds.current.has(reminder.id));
          if (freshOnes.length === 0) return;
          freshOnes.forEach((reminder) => toastedIds.current.add(reminder.id));
          setUnseenIds((prev) => {
            const next = new Set(prev);
            freshOnes.forEach((reminder) => next.add(reminder.id));
            return next;
          });
          setToasts((prev) => [...prev, ...freshOnes]);
          freshOnes.forEach((reminder) => {
            const timer = setTimeout(() => closeToast(reminder.id), TOAST_DURATION_MS);
            toastTimers.current.set(reminder.id, timer);
          });
        })
        .catch(() => {});
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      toastTimers.current.forEach((timer) => clearTimeout(timer));
      toastTimers.current.clear();
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

  function handleOpen() {
    setOpen((v) => !v);
    setUnseenIds(new Set());
  }

  function handleDismiss(eventId: string) {
    setReminders((prev) => prev.filter((r) => r.id !== eventId));
    setUnseenIds((prev) => {
      if (!prev.has(eventId)) return prev;
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    closeToast(eventId);
    const formData = new FormData();
    formData.set("eventId", eventId);
    dismissReminderAction(formData);
  }

  function handleDismissAll() {
    reminders.forEach((r) => handleDismiss(r.id));
  }

  return (
    <>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={handleOpen}
          className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unseenIds.size > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
              {unseenIds.size > 9 ? "9+" : unseenIds.size}
            </span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-md border border-border bg-card shadow-md">
            <div className="flex items-center justify-between border-b border-border px-3 py-2 text-sm font-medium">
              <span>Atgādinājumi</span>
              {reminders.length > 0 && (
                <button
                  type="button"
                  onClick={handleDismissAll}
                  className="text-xs font-normal text-muted-foreground hover:text-foreground hover:underline"
                >
                  Notīrīt visus
                </button>
              )}
            </div>
            <ul className="max-h-80 overflow-y-auto">
              {reminders.map((r) => {
                const href = leadHref(r);
                return (
                  <li key={r.id} className="border-b border-border px-3 py-2 text-sm last:border-b-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{r.title}</p>
                      <button
                        type="button"
                        onClick={() => handleDismiss(r.id)}
                        className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {href && (
                      <Link href={href} className="text-xs text-primary hover:underline">
                        {r.leadName ?? "Skatīt leadu"}
                      </Link>
                    )}
                    <p className="text-xs text-muted-foreground">{formatEventTime(r.start_at)}</p>
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

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((r) => {
          const href = leadHref(r);
          return (
            <div
              key={r.id}
              className="pointer-events-auto rounded-lg border border-border bg-card p-3 text-sm shadow-lg shadow-black/10"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <Bell className="h-4 w-4 shrink-0" />
                  <p className="font-medium text-foreground">{r.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDismiss(r.id)}
                  className="rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {href && (
                <Link href={href} className="text-xs text-primary hover:underline">
                  {r.leadName ?? "Skatīt leadu"}
                </Link>
              )}
              <p className="text-xs text-muted-foreground">{formatEventTime(r.start_at)}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
