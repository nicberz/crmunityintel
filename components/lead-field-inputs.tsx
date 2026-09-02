import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LeadFieldDefinition } from "@/lib/types";

export function LeadFieldInputs({
  fields,
  values,
}: {
  fields: LeadFieldDefinition[];
  values?: Record<string, string>;
}) {
  if (fields.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1.5">
          <Label htmlFor={`field_${field.key}`}>
            {field.label}
            {field.is_required ? " *" : ""}
          </Label>
          {field.field_type === "select" ? (
            <Select
              id={`field_${field.key}`}
              name={`field_${field.key}`}
              required={field.is_required}
              defaultValue={values?.[field.id] ?? ""}
            >
              <option value="" disabled>
                Izvēlies...
              </option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              id={`field_${field.key}`}
              name={`field_${field.key}`}
              required={field.is_required}
              type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
              defaultValue={values?.[field.id] ?? ""}
            />
          )}
        </div>
      ))}
    </div>
  );
}
