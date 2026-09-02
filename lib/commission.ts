import type { AdMetricsDaily, Client } from "@/lib/types";

export type CommissionConfig =
  | { type: "flat"; amountEur: number }
  | { type: "percentage"; percentage: number };

export function commissionConfigFromClient(client: Pick<Client, "commission_type" | "commission_amount_eur" | "commission_percentage">): CommissionConfig {
  return client.commission_type === "percentage"
    ? { type: "percentage", percentage: client.commission_percentage ?? 0 }
    : { type: "flat", amountEur: client.commission_amount_eur };
}

export interface CommissionSummary {
  totalLeads: number;
  totalSpendEur: number;
  rawCostPerLeadEur: number | null;
  clientCostPerLeadEur: number | null;
  totalCommissionOwedEur: number;
}

/**
 * Rolls up a range of daily ad metrics into the numbers a client cares about:
 * how many leads, what Facebook charged per lead, and what they owe once the
 * agency's commission (flat fee per lead, or a percentage of spend) is added
 * on top.
 */
export function summarizeMetrics(
  metrics: Pick<AdMetricsDaily, "spend_eur" | "leads_count">[],
  commission: CommissionConfig
): CommissionSummary {
  const totalLeads = metrics.reduce((sum, m) => sum + m.leads_count, 0);
  const totalSpendEur = metrics.reduce((sum, m) => sum + m.spend_eur, 0);

  const rawCostPerLeadEur = totalLeads > 0 ? totalSpendEur / totalLeads : null;
  const totalCommissionOwedEur =
    commission.type === "flat"
      ? totalLeads * commission.amountEur
      : totalSpendEur * (commission.percentage / 100);
  const clientCostPerLeadEur =
    totalLeads > 0 ? (totalSpendEur + totalCommissionOwedEur) / totalLeads : null;

  return {
    totalLeads,
    totalSpendEur,
    rawCostPerLeadEur,
    clientCostPerLeadEur,
    totalCommissionOwedEur,
  };
}

export function costPerLeadForDay(
  metric: Pick<AdMetricsDaily, "spend_eur" | "leads_count">,
  commission: CommissionConfig
): number | null {
  if (metric.leads_count <= 0) return null;
  const commissionForDay =
    commission.type === "flat"
      ? commission.amountEur * metric.leads_count
      : metric.spend_eur * (commission.percentage / 100);
  return (metric.spend_eur + commissionForDay) / metric.leads_count;
}

export function formatEur(amount: number | null): string {
  if (amount === null) return "—";
  return new Intl.NumberFormat("lv-LV", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}
