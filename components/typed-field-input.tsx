import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { LeadFieldDefinition } from "@/lib/types";

export function TypedFieldInput({
  field,
  id,
  name,
  required,
  defaultValue,
  placeholder,
}: {
  field: LeadFieldDefinition | undefined;
  id: string;
  name: string;
  required?: boolean;
  defaultValue?: string;
  placeholder?: string;
}) {
  const type = field?.field_type ?? "text";

  if (type === "select") {
    return (
      <Select id={id} name={name} required={required} defaultValue={defaultValue ?? ""}>
        <option value="" disabled>
          Izvēlies...
        </option>
        {field?.options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      id={id}
      name={name}
      type={type === "number" ? "number" : type === "date" ? "date" : "text"}
      required={required}
      defaultValue={defaultValue}
      placeholder={type === "text" ? placeholder : undefined}
    />
  );
}
