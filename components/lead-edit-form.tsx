"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeadFieldInputs } from "@/components/lead-field-inputs";
import { formatDate } from "@/lib/dates";
import type { Lead, LeadFieldDefinition } from "@/lib/types";

interface CustomFieldValue {
  id: string;
  label: string;
  value: string;
}

interface LeadEditFormProps {
  lead: Lead;
  fieldDefs: LeadFieldDefinition[];
  customFields: CustomFieldValue[];
  updateAction: (formData: FormData) => void;
}

export function LeadEditForm({ lead, fieldDefs, customFields, updateAction }: LeadEditFormProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className="space-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Vārds: </span>
          {lead.name || "—"}
        </p>
        <p>
          <span className="text-muted-foreground">E-pasts: </span>
          {lead.email || "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Telefons: </span>
          {lead.phone || "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Grupa: </span>
          {lead.group_name || "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Izvēlētie datumi: </span>
          {lead.preferred_dates?.length ? lead.preferred_dates.map((d) => formatDate(d)).join(", ") : "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Piezīmes: </span>
          {lead.notes || "—"}
        </p>
        <p>
          <span className="text-muted-foreground">Avots: </span>
          {lead.source}
        </p>
        <p>
          <span className="text-muted-foreground">Pievienots: </span>
          {new Date(lead.created_at).toLocaleString("lv-LV")}
        </p>
        {customFields.map((f) => (
          <p key={f.id}>
            <span className="text-muted-foreground">{f.label}: </span>
            {f.value || "—"}
          </p>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Rediģēt
        </Button>
      </div>
    );
  }

  const customFieldValues = Object.fromEntries(customFields.map((f) => [f.id, f.value]));

  return (
    <form action={updateAction} className="space-y-3">
      <input type="hidden" name="leadId" value={lead.id} />
      <div className="space-y-1.5">
        <Label htmlFor="edit-name">Vārds</Label>
        <Input id="edit-name" name="name" required defaultValue={lead.name ?? ""} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-email">E-pasts</Label>
          <Input id="edit-email" name="email" type="email" defaultValue={lead.email ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-phone">Telefons</Label>
          <Input id="edit-phone" name="phone" defaultValue={lead.phone ?? ""} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-group_name">Grupa</Label>
          <Input id="edit-group_name" name="group_name" defaultValue={lead.group_name ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-dates">Izvēlētie datumi</Label>
          <Input
            id="edit-dates"
            name="dates"
            placeholder="GGGG-MM-DD, GGGG-MM-DD"
            defaultValue={lead.preferred_dates?.join(", ") ?? ""}
          />
        </div>
      </div>
      <LeadFieldInputs fields={fieldDefs} values={customFieldValues} />
      <div className="space-y-1.5">
        <Label htmlFor="edit-notes">Piezīmes</Label>
        <Textarea id="edit-notes" name="notes" rows={2} defaultValue={lead.notes ?? ""} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm">
          Saglabāt
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
          Atcelt
        </Button>
      </div>
    </form>
  );
}
