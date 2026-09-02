"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LeadFieldDefinition, LeadFieldType } from "@/lib/types";

const FIELD_TYPE_LABELS: Record<LeadFieldType, string> = {
  text: "Teksts",
  number: "Skaitlis",
  date: "Datums",
  select: "Izvēlne",
};

const FIELD_TYPES = Object.keys(FIELD_TYPE_LABELS) as LeadFieldType[];

function HiddenFields({ values }: { values: Record<string, string> }) {
  return (
    <>
      {Object.entries(values).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );
}

export function LeadFieldEditor({
  fields,
  hiddenFields = {},
  addAction,
  updateAction,
  deleteAction,
}: {
  fields: LeadFieldDefinition[];
  hiddenFields?: Record<string, string>;
  addAction: (formData: FormData) => void;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newFieldType, setNewFieldType] = useState<LeadFieldType>("text");

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {fields.map((field) =>
          editingId === field.id ? (
            <li key={field.id} className="rounded-md border border-border p-3">
              <EditFieldForm
                field={field}
                hiddenFields={hiddenFields}
                action={updateAction}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li
              key={field.id}
              className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
            >
              <div>
                <span className="font-medium">{field.label}</span>{" "}
                <span className="text-muted-foreground">
                  ({FIELD_TYPE_LABELS[field.field_type]}
                  {field.field_type === "select" && field.options?.length
                    ? `: ${field.options.join(", ")}`
                    : ""}
                  {field.is_required ? ", obligāts" : ""})
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(field.id)}>
                  Rediģēt
                </Button>
                <form action={deleteAction}>
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
        {fields.length === 0 && <p className="text-sm text-muted-foreground">Vēl nav pielāgotu lauku.</p>}
      </ul>

      <form action={addAction} className="space-y-3 border-t border-border pt-4">
        <HiddenFields values={hiddenFields} />
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-field-label">Lauka nosaukums</Label>
            <Input id="new-field-label" name="label" required placeholder="Uzvārds" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-field-type">Tips</Label>
            <Select
              id="new-field-type"
              name="fieldType"
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as LeadFieldType)}
            >
              {FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {FIELD_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {newFieldType === "select" && (
          <div className="space-y-1.5">
            <Label htmlFor="new-field-options">Opcijas (atdalītas ar komatu)</Label>
            <Input id="new-field-options" name="options" placeholder="Opcija A, Opcija B" />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="isRequired" className="h-4 w-4" />
          Obligāts lauks
        </label>
        <Button type="submit" size="sm">
          Pievienot lauku
        </Button>
      </form>
    </div>
  );
}

function EditFieldForm({
  field,
  hiddenFields,
  action,
  onCancel,
}: {
  field: LeadFieldDefinition;
  hiddenFields: Record<string, string>;
  action: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const [fieldType, setFieldType] = useState<LeadFieldType>(field.field_type);

  return (
    <form action={action} className="space-y-3">
      <HiddenFields values={hiddenFields} />
      <input type="hidden" name="fieldId" value={field.id} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-label-${field.id}`}>Lauka nosaukums</Label>
          <Input id={`edit-label-${field.id}`} name="label" required defaultValue={field.label} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-type-${field.id}`}>Tips</Label>
          <Select
            id={`edit-type-${field.id}`}
            name="fieldType"
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value as LeadFieldType)}
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>
                {FIELD_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {fieldType === "select" && (
        <div className="space-y-1.5">
          <Label htmlFor={`edit-options-${field.id}`}>Opcijas (atdalītas ar komatu)</Label>
          <Input
            id={`edit-options-${field.id}`}
            name="options"
            defaultValue={field.options?.join(", ") ?? ""}
          />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isRequired" className="h-4 w-4" defaultChecked={field.is_required} />
        Obligāts lauks
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Saglabāt
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Atcelt
        </Button>
      </div>
    </form>
  );
}
