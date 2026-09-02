import * as React from "react";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/types";

const statusClasses: Record<LeadStatus, string> = {
  call_back: "bg-blue-100 text-blue-800",
  no_answer: "bg-gray-100 text-gray-800",
  reconsidering: "bg-amber-100 text-amber-800",
  not_interested: "bg-red-100 text-red-800",
  closed: "bg-emerald-100 text-emerald-800",
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
