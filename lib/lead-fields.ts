import type { LeadFieldDefinition } from "./types";

export type DefaultFieldKey = "name" | "email" | "phone" | "group_name" | "preferred_dates";

export const DEFAULT_FIELD_SEED: { key: DefaultFieldKey; label: string; is_required: boolean; sort_order: number }[] = [
  { key: "name", label: "Vārds", is_required: true, sort_order: -10 },
  { key: "email", label: "E-pasts", is_required: false, sort_order: -9 },
  { key: "phone", label: "Tālrunis", is_required: false, sort_order: -8 },
  { key: "group_name", label: "Grupa", is_required: false, sort_order: -7 },
  { key: "preferred_dates", label: "Izvēlētie datumi", is_required: false, sort_order: -6 },
];

export function getDefaultFieldDef(
  defs: LeadFieldDefinition[],
  key: DefaultFieldKey
): LeadFieldDefinition | undefined {
  return defs.find((d) => d.is_default && d.key === key);
}

export function isDefaultFieldEnabled(defs: LeadFieldDefinition[], key: DefaultFieldKey): boolean {
  return getDefaultFieldDef(defs, key)?.is_enabled ?? true;
}

function checkDefaultFieldRequired(def: LeadFieldDefinition | undefined, isEmpty: boolean): void {
  if (def?.is_required && isEmpty) {
    throw new Error(`Lauks "${def.label}" ir obligāts.`);
  }
}

/**
 * Same rule as validateDefaultFields, for callers that already have the raw
 * phone/email/group/dates values from a source other than FormData (e.g. a
 * parsed JSON API request body).
 */
export function resolveAndCheckDefaultField<T>(
  def: LeadFieldDefinition | undefined,
  value: T,
  emptyValue: T,
  isEmpty: (v: T) => boolean
): T {
  const enabled = def?.is_enabled ?? true;
  const resolved = enabled ? value : emptyValue;
  checkDefaultFieldRequired(def, isEmpty(resolved));
  return resolved;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Resolves and validates the 5 default fields from a lead add/edit form's FormData
 * against that client's per-field label/required/enabled settings. A disabled field's
 * submitted value is dropped (stored as empty/null) rather than rejected.
 */
export function validateDefaultFields(
  defs: LeadFieldDefinition[],
  formData: FormData
): { name: string | null; email: string | null; phone: string | null; group_name: string | null; datesInput: string } {
  const nameDef = getDefaultFieldDef(defs, "name");
  const emailDef = getDefaultFieldDef(defs, "email");
  const phoneDef = getDefaultFieldDef(defs, "phone");
  const groupDef = getDefaultFieldDef(defs, "group_name");
  const datesDef = getDefaultFieldDef(defs, "preferred_dates");

  const raw = (name: string) => {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
  };

  const name = isDefaultFieldEnabled(defs, "name") ? raw("name") : "";
  const email = isDefaultFieldEnabled(defs, "email") ? raw("email") : "";
  const phone = isDefaultFieldEnabled(defs, "phone") ? raw("phone") : "";
  const groupName = isDefaultFieldEnabled(defs, "group_name") ? raw("group_name") : "";
  const datesInput = isDefaultFieldEnabled(defs, "preferred_dates") ? raw("dates") : "";

  if (email && !EMAIL_RE.test(email)) {
    throw new Error(`Lauks "${emailDef?.label ?? "E-pasts"}" nav derīgs e-pasts.`);
  }

  checkDefaultFieldRequired(nameDef, !name);
  checkDefaultFieldRequired(emailDef, !email);
  checkDefaultFieldRequired(phoneDef, !phone);
  checkDefaultFieldRequired(groupDef, !groupName);
  checkDefaultFieldRequired(datesDef, !datesInput);

  return {
    name: name || null,
    email: email || null,
    phone: phone || null,
    group_name: groupName || null,
    datesInput,
  };
}

export function assertLabelAvailable(
  existing: { id: string; label: string }[],
  label: string,
  excludeId?: string
): void {
  const normalized = label.trim().toLowerCase();
  const collision = existing.find((d) => d.id !== excludeId && d.label.trim().toLowerCase() === normalized);
  if (collision) {
    throw new Error(`Lauks ar nosaukumu "${label}" jau eksistē.`);
  }
}

export function slugifyFieldKey(label: string): string {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "field";
}

export function parseSelectOptions(input: string): string[] {
  return input
    .split(",")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

export function collectLeadFieldValues(
  definitions: LeadFieldDefinition[],
  formData: FormData,
  options: { includeEmpty?: boolean } = {}
): { field_definition_id: string; value: string }[] {
  const values: { field_definition_id: string; value: string }[] = [];

  for (const def of definitions) {
    const raw = formData.get(`field_${def.key}`);
    const value = typeof raw === "string" ? raw.trim() : "";

    if (!value) {
      if (def.is_required) {
        throw new Error(`Lauks "${def.label}" ir obligāts.`);
      }
      if (options.includeEmpty) {
        values.push({ field_definition_id: def.id, value: "" });
      }
      continue;
    }

    values.push({ field_definition_id: def.id, value: validateFieldValue(def, value) });
  }

  return values;
}

export function validateFieldValue(def: LeadFieldDefinition, raw: string): string {
  const value = raw.trim();

  switch (def.field_type) {
    case "number":
      if (value === "" || Number.isNaN(Number(value))) {
        throw new Error(`Lauks "${def.label}" jābūt skaitlim.`);
      }
      break;
    case "date":
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`Lauks "${def.label}" jābūt formātā GGGG-MM-DD.`);
      }
      break;
    case "select":
      if (!def.options?.includes(value)) {
        throw new Error(`Lauks "${def.label}" satur nederīgu vērtību.`);
      }
      break;
    default:
      break;
  }

  return value;
}
