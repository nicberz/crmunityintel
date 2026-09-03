import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAgencyAdmin } from "@/lib/auth";
import {
  updateLeadStatusAction,
  addLeadCommentAction,
  updateLeadAction,
  createCalendarEventAction,
} from "@/app/(agency)/actions";
import {
  LeadDetail,
  type LeadCommentWithAuthor,
  type LeadStatusHistoryEntry,
  type LeadCustomFieldValue,
  type LeadCalendarEvent,
} from "@/components/lead-detail";
import type { Lead, LeadFieldDefinition, LeadFieldValue } from "@/lib/types";

export default async function AgencyLeadDetailPage({ params }: { params: { id: string; leadId: string } }) {
  await requireAgencyAdmin();
  const supabase = createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", params.leadId)
    .eq("client_id", params.id)
    .single();

  if (!lead) notFound();

  const [{ data: comments }, { data: statusHistory }, { data: fieldDefs }, { data: fieldValues }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("lead_comments")
        .select("id, body, created_at, author:profiles(full_name)")
        .eq("lead_id", params.leadId)
        .order("created_at", { ascending: true }),
      supabase
        .from("lead_status_history")
        .select("id, old_status, new_status, created_at, changed_by:profiles(full_name)")
        .eq("lead_id", params.leadId)
        .order("created_at", { ascending: true }),
      supabase
        .from("lead_field_definitions")
        .select("*")
        .eq("client_id", params.id)
        .order("sort_order", { ascending: true }),
      supabase.from("lead_field_values").select("*").eq("lead_id", params.leadId),
      supabase
        .from("calendar_events")
        .select("*, creator:profiles(full_name, email)")
        .eq("lead_id", params.leadId)
        .order("start_at", { ascending: true }),
    ]);
  if (eventsError) throw new Error(eventsError.message);

  const commentsList: LeadCommentWithAuthor[] = ((comments ?? []) as any[]).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    authorName: c.author?.full_name || "CRM lietotājs",
  }));

  const statusHistoryList: LeadStatusHistoryEntry[] = ((statusHistory ?? []) as any[]).map((h) => ({
    id: h.id,
    old_status: h.old_status,
    new_status: h.new_status,
    created_at: h.created_at,
    changedByName: h.changed_by?.full_name || "Sistēma",
  }));

  const valuesByDefinitionId = new Map(
    ((fieldValues ?? []) as LeadFieldValue[]).map((v) => [v.field_definition_id, v.value ?? ""])
  );
  const customFields: LeadCustomFieldValue[] = ((fieldDefs ?? []) as LeadFieldDefinition[]).map((def) => ({
    id: def.id,
    label: def.label,
    value: valuesByDefinitionId.get(def.id) ?? "",
  }));

  const eventsList: LeadCalendarEvent[] = ((events ?? []) as any[]).map((e) => ({
    ...e,
    creatorName: e.created_by ? e.creator?.full_name || e.creator?.email || "CRM lietotājs" : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/clients/${params.id}`} className="text-sm text-muted-foreground hover:underline">
          ← Atpakaļ uz klientu
        </Link>
        <h1 className="text-2xl font-semibold">{(lead as Lead).name || "Leads bez vārda"}</h1>
      </div>

      <LeadDetail
        lead={lead as Lead}
        comments={commentsList}
        statusHistory={statusHistoryList}
        customFields={customFields}
        fieldDefs={(fieldDefs ?? []) as LeadFieldDefinition[]}
        events={eventsList}
        updateStatusAction={updateLeadStatusAction}
        addCommentAction={addLeadCommentAction}
        updateLeadAction={updateLeadAction}
        addEventAction={createCalendarEventAction}
      />
    </div>
  );
}
