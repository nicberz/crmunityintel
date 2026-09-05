"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { requireClientUser } from "@/lib/auth";
import { parseLeadsCsv } from "@/lib/csv";
import { parseDatesInput } from "@/lib/dates";
import { slugifyFieldKey, parseSelectOptions, collectLeadFieldValues } from "@/lib/lead-fields";
import { sendNewLeadWhatsAppNotification } from "@/lib/whatsapp";
import { fetchDueReminders, type DueReminder } from "@/lib/calendar-queries";
import { LEAD_STATUSES, TASK_STATUSES, TASK_PRIORITIES, type LeadFieldDefinition } from "@/lib/types";

const addLeadSchema = z.object({
  name: z.string().trim().min(1, "Vārds ir obligāts"),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  group_name: z.string().trim().optional().or(z.literal("")),
  dates: z.string().trim().optional().or(z.literal("")),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
});

export interface AddLeadState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function addLeadAction(_prevState: AddLeadState, formData: FormData): Promise<AddLeadState> {
  const profile = await requireClientUser();
  const parseResult = addLeadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    group_name: formData.get("group_name"),
    dates: formData.get("dates"),
    status: formData.get("status"),
  });
  if (!parseResult.success) {
    return { status: "error", message: parseResult.error.issues[0]?.message ?? "Nederīgi dati." };
  }
  const parsed = parseResult.data;

  const preferredDates = parsed.dates ? parseDatesInput(parsed.dates) : [];

  const supabase = createServerClient();

  const { data: fieldDefs } = await supabase
    .from("lead_field_definitions")
    .select("*")
    .eq("client_id", profile.client_id!);

  let fieldValues;
  try {
    fieldValues = collectLeadFieldValues((fieldDefs ?? []) as LeadFieldDefinition[], formData);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Nederīgi dati." };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      client_id: profile.client_id!,
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      notes: parsed.notes || null,
      group_name: parsed.group_name || null,
      preferred_dates: preferredDates.length ? preferredDates : null,
      source: "manual",
      status: parsed.status as (typeof LEAD_STATUSES)[number],
    })
    .select("id")
    .single();
  if (error) return { status: "error", message: error.message };
  if (!lead) return { status: "error", message: "Neizdevās izveidot leadu." };

  if (fieldValues.length > 0) {
    const { error: valuesError } = await supabase.from("lead_field_values").insert(
      fieldValues.map((f) => ({ lead_id: lead.id, field_definition_id: f.field_definition_id, value: f.value }))
    );
    if (valuesError) return { status: "error", message: valuesError.message };
  }

  const { data: clientRow } = await supabase
    .from("clients")
    .select("whatsapp_phone")
    .eq("id", profile.client_id!)
    .single();
  if (clientRow?.whatsapp_phone) {
    await sendNewLeadWhatsAppNotification({
      to: clientRow.whatsapp_phone,
      leadName: parsed.name,
      leadContact: parsed.phone || parsed.email || null,
    });
  }

  revalidatePath("/leads");
  revalidatePath("/overview");
  return { status: "success", message: `Leads "${parsed.name}" pievienots.` };
}

const updateLeadSchema = z.object({
  leadId: z.string().uuid(),
  name: z.string().trim().min(1, "Vārds ir obligāts"),
  email: z.string().trim().email().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  notes: z.string().trim().optional().or(z.literal("")),
  group_name: z.string().trim().optional().or(z.literal("")),
  dates: z.string().trim().optional().or(z.literal("")),
});

export async function updateLeadAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = updateLeadSchema.parse({
    leadId: formData.get("leadId"),
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    notes: formData.get("notes"),
    group_name: formData.get("group_name"),
    dates: formData.get("dates"),
  });

  const preferredDates = parsed.dates ? parseDatesInput(parsed.dates) : [];

  const supabase = createServerClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .update({
      name: parsed.name,
      email: parsed.email || null,
      phone: parsed.phone || null,
      notes: parsed.notes || null,
      group_name: parsed.group_name || null,
      preferred_dates: preferredDates.length ? preferredDates : null,
    })
    .eq("id", parsed.leadId)
    .eq("client_id", profile.client_id!)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  if (!lead) throw new Error("Leads nav atrasts.");

  const { data: fieldDefs } = await supabase
    .from("lead_field_definitions")
    .select("*")
    .eq("client_id", profile.client_id!);
  const fieldValues = collectLeadFieldValues((fieldDefs ?? []) as LeadFieldDefinition[], formData, {
    includeEmpty: true,
  });

  if (fieldValues.length > 0) {
    const { error: valuesError } = await supabase.from("lead_field_values").upsert(
      fieldValues.map((f) => ({
        lead_id: parsed.leadId,
        field_definition_id: f.field_definition_id,
        value: f.value,
      })),
      { onConflict: "lead_id,field_definition_id" }
    );
    if (valuesError) throw new Error(valuesError.message);
  }

  revalidatePath(`/leads/${parsed.leadId}`);
  revalidatePath("/leads");
}

