"use client";

import { Select } from "@/components/ui/select";
import { BUG_REPORT_STATUSES, BUG_REPORT_STATUS_LABELS, type BugReportStatus } from "@/lib/types";

export function BugReportStatusSelect({
  reportId,
  status,
  updateAction,
}: {
  reportId: string;
  status: BugReportStatus;
  updateAction: (formData: FormData) => void;
}) {
  return (
    <form action={updateAction}>
      <input type="hidden" name="reportId" value={reportId} />
      <Select
        name="status"
        defaultValue={status}
        className="h-8 w-auto min-w-[8rem] max-w-full text-xs"
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        {BUG_REPORT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {BUG_REPORT_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
    </form>
  );
}
