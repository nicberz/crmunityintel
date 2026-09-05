"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient as createServerClient, createAdminClient } from "@/lib/supabase/server";
import { requireAgencyAdmin } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-key";
import { getSiteUrl } from "@/lib/site-url";
import { parseDatesInput } from "@/lib/dates";
import { slugifyFieldKey, parseSelectOptions, collectLeadFieldValues } from "@/lib/lead-fields";
import { sendNewLeadWhatsAppNotification } from "@/lib/whatsapp";
import { fetchDueReminders, type DueReminder } from "@/lib/calendar-queries";
import { LEAD_STATUSES, TASK_STATUSES, TASK_PRIORITIES, type LeadFieldDefinition } from "@/lib/types";

const createClientSchema = z.object({
  name: z.string().trim().min(1, "Nosaukums ir obligāts"),
  commission_amount_eur: z.coerce.number().min(0, "Komisijai jābūt vismaz 0"),
});

export async function createClientAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = createClientSchema.parse({
    name: formData.get("name"),
    commission_amount_eur: formData.get("commission_amount_eur"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("clients").insert(parsed);
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath("/dashboard");
}

const updateClientNameSchema = z.object({
  clientId: z.string().uuid(),
  name: z.string().trim().min(1, "Nosaukums ir obligāts"),
});

export async function updateClientNameAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = updateClientNameSchema.parse({
    clientId: formData.get("clientId"),
    name: formData.get("name"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("clients").update({ name: parsed.name }).eq("id", parsed.clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/clients");
  revalidatePath(`/clients/${parsed.clientId}`);
}

const deleteClientSchema = z.object({ clientId: z.string().uuid() });

export async function deleteClientAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = deleteClientSchema.parse({ clientId: formData.get("clientId") });

  const supabase = createServerClient();
  const { error } = await supabase.from("clients").delete().eq("id", parsed.clientId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/clients");
}

const updateCommissionSchema = z.discriminatedUnion("commissionType", [
  z.object({
    clientId: z.string().uuid(),
    commissionType: z.literal("flat"),
    commission_amount_eur: z.coerce.number().min(0, "Komisijai jābūt vismaz 0"),
  }),
  z.object({
    clientId: z.string().uuid(),
    commissionType: z.literal("percentage"),
    commission_percentage: z.coerce
      .number()
      .min(0, "Procentiem jābūt no 0 līdz 100")
      .max(100, "Procentiem jābūt no 0 līdz 100"),
  }),
]);

export async function updateCommissionAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = updateCommissionSchema.parse({
    clientId: formData.get("clientId"),
    commissionType: formData.get("commissionType"),
    commission_amount_eur: formData.get("commission_amount_eur"),
    commission_percentage: formData.get("commission_percentage"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("clients")
    .update(
      parsed.commissionType === "flat"
        ? { commission_type: "flat" as const, commission_amount_eur: parsed.commission_amount_eur }
        : { commission_type: "percentage" as const, commission_percentage: parsed.commission_percentage }
    )
    .eq("id", parsed.clientId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}/settings`);
  revalidatePath("/dashboard");
}

const addMetricsSchema = z.object({
  clientId: z.string().uuid(),
  date: z.string().min(1, "Datums ir obligāts"),
  spend_eur: z.coerce.number().min(0, "Izmaksām jābūt vismaz 0"),
  leads_count: z.coerce.number().int().min(0, "Leadu skaitam jābūt vismaz 0"),
});

export async function addMetricsAction(formData: FormData) {
  const profile = await requireAgencyAdmin();
  const parsed = addMetricsSchema.parse({
    clientId: formData.get("clientId"),
    date: formData.get("date"),
    spend_eur: formData.get("spend_eur"),
    leads_count: formData.get("leads_count"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("ad_metrics_daily").upsert(
    {
      client_id: parsed.clientId,
      date: parsed.date,
      spend_eur: parsed.spend_eur,
      leads_count: parsed.leads_count,
      source: "manual",
      created_by: profile.id,
    },
    { onConflict: "client_id,date" }
  );
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}/settings`);
  revalidatePath("/dashboard");
}

const inviteUserSchema = z.object({
  clientId: z.string().uuid(),
  email: z.string().email("Nederīgs e-pasts"),
  fullName: z.string().trim().optional(),
});

export interface InviteState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function inviteClientUserAction(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  await requireAgencyAdmin();

  const parseResult = inviteUserSchema.safeParse({
    clientId: formData.get("clientId"),
    email: formData.get("email"),
    fullName: formData.get("fullName") || undefined,
  });

  if (!parseResult.success) {
    return { status: "error", message: parseResult.error.issues[0]?.message ?? "Nederīgi dati." };
  }
  const parsed = parseResult.data;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.email, {
    data: {
      role: "client_user",
      client_id: parsed.clientId,
      full_name: parsed.fullName ?? null,
    },
    redirectTo: `${getSiteUrl()}/auth/confirm?next=/set-password`,
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath(`/clients/${parsed.clientId}/settings`);
  return { status: "success", message: `Ielūgums nosūtīts uz ${parsed.email}.` };
}

export interface ApiKeyState {
  status: "idle" | "success" | "error";
  message: string;
  apiKey?: string;
}

const generateApiKeySchema = z.object({
  clientId: z.string().uuid(),
});

export async function generateClientApiKeyAction(
  _prevState: ApiKeyState,
  formData: FormData
): Promise<ApiKeyState> {
  await requireAgencyAdmin();

  const parseResult = generateApiKeySchema.safeParse({
    clientId: formData.get("clientId"),
  });
  if (!parseResult.success) {
    return { status: "error", message: "Nederīgi dati." };
  }

  const { raw, hash, prefix } = generateApiKey();

  const supabase = createServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ api_key_hash: hash, api_key_prefix: prefix })
    .eq("id", parseResult.data.clientId);
  if (error) {
    return { status: "error", message: error.message };
  }

  revalidatePath(`/clients/${parseResult.data.clientId}/settings`);
  return { status: "success", message: "Atslēga izveidota. Saglabā to tagad — otrreiz tā netiks parādīta.", apiKey: raw };
}

const addLeadSchema = z.object({
  clientId: z.string().uuid(),
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
  await requireAgencyAdmin();
  const parseResult = addLeadSchema.safeParse({
    clientId: formData.get("clientId"),
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
    .eq("client_id", parsed.clientId);

  let fieldValues;
  try {
    fieldValues = collectLeadFieldValues((fieldDefs ?? []) as LeadFieldDefinition[], formData);
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Nederīgi dati." };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      client_id: parsed.clientId,
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
    .eq("id", parsed.clientId)
    .single();
  if (clientRow?.whatsapp_phone) {
    await sendNewLeadWhatsAppNotification({
      to: clientRow.whatsapp_phone,
      leadName: parsed.name,
      leadContact: parsed.phone || parsed.email || null,
    });
  }

  revalidatePath(`/clients/${parsed.clientId}`);
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
  await requireAgencyAdmin();
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
    .select("client_id")
    .single();
  if (error) throw new Error(error.message);
  if (!lead) throw new Error("Leads nav atrasts.");

  const { data: fieldDefs } = await supabase
    .from("lead_field_definitions")
    .select("*")
    .eq("client_id", lead.client_id);
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

  revalidatePath(`/clients/${lead.client_id}/leads/${parsed.leadId}`);
  revalidatePath(`/clients/${lead.client_id}`);
}

const updateClientWhatsAppSchema = z.object({
  clientId: z.string().uuid(),
  whatsapp_phone: z.string().trim().optional().or(z.literal("")),
});

export interface UpdateWhatsAppState {
  status: "idle" | "success" | "error";
  message: string;
}

export async function updateClientWhatsAppAction(
  _prevState: UpdateWhatsAppState,
  formData: FormData
): Promise<UpdateWhatsAppState> {
  await requireAgencyAdmin();
  const parseResult = updateClientWhatsAppSchema.safeParse({
    clientId: formData.get("clientId"),
    whatsapp_phone: formData.get("whatsapp_phone"),
  });
  if (!parseResult.success) {
    return { status: "error", message: parseResult.error.issues[0]?.message ?? "Nederīgi dati." };
  }
  const parsed = parseResult.data;

  const supabase = createServerClient();
  const { error } = await supabase
    .from("clients")
    .update({ whatsapp_phone: parsed.whatsapp_phone || null })
    .eq("id", parsed.clientId);
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/clients/${parsed.clientId}/settings`);
  return { status: "success", message: "WhatsApp numurs saglabāts." };
}

const addLeadFieldSchema = z.object({
  clientId: z.string().uuid(),
  label: z.string().trim().min(1, "Nosaukums ir obligāts"),
  fieldType: z.enum(["text", "number", "date", "select"]),
  options: z.string().trim().nullish().or(z.literal("")),
  isRequired: z.string().nullish(),
});

export async function addLeadFieldAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = addLeadFieldSchema.parse({
    clientId: formData.get("clientId"),
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
    .eq("client_id", parsed.clientId);

  const existingKeys = new Set((existing ?? []).map((d) => d.key));
  const baseKey = slugifyFieldKey(parsed.label);
  let key = baseKey;
  let suffix = 1;
  while (existingKeys.has(key)) {
    suffix += 1;
    key = `${baseKey}_${suffix}`;
  }

  const { error } = await supabase.from("lead_field_definitions").insert({
    client_id: parsed.clientId,
    key,
    label: parsed.label,
    field_type: parsed.fieldType,
    options,
    is_required: parsed.isRequired === "on",
    sort_order: existingKeys.size,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}`);
  revalidatePath(`/clients/${parsed.clientId}/settings`);
  revalidatePath("/clients/[id]/leads/[leadId]", "page");
}

const updateLeadFieldSchema = z.object({
  fieldId: z.string().uuid(),
  clientId: z.string().uuid(),
  label: z.string().trim().min(1, "Nosaukums ir obligāts"),
  fieldType: z.enum(["text", "number", "date", "select"]),
  options: z.string().trim().nullish().or(z.literal("")),
  isRequired: z.string().nullish(),
});

export async function updateLeadFieldAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = updateLeadFieldSchema.parse({
    fieldId: formData.get("fieldId"),
    clientId: formData.get("clientId"),
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
    .eq("id", parsed.fieldId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}`);
  revalidatePath(`/clients/${parsed.clientId}/settings`);
  revalidatePath("/clients/[id]/leads/[leadId]", "page");
}

const deleteLeadFieldSchema = z.object({
  fieldId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export async function deleteLeadFieldAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = deleteLeadFieldSchema.parse({
    fieldId: formData.get("fieldId"),
    clientId: formData.get("clientId"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("lead_field_definitions").delete().eq("id", parsed.fieldId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}`);
  revalidatePath(`/clients/${parsed.clientId}/settings`);
  revalidatePath("/clients/[id]/leads/[leadId]", "page");
}

const updateLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
});

export async function updateLeadStatusAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = updateLeadStatusSchema.parse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
  });

  const supabase = createServerClient();
  const { data: lead, error } = await supabase
    .from("leads")
    .update({ status: parsed.status as (typeof LEAD_STATUSES)[number] })
    .eq("id", parsed.leadId)
    .select("client_id")
    .single();
  if (error) throw new Error(error.message);
  if (!lead) throw new Error("Leads nav atrasts.");

  revalidatePath(`/clients/${lead.client_id}/leads/${parsed.leadId}`);
  revalidatePath(`/clients/${lead.client_id}`);
}

const bulkUpdateLeadStatusSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
  clientId: z.string().uuid(),
});

export async function bulkUpdateLeadStatusAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = bulkUpdateLeadStatusSchema.parse({
    leadIds: formData.getAll("leadIds"),
    status: formData.get("status"),
    clientId: formData.get("clientId"),
  });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsed.status as (typeof LEAD_STATUSES)[number] })
    .in("id", parsed.leadIds);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}`);
}

const bulkDeleteLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1),
  clientId: z.string().uuid(),
});

export async function bulkDeleteLeadsAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = bulkDeleteLeadsSchema.parse({
    leadIds: formData.getAll("leadIds"),
    clientId: formData.get("clientId"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("leads").delete().in("id", parsed.leadIds);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}`);
}

