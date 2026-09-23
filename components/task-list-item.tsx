"use client";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import { Badge, TaskColorDot, TaskGroupBadge } from "@/components/ui/badge";
import { TASK_PRIORITY_LABELS, type TaskGroup, type TaskStatus } from "@/lib/types";
import type { TaskWithNames } from "@/components/tasks-table";

export function TaskListItem({
  task,
  group,
  selected,
  displayStatus,
  onSelect,
  onToggleDone,
}: {
  task: TaskWithNames;
  group: TaskGroup | null;
  selected: boolean;
  displayStatus: TaskStatus;
  onSelect: () => void;
  onToggleDone: (done: boolean) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = Boolean(task.due_date) && task.due_date! < today && displayStatus !== "done";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
      )}
    >
      <input
        type="checkbox"
        checked={displayStatus === "done"}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onToggleDone(e.target.checked)}
        aria-label="Pabeigts"
        className="h-4 w-4 shrink-0"
      />
      <TaskColorDot color={task.color} />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            displayStatus === "done" && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {group && <TaskGroupBadge name={group.name} color={group.color} />}
          {task.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} className="bg-muted text-[10px] text-muted-foreground">
              {tag}
            </Badge>
          ))}
          {task.assigneeName && <span className="text-xs text-muted-foreground">{task.assigneeName}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
        <span className={cn("text-muted-foreground", overdue && "font-medium text-destructive")}>
          {task.due_date ? formatDate(task.due_date) : "—"}
        </span>
        <Badge className="bg-muted text-[10px] text-muted-foreground">{TASK_PRIORITY_LABELS[task.priority]}</Badge>
      </div>
    </button>
  );
}
