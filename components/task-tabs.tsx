"use client";

import { cn } from "@/lib/utils";

export type TaskView = "today" | "week" | "all" | "done";

const TABS: { key: TaskView; label: string }[] = [
  { key: "today", label: "Šodien" },
  { key: "week", label: "Šonedēļ" },
  { key: "all", label: "Visi" },
  { key: "done", label: "Pabeigtie" },
];

export function TaskTabs({
  active,
  counts,
  onChange,
}: {
  active: TaskView;
  counts: Record<TaskView, number>;
  onChange: (view: TaskView) => void;
}) {
  return (
    <div className="flex gap-1 border-b border-border">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={cn(
            "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
            active === tab.key
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label} ({counts[tab.key]})
        </button>
      ))}
    </div>
  );
}
