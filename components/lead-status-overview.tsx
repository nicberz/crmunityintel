import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/ui/badge";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

export function LeadStatusOverview({ counts }: { counts: Record<LeadStatus, number> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statusu pārskats</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {LEAD_STATUSES.map((status) => (
          <LeadStatusBadge
            key={status}
            status={status}
            label={`${LEAD_STATUS_LABELS[status]}: ${counts[status]}`}
          />
        ))}
      </CardContent>
    </Card>
  );
}