const addLeadFieldSchema = z.object({
  label: z.string().trim().min(1, "Nosaukums ir obligāts"),
  fieldType: z.enum(["text", "number", "date", "select"]),
  options: z.string().trim().nullish().or(z.literal("")),
  isRequired: z.string().nullish(),
});

export async function addLeadFieldAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = addLeadFieldSchema.parse({
    label: formData.get("label"),
    fieldType: formData.get("fieldType"),
    options: formData.get("options"),
    isRequired: formData.get("isRequired"),
  });

  const options = parsed.fieldType === "select" ? parseSelectOptions(parsed.options ?? "") : null;
  if (parsed.fieldType === "select" && (!options || options.length === 0)) {
    throw new Error("Izvēlnes laukam jānorāda vismaz viena opcija.");
  }

  const supabase = createServerClient();
  const { data: existing } = await supabase
    .from("lead_field_definitions")
    .select("key")
    .eq("client_id", profile.client_id!);

  const existingKeys = new Set((existing ?? []).map((d) => d.key));
  const baseKey = slugifyFieldKey(parsed.label);
  let key = baseKey;
  let suffix = 1;
  while (existingKeys.has(key)) {
    suffix += 1;
    key = `${baseKey}_${suffix}`;
  }

  const { error } = await supabase.from("lead_field_definitions").insert({
    client_id: profile.client_id!,
    key,
    label: parsed.label,
    field_type: parsed.fieldType,
    options,
    is_required: parsed.isRequired === "on",
    sort_order: existingKeys.size,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath("/leads/[id]", "page");
}

const updateLeadFieldSchema = z.object({
  fieldId: z.string().uuid(),
  label: z.string().trim().min(1, "Nosaukums ir obligāts"),
  fieldType: z.enum(["text", "number", "date", "select"]),
  options: z.string().trim().nullish().or(z.literal("")),
  isRequired: z.string().nullish(),
});

export async function updateLeadFieldAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = updateLeadFieldSchema.parse({
    fieldId: formData.get("fieldId"),
    label: formData.get("label"),
    fieldType: formData.get("fieldType"),
    options: formData.get("options"),
    isRequired: formData.get("isRequired"),
  });

  const options = parsed.fieldType === "select" ? parseSelectOptions(parsed.options ?? "") : null;
  if (parsed.fieldType === "select" && (!options || options.length === 0)) {
    throw new Error("Izvēlnes laukam jānorāda vismaz viena opcija.");
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("lead_field_definitions")
    .update({
      label: parsed.label,
      field_type: parsed.fieldType,
      options,
      is_required: parsed.isRequired === "on",
    })
    .eq("id", parsed.fieldId)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath("/leads/[id]", "page");
}

const deleteLeadFieldSchema = z.object({
  fieldId: z.string().uuid(),
});

export async function deleteLeadFieldAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = deleteLeadFieldSchema.parse({
    fieldId: formData.get("fieldId"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("lead_field_definitions")
    .delete()
    .eq("id", parsed.fieldId)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath("/leads/[id]", "page");
}

const updateStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
});

export async function updateLeadStatusAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = updateStatusSchema.parse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.status as (typeof LEAD_STATUSES)[number] })
    .eq("id", parsed.leadId)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.leadId}`);
}

const bulkUpdateLeadStatusSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
});

export async function bulkUpdateLeadStatusAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = bulkUpdateLeadStatusSchema.parse({
    leadIds: formData.getAll("leadIds"),
    status: formData.get("status"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.status as (typeof LEAD_STATUSES)[number] })
    .in("id", parsed.leadIds)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

const bulkDeleteLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
});

export async function bulkDeleteLeadsAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = bulkDeleteLeadsSchema.parse({
    leadIds: formData.getAll("leadIds"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .in("id", parsed.leadIds)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
}

const addLeadCommentSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().trim().min(1, "Komentārs nevar būt tukšs"),
});

export async function addLeadCommentAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = addLeadCommentSchema.parse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("lead_comments").insert({
    lead_id: parsed.leadId,
    author_id: profile.id,
    body: parsed.body,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/leads/${parsed.leadId}`);
}

export async function importLeadsCsvAction(formData: FormData) {
  const profile = await requireClientUser();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Lūdzu, izvēlies CSV failu.");
  }

  const text = await file.text();
  const rows = parseLeadsCsv(text);

  if (rows.length === 0) {
    throw new Error("Failā nav atrasts neviens derīgs leads ieraksts.");
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("leads").insert(
    rows.map((r) => ({
      client_id: profile.client_id!,
      name: r.name,
      email: r.email,
      phone: r.phone,
      source: "csv" as const,
      status: "call_back" as const,
    }))
  );
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  revalidatePath("/overview");
}

