import { createClient } from "@/lib/supabase/server";
import { requireClientUser } from "@/lib/auth";
import { summarizeMetrics, commissionConfigFromClient, costPerLeadForDay, formatEur } from "@/lib/commission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsChart, type ChartPoint } from "@/components/metrics-chart";
import { LeadStatusOverview } from "@/components/lead-status-overview";
import { tallyLeadStatuses } from "@/lib/lead-stats";
import type { AdMetricsDaily, Client, Lead } from "@/lib/types";

export default async function ClientOverviewPage() {
  const profile = await requireClientUser();
  const supabase = createClient();

  const [{ data: client }, { data: metrics }, { data: leadStatuses }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", profile.client_id!).single(),
    supabase
      .from("ad_metrics_daily")
      .select("*")
      .eq("client_id", profile.client_id!)
      .order("date", { ascending: true }),
    supabase.from("leads").select("status").eq("client_id", profile.client_id!),
  ]);

  const typedClient = client as Client | null;
  const metricsList = (metrics ?? []) as AdMetricsDaily[];
  const statusCounts = tallyLeadStatuses(((leadStatuses ?? []) as Pick<Lead, "status">[]).map((l) => l.status));
  const commissionConfig = typedClient ? commissionConfigFromClient(typedClient) : { type: "flat" as const, amountEur: 0 };
  const summary = summarizeMetrics(metricsList, commissionConfig);

  const chartData: ChartPoint[] = metricsList.map((m) => ({
    date: new Date(m.date).toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit" }),
    costPerLead: costPerLeadForDay(m, commissionConfig),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Pārskats</h1>
        <p className="text-muted-foreground">{typedClient?.name}</p>
      </div>

      <LeadStatusOverview counts={statusCounts} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Leadi kopā</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{summary.totalLeads}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Reklāmas izmaksas</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatEur(summary.totalSpendEur)}</CardContent>
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
            <CardTitle>Kopā jāmaksā</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">
            {formatEur(summary.totalCommissionOwedEur)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cena par leadu laika gaitā</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
