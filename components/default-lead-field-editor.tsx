"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LeadFieldDefinition } from "@/lib/types";

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
}: {
  fields: LeadFieldDefinition[];
  hiddenFields?: Record<string, string>;
  updateAction: (formData: FormData) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ul className="space-y-2">
      {fields.map((field) =>
        editingId === field.id ? (
          <li key={field.id} className="rounded-md border border-border p-3">
            <form action={updateAction} className="space-y-3">
              <HiddenFields values={hiddenFields} />
              <input type="hidden" name="fieldId" value={field.id} />
              <div className="space-y-1.5">
                <Label htmlFor={`default-label-${field.id}`}>Lauka nosaukums</Label>
                <Input id={`default-label-${field.id}`} name="label" required defaultValue={field.label} />
              </div>
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
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                  Atcelt
                </Button>
              </div>
            </form>
          </li>
        ) : (
          <li
            key={field.id}
            className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
          >
            <div>
              <span className="font-medium">{field.label}</span>{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">{field.key}</code>{" "}
              <span className="text-muted-foreground">
                ({field.is_required ? "obligāts" : "neobligāts"}
                {field.is_enabled ? "" : ", deaktivizēts"})
              </span>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(field.id)}>
              Rediģēt
            </Button>
          </li>
        )
      )}
    </ul>
  );
}
