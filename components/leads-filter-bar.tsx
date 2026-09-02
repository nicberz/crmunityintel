"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ListFilter, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/types";

interface LeadsFilterBarProps {
  basePath: string;
  status?: string;
  from?: string;
  to?: string;
  sort: "created_at" | "status";
  dir: "asc" | "desc";
  addLeadForm: ReactNode;
  children: ReactNode;
}

export function LeadsFilterBar({
  basePath,
  status,
  from,
  to,
  sort,
  dir,
  addLeadForm,
  children,
}: LeadsFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddForm, setShowAddForm] = useState(false);

  function navigate(overrides: { status?: string; from?: string; to?: string }) {
    const next = {
      status: overrides.status !== undefined ? overrides.status : status ?? "",
      from: overrides.from !== undefined ? overrides.from : from ?? "",
      to: overrides.to !== undefined ? overrides.to : to ?? "",
    };
    const qs = new URLSearchParams();
    if (next.status) qs.set("status", next.status);
    if (next.from) qs.set("from", next.from);
    if (next.to) qs.set("to", next.to);
    if (sort !== "created_at") qs.set("sort", sort);
    if (dir === "asc") qs.set("dir", "asc");
    const query = qs.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    });
  }

  const hasActiveFilters = Boolean(status || from || to);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-end gap-3 border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-1.5 pb-2 text-sm font-medium text-muted-foreground">
          <ListFilter className="h-4 w-4" />
          <span>Filtrēt</span>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-status" className="text-xs text-muted-foreground">
            Statuss
          </Label>
          <Select
            id="filter-status"
            className="h-9 w-44"
            defaultValue={status ?? ""}
            onChange={(e) => navigate({ status: e.target.value })}
          >
            <option value="">Visi statusi</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-from" className="text-xs text-muted-foreground">
            No datuma
          </Label>
          <Input
            id="filter-from"
            type="date"
            className="h-9"
            defaultValue={from ?? ""}
            onChange={(e) => navigate({ from: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="filter-to" className="text-xs text-muted-foreground">
            Līdz datumam
          </Label>
          <Input
            id="filter-to"
            type="date"
            className="h-9"
            defaultValue={to ?? ""}
            onChange={(e) => navigate({ to: e.target.value })}
          />
        </div>
        <Button type="button" size="sm" onClick={() => setShowAddForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          {showAddForm ? "Aizvērt" : "Pievienot leadu"}
        </Button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => startTransition(() => router.push(basePath, { scroll: false }))}
            className="pb-2 text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Notīrīt filtrus
          </button>
        )}
        {isPending && (
          <span className="flex items-center gap-1.5 pb-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Ielādē...
          </span>
        )}
      </div>
      {showAddForm && <div className="border-b border-border p-4">{addLeadForm}</div>}
      <div className={cn("overflow-auto transition-opacity", isPending && "pointer-events-none opacity-50")}>
        {children}
      </div>
    </div>
  );
}
