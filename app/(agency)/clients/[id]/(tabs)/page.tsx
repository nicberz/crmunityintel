import { createClient } from "@/lib/supabase/server";
import {
  addLeadAction,
  bulkUpdateLeadStatusAction,
  bulkDeleteLeadsAction,
} from "@/app/(agency)/actions";
import { LeadStatusOverview } from "@/components/lead-status-overview";
import { AddLeadForm } from "@/components/add-lead-form";
import { LeadsFilterBar } from "@/components/leads-filter-bar";
import { LeadsTable } from "@/components/leads-table";
import { tallyLeadStatuses } from "@/lib/lead-stats";
import type { Lead, LeadFieldDefinition, LeadFieldValue } from "@/lib/types";

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function ClientLeadsTabPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();

  const statusFilter = param(searchParams, "status");
  const fromFilter = param(searchParams, "from");
  const toFilter = param(searchParams, "to");
  const sortColumn = param(searchParams, "sort") === "status" ? "status" : "created_at";
  const sortAscending = param(searchParams, "dir") === "asc";

  let leadsQuery = supabase.from("leads").select("*").eq("client_id", params.id);
  if (statusFilter) leadsQuery = leadsQuery.eq("status", statusFilter as Lead["status"]);
  if (fromFilter) leadsQuery = leadsQuery.gte("created_at", fromFilter);
  if (toFilter) leadsQuery = leadsQuery.lte("created_at", `${toFilter}T23:59:59.999`);
  leadsQuery = leadsQuery.order(sortColumn, { ascending: sortAscending });

  const [{ data: leads }, { data: leadStatuses }, { data: fieldDefsData }] = await Promise.all([
    leadsQuery,
    supabase.from("leads").select("status").eq("client_id", params.id),
    supabase
      .from("lead_field_definitions")
      .select("*")
      .eq("client_id", params.id)
      .order("sort_order", { ascending: true }),
  ]);

  const leadsList = (leads ?? []) as Lead[];
  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDefinition[];
  const statusCounts = tallyLeadStatuses(((leadStatuses ?? []) as Pick<Lead, "status">[]).map((l) => l.status));

  const leadIds = leadsList.map((l) => l.id);
  const { data: fieldValuesData } = leadIds.length
    ? await supabase.from("lead_field_values").select("*").in("lead_id", leadIds)
    : { data: [] as LeadFieldValue[] };

  const fieldValues: Record<string, Record<string, string>> = {};
  for (const fv of (fieldValuesData ?? []) as LeadFieldValue[]) {
    if (!fieldValues[fv.lead_id]) fieldValues[fv.lead_id] = {};
    fieldValues[fv.lead_id][fv.field_definition_id] = fv.value ?? "";
  }

  function sortLink(column: "created_at" | "status") {
    const nextDir = sortColumn === column && sortAscending ? "desc" : "asc";
    const qs = new URLSearchParams();
    if (statusFilter) qs.set("status", statusFilter);
    if (fromFilter) qs.set("from", fromFilter);
    if (toFilter) qs.set("to", toFilter);
    qs.set("sort", column);
    qs.set("dir", nextDir);
    return `/clients/${params.id}?${qs.toString()}`;
  }

  const hasActiveFilters = Boolean(statusFilter || fromFilter || toFilter);

  return (
    <div className="space-y-8">
      <LeadStatusOverview counts={statusCounts} />

      <LeadsFilterBar
        key={`${statusFilter ?? ""}|${fromFilter ?? ""}|${toFilter ?? ""}`}
        basePath={`/clients/${params.id}`}
        status={statusFilter}
        from={fromFilter}
        to={toFilter}
        sort={sortColumn}
        dir={sortAscending ? "asc" : "desc"}
        addLeadForm={
          <AddLeadForm fieldDefs={fieldDefs} hiddenFields={{ clientId: params.id }} action={addLeadAction} />
        }
      >
        <LeadsTable
          leads={leadsList}
          fieldDefs={fieldDefs}
          fieldValues={fieldValues}
          detailHrefBase={`/clients/${params.id}/leads`}
          sortLinks={{ status: sortLink("status"), created_at: sortLink("created_at") }}
          showSourceColumn={false}
          editableStatus={false}
          hasActiveFilters={hasActiveFilters}
          emptyMessage="Šim klientam vēl nav leadu."
          clientId={params.id}
          bulkUpdateStatusAction={bulkUpdateLeadStatusAction}
          bulkDeleteAction={bulkDeleteLeadsAction}
        />
      </LeadsFilterBar>
    </div>
  );
}
