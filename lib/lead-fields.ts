import type { LeadFieldDefinition } from "./types";

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
