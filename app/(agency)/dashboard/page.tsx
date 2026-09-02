import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { summarizeMetrics, commissionConfigFromClient, formatEur } from "@/lib/commission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Client, AdMetricsDaily } from "@/lib/types";

export default async function AgencyDashboardPage() {
  const supabase = createClient();

  const [{ data: clients }, { data: metrics }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("ad_metrics_daily").select("*"),
  ]);

  const clientList = (clients ?? []) as Client[];
  const metricsList = (metrics ?? []) as AdMetricsDaily[];

  const rows = clientList.map((client) => {
    const clientMetrics = metricsList.filter((m) => m.client_id === client.id);
    const summary = summarizeMetrics(clientMetrics, commissionConfigFromClient(client));
    return { client, summary };
  });

  const totalLeads = rows.reduce((sum, r) => sum + r.summary.totalLeads, 0);
  const totalOwed = rows.reduce((sum, r) => sum + r.summary.totalCommissionOwedEur, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Pārskats</h1>
        <p className="text-muted-foreground">Visi klienti un to rezultāti.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Klienti</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{clientList.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leadi kopā</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{totalLeads}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Komisija kopā</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatEur(totalOwed)}</CardContent>
        </Card>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Klients</TableHead>
            <TableHead>Leadi</TableHead>
            <TableHead>Cena/lead (FB)</TableHead>
            <TableHead>Cena/lead (ar komisiju)</TableHead>
            <TableHead>Jāmaksā aģentūrai</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ client, summary }) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>{summary.totalLeads}</TableCell>
              <TableCell>{formatEur(summary.rawCostPerLeadEur)}</TableCell>
              <TableCell>{formatEur(summary.clientCostPerLeadEur)}</TableCell>
              <TableCell>{formatEur(summary.totalCommissionOwedEur)}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                Vēl nav neviena klienta.{" "}
                <Link href="/clients" className="underline">
                  Pievienot pirmo klientu
                </Link>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
