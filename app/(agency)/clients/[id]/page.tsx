import { notFound } from "next/navigation";
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { Plug, Percent, SlidersHorizontal, CalendarDays } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  addMetricsAction,
  addLeadAction,
  bulkUpdateLeadStatusAction,
  bulkDeleteLeadsAction,
  addLeadFieldAction,
  updateLeadFieldAction,
  deleteLeadFieldAction,
  createCalendarEventAction,
  deleteCalendarEventAction,
} from "@/app/(agency)/actions";
import { summarizeMetrics, commissionConfigFromClient, formatEur } from "@/lib/commission";
import { formatDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InviteClientForm } from "@/components/invite-client-form";
import { ApiKeyCard } from "@/components/api-key-card";
import { WhatsAppSettingsForm } from "@/components/whatsapp-settings-form";
import { LeadStatusOverview } from "@/components/lead-status-overview";
import { CommissionSettingsForm } from "@/components/commission-settings-form";
import { LeadFieldEditor } from "@/components/lead-field-editor";
import { AddLeadForm } from "@/components/add-lead-form";
import { LeadsFilterBar } from "@/components/leads-filter-bar";
import { LeadsTable } from "@/components/leads-table";
import { CalendarMonthGrid, type CalendarGridEvent } from "@/components/calendar-month-grid";
import { tallyLeadStatuses } from "@/lib/lead-stats";
import type { AdMetricsDaily, Client, Lead, LeadFieldDefinition, LeadFieldValue } from "@/lib/types";

