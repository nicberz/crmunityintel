import { SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireClientUser } from "@/lib/auth";
import {
  addLeadAction,
  importLeadsCsvAction,
  updateLeadStatusAction,
  bulkUpdateLeadStatusAction,
  bulkDeleteLeadsAction,
  addLeadFieldAction,
  updateLeadFieldAction,
  deleteLeadFieldAction,
} from "@/app/(client)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LeadFieldEditor } from "@/components/lead-field-editor";
import { AddLeadForm } from "@/components/add-lead-form";
import { LeadsFilterBar } from "@/components/leads-filter-bar";
import { LeadsTable } from "@/components/leads-table";
import type { Lead, LeadFieldDefinition, LeadFieldValue } from "@/lib/types";

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const profile = await requireClientUser();
  const supabase = createClient();

  const statusFilter = param(searchParams, "status");
  const fromFilter = param(searchParams, "from");
  const toFilter = param(searchParams, "to");
  const sortColumn = param(searchParams, "sort") === "status" ? "status" : "created_at";
  const sortAscending = param(searchParams, "dir") === "asc";

  let leadsQuery = supabase.from("leads").select("*").eq("client_id", profile.client_id!);
  if (statusFilter) leadsQuery = leadsQuery.eq("status", statusFilter as Lead["status"]);
  if (fromFilter) leadsQuery = leadsQuery.gte("created_at", fromFilter);
  if (toFilter) leadsQuery = leadsQuery.lte("created_at", `${toFilter}T23:59:59.999`);
  leadsQuery = leadsQuery.order(sortColumn, { ascending: sortAscending });

  const [{ data: leads }, { data: fieldDefsData }] = await Promise.all([
    leadsQuery,
    supabase
      .from("lead_field_definitions")
      .select("*")
      .eq("client_id", profile.client_id!)
      .order("sort_order", { ascending: true }),
  ]);

  const leadsList = (leads ?? []) as Lead[];
  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDefinition[];

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
    return `/leads?${qs.toString()}`;
  }

  const hasActiveFilters = Boolean(statusFilter || fromFilter || toFilter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Leadi</h1>
        <p className="text-muted-foreground">Visi tavi leadi vienuviet, ar statusa izsekošanu.</p>
      </div>

      <CollapsibleSection icon={SlidersHorizontal} title="Pielāgotie lauki (neobligāti)">
        <p className="text-sm text-muted-foreground">
          Papildu lauki, ko vari aizpildīt caur API vai manuālo pievienošanu (bez telefona un e-pasta, kas
          vienmēr ir pieejami).
        </p>
        <LeadFieldEditor
          fields={fieldDefs}
          addAction={addLeadFieldAction}
          updateAction={updateLeadFieldAction}
          deleteAction={deleteLeadFieldAction}
        />
      </CollapsibleSection>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Importēt no CSV</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Faila kolonnas: <code>name</code> (obligāta), <code>email</code>, <code>phone</code>.
          </p>
          <form action={importLeadsCsvAction} className="space-y-3">
            <Input name="file" type="file" accept=".csv,text/csv" required />
            <Button type="submit" variant="outline">
              Importēt
            </Button>
          </form>
        </CardContent>
      </Card>

      <LeadsFilterBar
        key={`${statusFilter ?? ""}|${fromFilter ?? ""}|${toFilter ?? ""}`}
        basePath="/leads"
        status={statusFilter}
        from={fromFilter}
        to={toFilter}
        sort={sortColumn}
        dir={sortAscending ? "asc" : "desc"}
        addLeadForm={<AddLeadForm fieldDefs={fieldDefs} action={addLeadAction} />}
      >
        <LeadsTable
          leads={leadsList}
          fieldDefs={fieldDefs}
          fieldValues={fieldValues}
          detailHrefBase="/leads"
          sortLinks={{ status: sortLink("status"), created_at: sortLink("created_at") }}
          showSourceColumn
          editableStatus
          hasActiveFilters={hasActiveFilters}
          emptyMessage="Vēl nav neviena leada. Pievieno pirmo augstāk vai importē CSV failu."
          updateStatusAction={updateLeadStatusAction}
          bulkUpdateStatusAction={bulkUpdateLeadStatusAction}
          bulkDeleteAction={bulkDeleteLeadsAction}
        />
      </LeadsFilterBar>
    </div>
  );
}
