"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListFilter, Loader2, Search, ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskGroup,
} from "@/lib/types";

export type TaskSortField = "due_date" | "priority" | "created_at" | "title";

export const TASK_SORT_FIELDS: TaskSortField[] = ["due_date", "priority", "created_at", "title"];
export const TASK_SORT_LABELS: Record<TaskSortField, string> = {
  due_date: "Termiņš",
  priority: "Prioritāte",
  created_at: "Izveidots",
  title: "Nosaukums",
};

export interface TasksFilters {
  q?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  groupId?: string;
  archived?: string;
  sort?: TaskSortField;
  dir?: "asc" | "desc";
}

export function TasksFilterBar({
  basePath,
  filters,
  teamMembers,
  groups,
  showArchivedToggle = true,
}: {
  basePath: string;
  filters: TasksFilters;
  teamMembers: { id: string; name: string }[];
  groups: TaskGroup[];
  showArchivedToggle?: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchText, setSearchText] = useState(filters.q ?? "");

  function navigate(overrides: Partial<TasksFilters>) {
    const next = { ...filters, ...overrides };
    const qs = new URLSearchParams();
    if (next.q) qs.set("q", next.q);
    if (next.status) qs.set("status", next.status);
    if (next.priority) qs.set("priority", next.priority);
    if (next.assignedTo) qs.set("assignedTo", next.assignedTo);
    if (next.groupId) qs.set("groupId", next.groupId);
    if (next.archived) qs.set("archived", next.archived);
    if (next.sort) qs.set("sort", next.sort);
    if (next.dir) qs.set("dir", next.dir);
    const query = qs.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchText !== (filters.q ?? "")) navigate({ q: searchText });
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  const hasActiveFilters = Boolean(
    filters.q || filters.status || filters.priority || filters.assignedTo || filters.groupId || filters.archived
  );

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Meklēt</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Nosaukums, apraksts, tags..."
            className="h-9 w-56 pl-8"
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 pb-2 text-sm font-medium text-muted-foreground">
        <ListFilter className="h-4 w-4" />
        <span>Filtrēt</span>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Statuss</Label>
        <Select
          className="h-9 w-auto min-w-[10rem] max-w-full"
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
          className="h-9 w-auto min-w-[9rem] max-w-full"
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
          className="h-9 w-auto min-w-[11rem] max-w-full"
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
            className="h-9 w-auto min-w-[10rem] max-w-full"
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
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Kārtot pēc</Label>
        <div className="flex items-center gap-1">
          <Select
            className="h-9 w-auto min-w-[9rem] max-w-full"
            defaultValue={filters.sort ?? "due_date"}
            onChange={(e) => navigate({ sort: e.target.value as TaskSortField })}
          >
            {TASK_SORT_FIELDS.map((f) => (
              <option key={f} value={f}>
                {TASK_SORT_LABELS[f]}
              </option>
            ))}
          </Select>
          <button
            type="button"
            title={filters.dir === "asc" ? "Augoši" : "Dilstoši"}
            onClick={() => navigate({ dir: filters.dir === "asc" ? "desc" : "asc" })}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {filters.dir === "asc" ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {showArchivedToggle && (
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            checked={filters.archived === "1"}
            onChange={(e) => navigate({ archived: e.target.checked ? "1" : "" })}
          />
          Rādīt arhivētos
        </label>
      )}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => {
            setSearchText("");
            startTransition(() => router.push(basePath, { scroll: false }));
          }}
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