const CALENDAR_PARAM_NAMES = { year: "calYear", month: "calMonth" };

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function ClientDetailPage({
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

  const [{ data: client }, { data: metrics }, { data: leads }, { data: leadStatuses }, { data: fieldDefsData }] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", params.id).single(),
      supabase
        .from("ad_metrics_daily")
        .select("*")
        .eq("client_id", params.id)
        .order("date", { ascending: false }),
      leadsQuery,
      supabase.from("leads").select("status").eq("client_id", params.id),
      supabase
        .from("lead_field_definitions")
        .select("*")
        .eq("client_id", params.id)
        .order("sort_order", { ascending: true }),
    ]);

  if (!client) notFound();

  const typedClient = client as Client;
  const metricsList = (metrics ?? []) as AdMetricsDaily[];
  const leadsList = (leads ?? []) as Lead[];
  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDefinition[];
  const statusCounts = tallyLeadStatuses(((leadStatuses ?? []) as Pick<Lead, "status">[]).map((l) => l.status));
  const summary = summarizeMetrics(metricsList, commissionConfigFromClient(typedClient));

  const leadIds = leadsList.map((l) => l.id);

  const now = new Date();
  const calYear = Number(param(searchParams, "calYear")) || now.getFullYear();
  const calMonth = Number(param(searchParams, "calMonth")) || now.getMonth() + 1;

  const calMonthStart = startOfMonth(new Date(calYear, calMonth - 1, 1));
  const calGridStart = startOfWeek(calMonthStart, { weekStartsOn: 1 });
  const calGridEnd = endOfWeek(endOfMonth(calMonthStart), { weekStartsOn: 1 });

  const [{ data: fieldValuesData }, { data: calendarEventsData }] = await Promise.all([
    leadIds.length
      ? supabase.from("lead_field_values").select("*").in("lead_id", leadIds)
      : Promise.resolve({ data: [] as LeadFieldValue[] }),
    supabase
      .from("calendar_events")
      .select("*, lead:leads(name)")
      .eq("client_id", params.id)
      .gte("start_at", calGridStart.toISOString())
      .lt("start_at", addDays(calGridEnd, 1).toISOString())
      .order("start_at", { ascending: true }),
  ]);

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
    return `/clients/${typedClient.id}?${qs.toString()}`;
  }

  const hasActiveFilters = Boolean(statusFilter || fromFilter || toFilter);

  const calendarEvents: CalendarGridEvent[] = ((calendarEventsData ?? []) as any[]).map((e) => ({
    ...e,
    leadName: e.lead?.name ?? null,
  }));

  const calendarSectionOpen = Boolean(param(searchParams, "calYear") || param(searchParams, "calMonth"));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{typedClient.name}</h1>
        <p className="text-muted-foreground">Klienta detaļas, izmaksas un pieeja.</p>
      </div>

      <LeadStatusOverview counts={statusCounts} />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Leadi</h2>
        </div>

        <LeadsFilterBar
          key={`${statusFilter ?? ""}|${fromFilter ?? ""}|${toFilter ?? ""}`}
          basePath={`/clients/${typedClient.id}`}
          status={statusFilter}
          from={fromFilter}
          to={toFilter}
          sort={sortColumn}
          dir={sortAscending ? "asc" : "desc"}
          addLeadForm={
            <AddLeadForm
              fieldDefs={fieldDefs}
              hiddenFields={{ clientId: typedClient.id }}
              action={addLeadAction}
            />
          }
        >
          <LeadsTable
            leads={leadsList}
            fieldDefs={fieldDefs}
            fieldValues={fieldValues}
            detailHrefBase={`/clients/${typedClient.id}/leads`}
            sortLinks={{ status: sortLink("status"), created_at: sortLink("created_at") }}
            showSourceColumn={false}
            editableStatus={false}
            hasActiveFilters={hasActiveFilters}
            emptyMessage="Šim klientam vēl nav leadu."
            clientId={typedClient.id}
            bulkUpdateStatusAction={bulkUpdateLeadStatusAction}
            bulkDeleteAction={bulkDeleteLeadsAction}
          />
        </LeadsFilterBar>
      </div>

      <CollapsibleSection icon={Percent} title="Komisija un izmaksu izsekošana (neobligāti)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Leadi kopā</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{summary.totalLeads}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cena/lead (ar komisiju)</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatEur(summary.clientCostPerLeadEur)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Jāmaksā aģentūrai</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {formatEur(summary.totalCommissionOwedEur)}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Komisijas likme</CardTitle>
          </CardHeader>
          <CardContent>
            <CommissionSettingsForm
              key={`${typedClient.commission_type}-${typedClient.commission_amount_eur}-${typedClient.commission_percentage}`}
              clientId={typedClient.id}
              commissionType={typedClient.commission_type}
              commissionAmountEur={typedClient.commission_amount_eur}
              commissionPercentage={typedClient.commission_percentage}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pievienot dienas datus (izmaksas un leadu skaits)</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addMetricsAction} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="clientId" value={typedClient.id} />
              <div className="space-y-1.5">
                <Label htmlFor="date">Datums</Label>
                <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="spend_eur">Izmaksas (€)</Label>
                <Input id="spend_eur" name="spend_eur" type="number" step="0.01" min="0" required className="w-32" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="leads_count">Leadu skaits</Label>
                <Input id="leads_count" name="leads_count" type="number" min="0" required className="w-28" />
              </div>
              <Button type="submit">Pievienot</Button>
            </form>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-3 text-lg font-semibold">Dienas dati</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datums</TableHead>
                <TableHead>Izmaksas</TableHead>
                <TableHead>Leadi</TableHead>
                <TableHead>Cena/lead (FB)</TableHead>
                <TableHead>Avots</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricsList.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{formatDate(m.date)}</TableCell>
                  <TableCell>{formatEur(m.spend_eur)}</TableCell>
                  <TableCell>{m.leads_count}</TableCell>
                  <TableCell>{formatEur(m.leads_count > 0 ? m.spend_eur / m.leads_count : null)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {m.source === "manual" ? "Manuāli" : "Facebook API"}
                  </TableCell>
                </TableRow>
              ))}
              {metricsList.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Vēl nav ievadīti dati.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CollapsibleSection>

      <CollapsibleSection icon={Plug} title="Ielūgumi un API piekļuve (neobligāti)">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Uzaicināt klienta lietotāju</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteClientForm clientId={typedClient.id} />
            </CardContent>
          </Card>

          <ApiKeyCard clientId={typedClient.id} apiKeyPrefix={typedClient.api_key_prefix} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>WhatsApp paziņojumi</CardTitle>
          </CardHeader>
          <CardContent>
            <WhatsAppSettingsForm clientId={typedClient.id} whatsappPhone={typedClient.whatsapp_phone} />
          </CardContent>
        </Card>
      </CollapsibleSection>

      <CollapsibleSection icon={CalendarDays} title="Kalendārs (neobligāti)" open={calendarSectionOpen}>
        <CalendarMonthGrid
          year={calYear}
          month={calMonth}
          events={calendarEvents}
          basePath={`/clients/${typedClient.id}`}
          paramNames={CALENDAR_PARAM_NAMES}
          hiddenFields={{ clientId: typedClient.id }}
          createEventAction={createCalendarEventAction}
          deleteEventAction={deleteCalendarEventAction}
        />
      </CollapsibleSection>

      <CollapsibleSection icon={SlidersHorizontal} title="Pielāgotie lauki (neobligāti)">
        <p className="text-sm text-muted-foreground">
          Papildu lauki, ko šis klients var aizpildīt caur API vai manuālo pievienošanu (bez telefona un
          e-pasta, kas vienmēr ir pieejami).
        </p>
        <LeadFieldEditor
          fields={fieldDefs}
          hiddenFields={{ clientId: typedClient.id }}
          addAction={addLeadFieldAction}
          updateAction={updateLeadFieldAction}
          deleteAction={deleteLeadFieldAction}
        />
      </CollapsibleSection>
    </div>
  );
}
