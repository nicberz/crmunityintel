import { MessageSquare, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { LeadEditForm } from "@/components/lead-edit-form";
import { CalendarEventForm } from "@/components/calendar-event-form";
import { formatEventTime } from "@/lib/calendar";
import {
  LEAD_STATUS_LABELS,
  type CalendarEvent,
  type Lead,
  type LeadFieldDefinition,
} from "@/lib/types";

export interface LeadCommentWithAuthor {
  id: string;
  body: string;
  created_at: string;
  authorName: string;
}

export interface LeadStatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  changedByName: string;
}

export interface LeadCustomFieldValue {
  id: string;
  label: string;
  value: string;
}

export function LeadDetail({
  lead,
  comments,
  statusHistory,
  customFields,
  fieldDefs,
  events,
  updateStatusAction,
  addCommentAction,
  updateLeadAction,
  addEventAction,
}: {
  lead: Lead;
  comments: LeadCommentWithAuthor[];
  statusHistory: LeadStatusHistoryEntry[];
  customFields: LeadCustomFieldValue[];
  fieldDefs: LeadFieldDefinition[];
  events: CalendarEvent[];
  updateStatusAction: (formData: FormData) => void;
  addCommentAction: (formData: FormData) => void;
  updateLeadAction: (formData: FormData) => void;
  addEventAction: (prevState: { status: "idle" | "success" | "error"; message: string }, formData: FormData) => Promise<{ status: "idle" | "success" | "error"; message: string }>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Klienta informācija</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadEditForm
              key={lead.updated_at}
              lead={lead}
              fieldDefs={fieldDefs}
              customFields={customFields}
              updateAction={updateLeadAction}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statuss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LeadStatusSelect leadId={lead.id} status={lead.status} action={updateStatusAction} />

            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Statusu vēsture</p>
              {statusHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">Statuss vēl nav mainīts.</p>
              )}
              <ul className="space-y-1 text-sm">
                {statusHistory.map((h) => (
                  <li key={h.id} className="text-muted-foreground">
                    {h.old_status ? LEAD_STATUS_LABELS[h.old_status as keyof typeof LEAD_STATUS_LABELS] : "—"}
                    {" → "}
                    {LEAD_STATUS_LABELS[h.new_status as keyof typeof LEAD_STATUS_LABELS]}
                    {" · "}
                    {h.changedByName}
                    {" · "}
                    {new Date(h.created_at).toLocaleString("lv-LV")}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      <CollapsibleSection icon={MessageSquare} title="Komentāri" open={comments.length > 0}>
        <form action={addCommentAction} className="space-y-2">
          <input type="hidden" name="leadId" value={lead.id} />
          <Textarea name="body" placeholder="Pievienot komentāru..." rows={3} required />
          <Button type="submit" size="sm">
            Pievienot komentāru
          </Button>
        </form>

        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="rounded-md border border-border p-3 text-sm">
              <p className="whitespace-pre-wrap">{c.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {c.authorName} · {new Date(c.created_at).toLocaleString("lv-LV")}
              </p>
            </li>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">Vēl nav neviena komentāra.</p>
          )}
        </ul>
      </CollapsibleSection>

      <CollapsibleSection icon={CalendarDays} title="Kalendārs" open={events.length > 0}>
        <CalendarEventForm
          action={addEventAction}
          hiddenFields={{ leadId: lead.id, clientId: lead.client_id }}
        />
        <ul className="space-y-3">
          {events.map((e) => (
            <li key={e.id} className="rounded-md border border-border p-3 text-sm">
              <p className="font-medium">{e.title}</p>
              {e.note && <p className="whitespace-pre-wrap text-muted-foreground">{e.note}</p>}
              <p className="mt-1 text-xs text-muted-foreground">{formatEventTime(e.start_at)}</p>
            </li>
          ))}
          {events.length === 0 && (
            <p className="text-sm text-muted-foreground">Vēl nav neviena ieraksta.</p>
          )}
        </ul>
      </CollapsibleSection>
    </div>
  );
}
