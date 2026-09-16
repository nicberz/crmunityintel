"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListFilter, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskGroup,
} from "@/lib/types";

export interface TasksFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  groupId?: string;
  archived?: string;
}

export function TasksFilterBar({
  basePath,
  filters,
  teamMembers,
  groups,
}: {
  basePath: string;
  filters: TasksFilters;
  teamMembers: { id: string; name: string }[];
  groups: TaskGroup[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(overrides: Partial<TasksFilters>) {
    const next = { ...filters, ...overrides };
    const qs = new URLSearchParams();
    if (next.status) qs.set("status", next.status);
    if (next.priority) qs.set("priority", next.priority);
    if (next.assignedTo) qs.set("assignedTo", next.assignedTo);
    if (next.groupId) qs.set("groupId", next.groupId);
    if (next.archived) qs.set("archived", next.archived);
    const query = qs.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    });
  }

  const hasActiveFilters = Boolean(
    filters.status || filters.priority || filters.assignedTo || filters.groupId || filters.archived
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex items-center gap-1.5 pb-2 text-sm font-medium text-muted-foreground">
        <ListFilter className="h-4 w-4" />
        <span>Filtrēt</span>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Statuss</Label>
        <Select
          className="h-9 w-40"
          defaultValue={filters.status ?? ""}
          onChange={(e) => navigate({ status: e.target.value })}
        >
          <option value="">Visi statusi</option>
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Prioritāte</Label>
        <Select
          className="h-9 w-36"
          defaultValue={filters.priority ?? ""}
          onChange={(e) => navigate({ priority: e.target.value })}
        >
          <option value="">Visas</option>
          {TASK_PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {TASK_PRIORITY_LABELS[p]}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Atbildīgais</Label>
        <Select
          className="h-9 w-44"
          defaultValue={filters.assignedTo ?? ""}
          onChange={(e) => navigate({ assignedTo: e.target.value })}
        >
          <option value="">Visi</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>
      {groups.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Grupa</Label>
          <Select
            className="h-9 w-40"
            defaultValue={filters.groupId ?? ""}
            onChange={(e) => navigate({ groupId: e.target.value })}
          >
            <option value="">Visas</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <label className="flex items-center gap-2 pb-2 text-sm">
        <input
          type="checkbox"
          checked={filters.archived === "1"}
          onChange={(e) => navigate({ archived: e.target.checked ? "1" : "" })}
        />
        Rādīt arhivētos
      </label>
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
  );
}
