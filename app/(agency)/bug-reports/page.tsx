import { Trash2 } from "lucide-react";
import { requireAgencyAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { updateBugReportStatusAction, deleteBugReportAction } from "@/lib/actions/bug-reports";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BugSeverityBadge } from "@/components/ui/badge";
import { BugReportStatusSelect } from "@/components/bug-report-status-select";
import { formatDate } from "@/lib/dates";
import { BUG_REPORT_SEVERITY_LABELS, type BugReport } from "@/lib/types";

export default async function BugReportsPage() {
  await requireAgencyAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("bug_reports")
    .select("*, reporter:profiles!reported_by(full_name, email)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const reports = (data ?? []) as (BugReport & { reporter?: { full_name: string | null; email: string | null } | null })[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Kļūdu ziņojumi</h1>
        <p className="text-muted-foreground">Lietotāju iesniegtie ziņojumi par problēmām CRM sistēmā.</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nosaukums</TableHead>
            <TableHead>Ziņotājs</TableHead>
            <TableHead>Nopietnība</TableHead>
            <TableHead>Lapa</TableHead>
            <TableHead>Datums</TableHead>
            <TableHead>Statuss</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="max-w-sm">
                <p className="font-medium">{report.title}</p>
                <p className="mt-0.5 whitespace-pre-wrap text-xs text-muted-foreground">{report.description}</p>
              </TableCell>
              <TableCell className="text-sm">
                {report.reporter?.full_name || report.reporter?.email || "Nezināms"}
              </TableCell>
              <TableCell>
                <BugSeverityBadge severity={report.severity} label={BUG_REPORT_SEVERITY_LABELS[report.severity]} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">{report.page_path || "—"}</TableCell>
              <TableCell className="text-sm">{formatDate(report.created_at)}</TableCell>
              <TableCell>
                <BugReportStatusSelect
                  reportId={report.id}
                  status={report.status}
                  updateAction={updateBugReportStatusAction}
                />
              </TableCell>
              <TableCell>
                <form action={deleteBugReportAction}>
                  <input type="hidden" name="reportId" value={report.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
          {reports.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                Vēl nav neviena ziņojuma.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
