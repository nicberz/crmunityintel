import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/api-key";
import { EMAIL_RE, validateFieldValue } from "@/lib/lead-fields";
import { sendNewLeadWhatsAppNotification } from "@/lib/whatsapp";
import type { LeadFieldDefinition } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400, headers: corsHeaders });
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);
}

function readScalar(def: LeadFieldDefinition, raw: unknown): string {
  if (typeof raw !== "string" && typeof raw !== "number") {
    throw new Error(`Field "${def.key}" must be a string or number`);
  }
  return validateFieldValue(def, String(raw));
}

// Accepts an array or a comma-separated string of YYYY-MM-DD dates.
function readDates(def: LeadFieldDefinition, raw: unknown): string[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : null;
  if (!list) throw new Error(`Field "${def.key}" must be a list of dates`);
  const dates = list.map((d) => String(d).trim()).filter(Boolean);
  if (dates.some((d) => !DATE_RE.test(d))) {
    throw new Error(`Field "${def.key}" must contain dates as YYYY-MM-DD`);
  }
  return dates;
}

// Flat JSON body: every enabled field (default or custom) is sent under its key, as shown in
// Settings → Leadu lauki. Unknown keys and disabled fields are ignored.
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401, headers: corsHeaders });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest("Body must be a JSON object");
  }
  const submitted = body as Record<string, unknown>;

  const admin = createAdminClient();

  const { data: client } = await admin
    .from("clients")
    .select("id, whatsapp_phone")
    .eq("api_key_hash", hashApiKey(apiKey))
    .single();

  if (!client) {
    return NextResponse.json({ error: "Invalid x-api-key" }, { status: 401, headers: corsHeaders });
  }

  const { data: fieldDefs } = await admin
    .from("lead_field_definitions")
    .select("*")
    .eq("client_id", client.id);
  const definitions = ((fieldDefs ?? []) as LeadFieldDefinition[]).filter((d) => d.is_enabled);

  const lead: {
    name: string | null;
    email: string | null;
    phone: string | null;
    group_name: string | null;
    preferred_dates: string[] | null;
  } = { name: null, email: null, phone: null, group_name: null, preferred_dates: null };
  const fieldValues: { field_definition_id: string; value: string }[] = [];

  try {
    for (const def of definitions) {
      const raw = submitted[def.key];
      if (isEmpty(raw)) {
        if (def.is_required) throw new Error(`Missing required field "${def.key}"`);
        continue;
      }

      switch (def.default_kind) {
        case "email":
          if (typeof raw !== "string" || !EMAIL_RE.test(raw.trim())) {
            throw new Error(`Field "${def.key}" must be a valid email`);
          }
          lead.email = raw.trim();
          break;
        case "preferred_dates": {
          const dates = readDates(def, raw);
          if (dates.length === 0 && def.is_required) throw new Error(`Missing required field "${def.key}"`);
          lead.preferred_dates = dates.length ? dates : null;
          break;
        }
        case "name":
        case "phone":
        case "group_name":
          lead[def.default_kind] = readScalar(def, raw);
          break;
        default:
          fieldValues.push({ field_definition_id: def.id, value: readScalar(def, raw) });
      }
    }
  } catch (err) {
    return badRequest(err instanceof Error ? err.message : "Invalid payload");
  }

  const { data: inserted, error } = await admin
    .from("leads")
    .insert({
      client_id: client.id,
      ...lead,
      source: "website_form",
      status: "call_back",
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500, headers: corsHeaders });
  }

  if (fieldValues.length > 0) {
    const { error: valuesError } = await admin.from("lead_field_values").insert(
      fieldValues.map((f) => ({
        lead_id: inserted.id,
        field_definition_id: f.field_definition_id,
        value: f.value,
      }))
    );
    if (valuesError) {
      return NextResponse.json({ error: "Failed to save custom fields" }, { status: 500, headers: corsHeaders });
    }
  }

  if (client.whatsapp_phone) {
    await sendNewLeadWhatsAppNotification({
      to: client.whatsapp_phone,
      leadName: lead.name,
      leadContact: lead.phone || lead.email || null,
    });
  }

  return NextResponse.json({ id: inserted.id }, { status: 201, headers: corsHeaders });
}
