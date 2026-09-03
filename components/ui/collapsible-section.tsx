import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  icon: Icon,
  title,
  children,
  className,
  open,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  className?: string;
  open?: boolean;
}) {
  return (
    <details className={cn("group rounded-lg border border-border bg-card shadow-sm shadow-black/[0.03]", className)} open={open}>
      <summary className="flex cursor-pointer select-none items-center gap-2 rounded-lg p-6 text-sm font-medium hover:bg-muted/40 [&::-webkit-details-marker]:hidden">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1">{title}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-8 border-t border-border p-6">{children}</div>
    </details>
  );
}
