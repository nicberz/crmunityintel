"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { requireProfile, requireAgencyAdmin } from "@/lib/auth";
import { BUG_REPORT_SEVERITIES, BUG_REPORT_STATUSES } from "@/lib/types";

const submitBugReportSchema = z.object({
  title: z.string().trim().min(1, "Nosaukums ir obligāts"),
  description: z.string().trim().min(1, "Apraksts ir obligāts"),
  severity: z.enum(BUG_REPORT_SEVERITIES as [string, ...string[]]),
  pagePath: z.string().trim().optional().or(z.literal("")),
});

export interface BugReportFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function submitBugReportAction(
  _prevState: BugReportFormState,
  formData: FormData
): Promise<BugReportFormState> {
  const profile = await requireProfile();
  const parseResult = submitBugReportSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity") || "medium",
    pagePath: formData.get("pagePath"),
  });
  if (!parseResult.success) {
    return { status: "error", message: parseResult.error.issues[0]?.message ?? "Nederīgi dati." };
  }
  const parsed = parseResult.data;

  const supabase = createServerClient();
  const { error } = await supabase.from("bug_reports").insert({
    reported_by: profile.id,
    reporter_role: profile.role,
    page_path: parsed.pagePath || null,
    title: parsed.title,
    description: parsed.description,
    severity: parsed.severity as (typeof BUG_REPORT_SEVERITIES)[number],
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/bug-reports");
  return { status: "success", message: "Paldies! Ziņojums nosūtīts." };
}

const updateBugReportStatusSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(BUG_REPORT_STATUSES as [string, ...string[]]),
});

export async function updateBugReportStatusAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = updateBugReportStatusSchema.parse({
    reportId: formData.get("reportId"),
    status: formData.get("status"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("bug_reports")
    .update({ status: parsed.status as (typeof BUG_REPORT_STATUSES)[number] })
    .eq("id", parsed.reportId);
  if (error) throw new Error(error.message);

  revalidatePath("/bug-reports");
}
