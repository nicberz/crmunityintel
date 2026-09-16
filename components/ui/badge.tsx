import * as React from "react";
import { cn, getContrastTextColor } from "@/lib/utils";
import {
  BUG_REPORT_SEVERITY_CLASSES,
  type LeadStatus,
  type TaskColor,
  type BugReportSeverity,
} from "@/lib/types";

const statusClasses: Record<LeadStatus, string> = {
  call_back: "bg-warning/15 text-warning",
  no_answer: "bg-muted text-muted-foreground",
  reconsidering: "bg-info/15 text-info",
  not_interested: "bg-destructive/15 text-destructive",
  closed: "bg-success/15 text-success",
};

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        className
      )}
      {...props}
    />
  );
}

export function LeadStatusBadge({ status, label }: { status: LeadStatus; label: string }) {
  return <Badge className={statusClasses[status]}>{label}</Badge>;
}

export function TaskColorDot({ color, className }: { color: TaskColor; className?: string }) {
  return (
    <span
      className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", className)}
      style={{ backgroundColor: color }}
    />
  );
}

export function TaskGroupBadge({ name, color }: { name: string; color: TaskColor }) {
  return (
    <Badge style={{ backgroundColor: color, color: getContrastTextColor(color) }}>{name}</Badge>
  );
}

export function BugSeverityBadge({ severity, label }: { severity: BugReportSeverity; label: string }) {
  return <Badge className={BUG_REPORT_SEVERITY_CLASSES[severity]}>{label}</Badge>;
}