const calendarEventSchema = z.object({
  leadId: z.string().uuid().nullish().or(z.literal("")),
  title: z.string().trim().min(1, "Nosaukums ir obligāts"),
  note: z.string().trim().optional().or(z.literal("")),
  startAt: z.string().min(1, "Datums un laiks ir obligāts"),
  reminderEnabled: z.string().nullish(),
  reminderMinutesBefore: z.coerce.number().int().min(0).optional(),
});

export interface CalendarEventState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function createCalendarEventAction(
  _prevState: CalendarEventState,
  formData: FormData
): Promise<CalendarEventState> {
  const profile = await requireClientUser();
  const parseResult = calendarEventSchema.safeParse({
    leadId: formData.get("leadId"),
    title: formData.get("title"),
    note: formData.get("note"),
    startAt: formData.get("startAt"),
    reminderEnabled: formData.get("reminderEnabled"),
    reminderMinutesBefore: formData.get("reminderMinutesBefore"),
  });
  if (!parseResult.success) {
    return { status: "error", message: parseResult.error.issues[0]?.message ?? "Nederīgi dati." };
  }
  const parsed = parseResult.data;

  let startAtIso: string;
  try {
    startAtIso = new Date(parsed.startAt).toISOString();
  } catch {
    return { status: "error", message: "Nederīgs datums/laiks." };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("calendar_events").insert({
    client_id: profile.client_id!,
    lead_id: parsed.leadId || null,
    created_by: profile.id,
    title: parsed.title,
    note: parsed.note || null,
    start_at: startAtIso,
    reminder_enabled: parsed.reminderEnabled === "on",
    reminder_minutes_before: parsed.reminderMinutesBefore ?? 60,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/calendar");
  if (parsed.leadId) revalidatePath(`/leads/${parsed.leadId}`);

  return { status: "success", message: `Ieraksts "${parsed.title}" pievienots.` };
}

const deleteCalendarEventSchema = z.object({ eventId: z.string().uuid() });

export async function deleteCalendarEventAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = deleteCalendarEventSchema.parse({ eventId: formData.get("eventId") });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", parsed.eventId)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
}

const dismissReminderSchema = z.object({ eventId: z.string().uuid() });

export async function dismissReminderAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = dismissReminderSchema.parse({ eventId: formData.get("eventId") });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("reminder_dismissals")
    .upsert({ event_id: parsed.eventId, user_id: profile.id }, { onConflict: "event_id,user_id" });
  if (error) throw new Error(error.message);
}

export async function getDueRemindersAction(): Promise<DueReminder[]> {
  const profile = await requireClientUser();
  return fetchDueReminders(createServerClient(), profile.id);
}

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Nosaukums ir obligāts"),
  description: z.string().trim().optional().or(z.literal("")),
  assignedTo: z.string().uuid().nullish().or(z.literal("")),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]),
  dueDate: z.string().trim().optional().or(z.literal("")),
});

export interface TaskFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function createTaskAction(
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const profile = await requireClientUser();
  const parseResult = createTaskSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    assignedTo: formData.get("assignedTo"),
    priority: formData.get("priority") || "medium",
    dueDate: formData.get("dueDate"),
  });
  if (!parseResult.success) {
    return { status: "error", message: parseResult.error.issues[0]?.message ?? "Nederīgi dati." };
  }
  const parsed = parseResult.data;

  const supabase = createServerClient();
  const { error } = await supabase.from("tasks").insert({
    client_id: profile.client_id!,
    created_by: profile.id,
    assigned_to: parsed.assignedTo || null,
    title: parsed.title,
    description: parsed.description || null,
    priority: parsed.priority as (typeof TASK_PRIORITIES)[number],
    due_date: parsed.dueDate || null,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath("/tasks");
  return { status: "success", message: `Uzdevums "${parsed.title}" pievienots.` };
}

const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  assignedTo: z.string().uuid().nullish().or(z.literal("")),
});

export async function updateTaskAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = updateTaskSchema.parse({
    taskId: formData.get("taskId"),
    status: formData.get("status") || undefined,
    priority: formData.get("priority") || undefined,
    assignedTo: formData.has("assignedTo") ? formData.get("assignedTo") : undefined,
  });

  const updates: Record<string, unknown> = {};
  if (parsed.status) {
    updates.status = parsed.status;
    updates.completed_at = parsed.status === "done" ? new Date().toISOString() : null;
  }
  if (parsed.priority) updates.priority = parsed.priority;
  if (formData.has("assignedTo")) updates.assigned_to = parsed.assignedTo || null;

  const supabase = createServerClient();
  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", parsed.taskId)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}

const deleteTaskSchema = z.object({ taskId: z.string().uuid() });

export async function deleteTaskAction(formData: FormData) {
  const profile = await requireClientUser();
  const parsed = deleteTaskSchema.parse({ taskId: formData.get("taskId") });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", parsed.taskId)
    .eq("client_id", profile.client_id!);
  if (error) throw new Error(error.message);

  revalidatePath("/tasks");
}
