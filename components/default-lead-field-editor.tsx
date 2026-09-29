"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FIELD_TYPE_LABELS } from "@/components/lead-field-editor";
import { DEFAULT_FIELD_SEED, TYPE_EDITABLE_DEFAULT_KEYS } from "@/lib/lead-fields";
import type { ActionResult } from "@/lib/action-result";
import type { LeadFieldDefinition, LeadFieldType } from "@/lib/types";

type FieldAction = (formData: FormData) => Promise<ActionResult>;

const FIXED_TYPE_LABELS: Record<string, string> = {
  email: "E-pasts",
  preferred_dates: "Datumu saraksts",
};

function isTypeEditable(field: LeadFieldDefinition): boolean {
  return !!field.default_kind && TYPE_EDITABLE_DEFAULT_KEYS.includes(field.default_kind);
}

function typeLabel(field: LeadFieldDefinition): string {
  return isTypeEditable(field)
    ? FIELD_TYPE_LABELS[field.field_type]
    : FIXED_TYPE_LABELS[field.default_kind ?? ""] ?? FIELD_TYPE_LABELS[field.field_type];
}

function TypeFields({ field }: { field: LeadFieldDefinition }) {
  const [fieldType, setFieldType] = useState<LeadFieldType>(field.field_type);

  if (!isTypeEditable(field)) {
    return (
      <p className="text-xs text-muted-foreground">
        Tips: {typeLabel(field)} — šim laukam tipu mainīt nevar.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor={`default-type-${field.id}`}>Tips</Label>
        <Select
          id={`default-type-${field.id}`}
          name="fieldType"
          value={fieldType}
          onChange={(e) => setFieldType(e.target.value as LeadFieldType)}
        >
          {(Object.keys(FIELD_TYPE_LABELS) as LeadFieldType[]).map((t) => (
            <option key={t} value={t}>
              {FIELD_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </div>
      {fieldType === "select" && (
        <div className="space-y-1.5">
          <Label htmlFor={`default-options-${field.id}`}>Opcijas (atdalītas ar komatu)</Label>
          <Input
            id={`default-options-${field.id}`}
            name="options"
            defaultValue={field.options?.join(", ") ?? ""}
          />
        </div>
      )}
    </>
  );
}

function HiddenFields({ values }: { values: Record<string, string> }) {
  return (
    <>
      {Object.entries(values).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export function DefaultLeadFieldEditor({
  fields,
  hiddenFields = {},
  updateAction,
  deleteAction,
  restoreAction,
}: {
  fields: LeadFieldDefinition[];
  hiddenFields?: Record<string, string>;
  updateAction: FieldAction;
  deleteAction: FieldAction;
  restoreAction: FieldAction;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deletedDefaults = DEFAULT_FIELD_SEED.filter((seed) => !fields.some((f) => f.default_kind === seed.kind));

  function submit(action: FieldAction, onSuccess?: () => void) {
    return async (formData: FormData) => {
      setError(null);
      const result = await action(formData);
      if (result.error) setError(result.error);
      else onSuccess?.();
    };
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="space-y-2">
        {fields.map((field) =>
          editingId === field.id ? (
            <li key={field.id} className="rounded-md border border-border p-3">
              <form action={submit(updateAction, () => setEditingId(null))} className="space-y-3">
                <HiddenFields values={hiddenFields} />
                <input type="hidden" name="fieldId" value={field.id} />
                <div className="space-y-1.5">
                  <Label htmlFor={`default-label-${field.id}`}>Lauka nosaukums</Label>
                  <Input id={`default-label-${field.id}`} name="label" required defaultValue={field.label} />
                </div>
                <TypeFields field={field} />
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isRequired" className="h-4 w-4" defaultChecked={field.is_required} />
                    Obligāts lauks
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isEnabled" className="h-4 w-4" defaultChecked={field.is_enabled} />
                    Aktīvs (redzams anketā un API)
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Saglabāt
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setError(null);
                      setEditingId(null);
                    }}
                  >
                    Atcelt
                  </Button>
                </div>
              </form>
            </li>
          ) : (
            <li
              key={field.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm"
            >
              <div className="min-w-0">
                <span className="font-medium">{field.label}</span>{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">{field.key}</code>{" "}
                <span className="text-muted-foreground">
                  ({typeLabel(field)}
                  {field.field_type === "select" && field.options?.length ? `: ${field.options.join(", ")}` : ""},{" "}
                  {field.is_required ? "obligāts" : "neobligāts"}
                  {field.is_enabled ? "" : ", deaktivizēts"})
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(field.id)}>
                  Rediģēt
                </Button>
                <form action={submit(deleteAction)}>
                  <HiddenFields values={hiddenFields} />
                  <input type="hidden" name="fieldId" value={field.id} />
                  <Button type="submit" variant="destructive" size="sm">
                    Dzēst
                  </Button>
                </form>
              </div>
            </li>
          )
        )}
        {fields.length === 0 && <p className="text-sm text-muted-foreground">Visi noklusējuma lauki ir dzēsti.</p>}
      </ul>

      {deletedDefaults.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            Dzēstie noklusējuma lauki — jau saglabātie dati netiek zaudēti, un lauku var atjaunot jebkurā brīdī:
          </p>
          <div className="flex flex-wrap gap-2">
            {deletedDefaults.map((seed) => (
              <form key={seed.kind} action={submit(restoreAction)}>
                <HiddenFields values={hiddenFields} />
                <input type="hidden" name="kind" value={seed.kind} />
                <Button type="submit" variant="outline" size="sm">
                  + {seed.label}
                </Button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