const addLeadCommentSchema = z.object({
  leadId: z.string().uuid(),
  body: z.string().trim().min(1, "Komentārs nevar būt tukšs"),
});

export async function addLeadCommentAction(formData: FormData) {
  const profile = await requireAgencyAdmin();
  const parsed = addLeadCommentSchema.parse({
    leadId: formData.get("leadId"),
    body: formData.get("body"),
  });

  const supabase = createServerClient();
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("client_id")
    .eq("id", parsed.leadId)
    .single();
  if (leadError) throw new Error(leadError.message);
  if (!lead) throw new Error("Leads nav atrasts.");

  const { error } = await supabase.from("lead_comments").insert({
    lead_id: parsed.leadId,
    author_id: profile.id,
    body: parsed.body,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${lead.client_id}/leads/${parsed.leadId}`);
}

const calendarEventSchema = z.object({
  clientId: z.string().uuid().nullish().or(z.literal("")),
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
  const profile = await requireAgencyAdmin();
  const parseResult = calendarEventSchema.safeParse({
    clientId: formData.get("clientId"),
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
    client_id: parsed.clientId || null,
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
  if (parsed.clientId) {
    revalidatePath(`/clients/${parsed.clientId}/calendar`);
    if (parsed.leadId) revalidatePath(`/clients/${parsed.clientId}/leads/${parsed.leadId}`);
  }

  return { status: "success", message: `Ieraksts "${parsed.title}" pievienots.` };
}

const deleteCalendarEventSchema = z.object({ eventId: z.string().uuid() });

export async function deleteCalendarEventAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = deleteCalendarEventSchema.parse({ eventId: formData.get("eventId") });

  const supabase = createServerClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", parsed.eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/calendar");
}

const dismissReminderSchema = z.object({ eventId: z.string().uuid() });

export async function dismissReminderAction(formData: FormData) {
  const profile = await requireAgencyAdmin();
  const parsed = dismissReminderSchema.parse({ eventId: formData.get("eventId") });

  const supabase = createServerClient();
  const { error } = await supabase
    .from("reminder_dismissals")
    .upsert({ event_id: parsed.eventId, user_id: profile.id }, { onConflict: "event_id,user_id" });
  if (error) throw new Error(error.message);
}

export async function getDueRemindersAction(): Promise<DueReminder[]> {
  const profile = await requireAgencyAdmin();
  return fetchDueReminders(createServerClient(), profile.id);
}

const createTaskSchema = z.object({
  clientId: z.string().uuid(),
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
  const profile = await requireAgencyAdmin();
  const parseResult = createTaskSchema.safeParse({
    clientId: formData.get("clientId"),
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
    client_id: parsed.clientId,
    created_by: profile.id,
    assigned_to: parsed.assignedTo || null,
    title: parsed.title,
    description: parsed.description || null,
    priority: parsed.priority as (typeof TASK_PRIORITIES)[number],
    due_date: parsed.dueDate || null,
  });
  if (error) return { status: "error", message: error.message };

  revalidatePath(`/clients/${parsed.clientId}/tasks`);
  return { status: "success", message: `Uzdevums "${parsed.title}" pievienots.` };
}

const updateTaskSchema = z.object({
  taskId: z.string().uuid(),
  clientId: z.string().uuid(),
  status: z.enum(TASK_STATUSES as [string, ...string[]]).optional(),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  assignedTo: z.string().uuid().nullish().or(z.literal("")),
});

export async function updateTaskAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = updateTaskSchema.parse({
    taskId: formData.get("taskId"),
    clientId: formData.get("clientId"),
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
  const { error } = await supabase.from("tasks").update(updates).eq("id", parsed.taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}/tasks`);
}

const deleteTaskSchema = z.object({ taskId: z.string().uuid(), clientId: z.string().uuid() });

export async function deleteTaskAction(formData: FormData) {
  await requireAgencyAdmin();
  const parsed = deleteTaskSchema.parse({
    taskId: formData.get("taskId"),
    clientId: formData.get("clientId"),
  });

  const supabase = createServerClient();
  const { error } = await supabase.from("tasks").delete().eq("id", parsed.taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/clients/${parsed.clientId}/tasks`);
}
