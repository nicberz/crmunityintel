"use client";

import { Select } from "@/components/ui/select";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/types";

export function LeadStatusSelect({
  leadId,
  status,
  action,
}: {
  leadId: string;
  status: LeadStatus;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="leadId" value={leadId} />
      <Select
        name="status"
        defaultValue={status}
        className="h-8 w-40 text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
    </form>
  );
}
