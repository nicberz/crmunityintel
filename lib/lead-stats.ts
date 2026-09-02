import { LEAD_STATUSES, type LeadStatus } from "./types";

export function tallyLeadStatuses(statuses: LeadStatus[]): Record<LeadStatus, number> {
  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const status of statuses) {
    counts[status]++;
  }
  return counts;
}
