import { notFound } from "next/navigation";
import { Percent, Plug, SlidersHorizontal } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  addMetricsAction,
  addLeadFieldAction,
  updateLeadFieldAction,
  deleteLeadFieldAction,
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
import { CommissionSettingsForm } from "@/components/commission-settings-form";
import { LeadFieldEditor } from "@/components/lead-field-editor";
import type { AdMetricsDaily, Client, LeadFieldDefinition } from "@/lib/types";

export default async function ClientSettingsTabPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: client }, { data: metrics }, { data: fieldDefsData }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", params.id).single(),
    supabase
      .from("ad_metrics_daily")
      .select("*")
      .eq("client_id", params.id)
      .order("date", { ascending: false }),
    supabase
      .from("lead_field_definitions")
      .select("*")
      .eq("client_id", params.id)
      .order("sort_order", { ascending: true }),
  ]);

  if (!client) notFound();

  const typedClient = client as Client;
  const metricsList = (metrics ?? []) as AdMetricsDaily[];
  const fieldDefs = (fieldDefsData ?? []) as LeadFieldDefinition[];
  const summary = summarizeMetrics(metricsList, commissionConfigFromClient(typedClient));

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Iestatījumi</h2>

      <CollapsibleSection icon={Percent} title="Komisija un izmaksu izsekošana">
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

      <CollapsibleSection icon={Plug} title="Ielūgumi un API piekļuve">
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

      <CollapsibleSection icon={SlidersHorizontal} title="Pielāgotie lauki">
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
