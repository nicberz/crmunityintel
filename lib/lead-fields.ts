import type { LeadFieldDefinition, LeadFieldType } from "./types";

// Which built-in `leads` column a default field maps to (lead_field_definitions.default_kind).
// Its API key is `key`, generated from the label like any custom field.
export const DEFAULT_FIELD_KEYS = ["name", "email", "phone", "group_name", "preferred_dates"] as const;
export type DefaultFieldKey = (typeof DEFAULT_FIELD_KEYS)[number];

// Default fields stored in plain text columns can change type; email (format check, WhatsApp contact)
// and preferred_dates (a date[] column) keep their fixed format.
export const TYPE_EDITABLE_DEFAULT_KEYS: readonly string[] = ["name", "phone", "group_name"];

export function defaultFieldTypeUpdate(
  kind: string | null | undefined,
  fieldType: LeadFieldType | undefined,
  optionsInput: string | null | undefined
): Partial<Pick<LeadFieldDefinition, "field_type" | "options">> {
  if (!kind || !fieldType || !TYPE_EDITABLE_DEFAULT_KEYS.includes(kind)) return {};
  const options = fieldType === "select" ? parseSelectOptions(optionsInput ?? "") : null;
  if (fieldType === "select" && (!options || options.length === 0)) {
    throw new Error("Izvēlnes laukam jānorāda vismaz viena opcija.");
  }
  return { field_type: fieldType, options };
}

export const DEFAULT_FIELD_SEED: { kind: DefaultFieldKey; label: string; is_required: boolean; sort_order: number }[] = [
  { kind: "name", label: "Vārds", is_required: true, sort_order: -10 },
  { kind: "email", label: "E-pasts", is_required: false, sort_order: -9 },
  { kind: "phone", label: "Tālrunis", is_required: false, sort_order: -8 },
  { kind: "group_name", label: "Grupa", is_required: false, sort_order: -7 },
  { kind: "preferred_dates", label: "Izvēlētie datumi", is_required: false, sort_order: -6 },
];

export function getDefaultFieldDef(
  defs: LeadFieldDefinition[],
  kind: DefaultFieldKey
): LeadFieldDefinition | undefined {
  return defs.find((d) => d.is_default && d.default_kind === kind);
}

// A deleted default field has no settings row, so a missing row means the field isn't used.
export function isDefaultFieldEnabled(defs: LeadFieldDefinition[], kind: DefaultFieldKey): boolean {
  return getDefaultFieldDef(defs, kind)?.is_enabled ?? false;
}

function checkDefaultFieldRequired(def: LeadFieldDefinition | undefined, isEmpty: boolean): void {
  if (def?.is_required && isEmpty) {
    throw new Error(`Lauks "${def.label}" ir obligāts.`);
  }
}

// Slug of the label, suffixed _2, _3... if another field of the same client already uses it.
export function uniqueFieldKey(label: string, existingKeys: Iterable<string>): string {
  const taken = new Set(existingKeys);
  const baseKey = slugifyFieldKey(label);
  let key = baseKey;
  let suffix = 1;
  while (taken.has(key)) {
    suffix += 1;
    key = `${baseKey}_${suffix}`;
  }
  return key;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    name: name && nameDef ? validateFieldValue(nameDef, name) : name || null,
    email: email || null,
    phone: phone && phoneDef ? validateFieldValue(phoneDef, phone) : phone || null,
    group_name: groupName && groupDef ? validateFieldValue(groupDef, groupName) : groupName || null,
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
