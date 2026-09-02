"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadStatusBadge } from "@/components/ui/badge";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { formatDate } from "@/lib/dates";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadFieldDefinition } from "@/lib/types";

interface LeadsTableProps {
  leads: Lead[];
  fieldDefs: LeadFieldDefinition[];
  fieldValues: Record<string, Record<string, string>>;
  detailHrefBase: string;
  sortLinks: { status: string; created_at: string };
  showSourceColumn: boolean;
  editableStatus: boolean;
  hasActiveFilters: boolean;
  emptyMessage: string;
  clientId?: string;
  updateStatusAction?: (formData: FormData) => void;
  bulkUpdateStatusAction: (formData: FormData) => void;
  bulkDeleteAction: (formData: FormData) => void;
}

export function LeadsTable({
  leads,
  fieldDefs,
  fieldValues,
  detailHrefBase,
  sortLinks,
  showSourceColumn,
  editableStatus,
  hasActiveFilters,
  emptyMessage,
  clientId,
  updateStatusAction,
  bulkUpdateStatusAction,
  bulkDeleteAction,
}: LeadsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>(LEAD_STATUSES[0]);
  const [isPending, startTransition] = useTransition();

  const allSelected = leads.length > 0 && selected.size === leads.length;
  const colSpan = 7 + fieldDefs.length + (showSourceColumn ? 1 : 0);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(leads.map((l) => l.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function buildFormData(extra?: Record<string, string>) {
    const fd = new FormData();
    selected.forEach((id) => fd.append("leadIds", id));
    if (clientId) fd.set("clientId", clientId);
    if (extra) {
      for (const [key, value] of Object.entries(extra)) fd.set(key, value);
    }
    return fd;
  }

  function applyBulkStatus() {
    startTransition(async () => {
      await bulkUpdateStatusAction(buildFormData({ status: bulkStatus }));
      setSelected(new Set());
    });
  }

  function applyBulkDelete() {
    if (!window.confirm(`Dzēst ${selected.size} izvēlētos leadus? Šo darbību nevar atsaukt.`)) return;
    startTransition(async () => {
      await bulkDeleteAction(buildFormData());
      setSelected(new Set());
    });
  }

  return (
    <div>
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-muted/40 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} izvēlēti</span>
          <Select
            className="h-9 w-44"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            disabled={isPending}
          >
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={applyBulkStatus} disabled={isPending}>
            Mainīt statusu
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={applyBulkDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4" />
            Dzēst
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="text-sm text-muted-foreground hover:underline"
          >
            Notīrīt atlasi
          </button>
        </div>
      )}
      <table className="w-full caption-bottom text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Izvēlēties visus"
              />
            </TableHead>
            <TableHead>Vārds</TableHead>
            <TableHead>Kontakti</TableHead>
            <TableHead>Grupa</TableHead>
            <TableHead>Datumi</TableHead>
            {fieldDefs.map((f) => (
              <TableHead key={f.id}>{f.label}</TableHead>
            ))}
            {showSourceColumn && <TableHead>Avots</TableHead>}
            <TableHead>
              <Link href={sortLinks.status} className="hover:underline">
                Statuss
              </Link>
            </TableHead>
            <TableHead>
              <Link href={sortLinks.created_at} className="hover:underline">
                Pievienots
              </Link>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={selected.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  aria-label={`Izvēlēties ${lead.name ?? "leadu"}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link href={`${detailHrefBase}/${lead.id}`} className="hover:underline">
                  {lead.name || "—"}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {[lead.email, lead.phone].filter(Boolean).join(" · ") || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{lead.group_name || "—"}</TableCell>
              <TableCell className="text-muted-foreground">
                {lead.preferred_dates?.length ? lead.preferred_dates.map((d) => formatDate(d)).join(", ") : "—"}
              </TableCell>
              {fieldDefs.map((f) => (
                <TableCell key={f.id} className="text-muted-foreground">
                  {fieldValues[lead.id]?.[f.id] || "—"}
                </TableCell>
              ))}
              {showSourceColumn && (
                <TableCell className="text-muted-foreground capitalize">{lead.source}</TableCell>
              )}
              <TableCell>
                {editableStatus && updateStatusAction ? (
                  <LeadStatusSelect leadId={lead.id} status={lead.status} action={updateStatusAction} />
                ) : (
                  <LeadStatusBadge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDate(lead.created_at)}</TableCell>
            </TableRow>
          ))}
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
                {hasActiveFilters ? "Neviens leads neatbilst filtriem." : emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </table>
    </div>
  );
}
