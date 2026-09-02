import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { hashApiKey } from "@/lib/api-key";
import { validateFieldValue } from "@/lib/lead-fields";
import { sendNewLeadWhatsAppNotification } from "@/lib/whatsapp";
import type { LeadFieldDefinition } from "@/lib/types";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
};

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const leadSubmissionSchema = z.object({
  phone: z.string().trim().min(1, "phone is required"),
  email: z.string().trim().email("email must be valid"),
  group: z.string().trim().optional(),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dates must be YYYY-MM-DD")).optional(),
  fields: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401, headers: corsHeaders });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400, headers: corsHeaders }
    );
  }

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
  const definitions = (fieldDefs ?? []) as LeadFieldDefinition[];

  const submittedFields = parsed.data.fields ?? {};
  const fieldValues: { field_definition_id: string; value: string }[] = [];

  for (const def of definitions) {
    const rawValue = submittedFields[def.key];
    if (rawValue === undefined || rawValue === null || rawValue === "") {
      if (def.is_required) {
        return NextResponse.json(
          { error: `Missing required field "${def.key}"` },
          { status: 400, headers: corsHeaders }
        );
      }
      continue;
    }

    try {
      fieldValues.push({ field_definition_id: def.id, value: validateFieldValue(def, String(rawValue)) });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Invalid field value" },
        { status: 400, headers: corsHeaders }
      );
    }
  }

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      client_id: client.id,
      name: null,
      email: parsed.data.email,
      phone: parsed.data.phone,
      group_name: parsed.data.group ?? null,
      preferred_dates: parsed.data.dates ?? null,
      source: "website_form",
      status: "call_back",
    })
    .select("id")
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500, headers: corsHeaders });
  }

  if (fieldValues.length > 0) {
    const { error: valuesError } = await admin.from("lead_field_values").insert(
      fieldValues.map((f) => ({
        lead_id: lead.id,
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
      leadName: null,
      leadContact: parsed.data.phone || parsed.data.email,
    });
  }

  return NextResponse.json({ id: lead.id }, { status: 201, headers: corsHeaders });
}
