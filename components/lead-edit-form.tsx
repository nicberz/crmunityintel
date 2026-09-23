"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LeadFieldInputs } from "@/components/lead-field-inputs";
import { getDefaultFieldDef } from "@/lib/lead-fields";
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

  const customFieldDefs = fieldDefs.filter((f) => !f.is_default);
  const customFieldValuesOnly = customFields.filter((f) => customFieldDefs.some((d) => d.id === f.id));

  const nameField = getDefaultFieldDef(fieldDefs, "name");
  const emailField = getDefaultFieldDef(fieldDefs, "email");
  const phoneField = getDefaultFieldDef(fieldDefs, "phone");
  const groupField = getDefaultFieldDef(fieldDefs, "group_name");
  const datesField = getDefaultFieldDef(fieldDefs, "preferred_dates");
  const nameEnabled = nameField?.is_enabled ?? true;
  const emailEnabled = emailField?.is_enabled ?? true;
  const phoneEnabled = phoneField?.is_enabled ?? true;
  const groupEnabled = groupField?.is_enabled ?? true;
  const datesEnabled = datesField?.is_enabled ?? true;

  if (!isEditing) {
    return (
      <div className="space-y-2 text-sm">
        {nameEnabled && (
          <p>
            <span className="text-muted-foreground">{nameField?.label ?? "Vārds"}: </span>
            {lead.name || "—"}
          </p>
        )}
        {emailEnabled && (
          <p>
            <span className="text-muted-foreground">{emailField?.label ?? "E-pasts"}: </span>
            {lead.email || "—"}
          </p>
        )}
        {phoneEnabled && (
          <p>
            <span className="text-muted-foreground">{phoneField?.label ?? "Telefons"}: </span>
            {lead.phone || "—"}
          </p>
        )}
        {groupEnabled && (
          <p>
            <span className="text-muted-foreground">{groupField?.label ?? "Grupa"}: </span>
            {lead.group_name || "—"}
          </p>
        )}
        {datesEnabled && (
          <p>
            <span className="text-muted-foreground">{datesField?.label ?? "Izvēlētie datumi"}: </span>
            {lead.preferred_dates?.length ? lead.preferred_dates.map((d) => formatDate(d)).join(", ") : "—"}
          </p>
        )}
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
        {customFieldValuesOnly.map((f) => (
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

  const customFieldValues = Object.fromEntries(customFieldValuesOnly.map((f) => [f.id, f.value]));

  return (
    <form action={updateAction} className="space-y-3">
      <input type="hidden" name="leadId" value={lead.id} />
      {nameEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="edit-name">{nameField?.label ?? "Vārds"}</Label>
          <Input
            id="edit-name"
            name="name"
            required={nameField?.is_required ?? true}
            defaultValue={lead.name ?? ""}
          />
        </div>
      )}
      {(emailEnabled || phoneEnabled) && (
        <div className="grid grid-cols-2 gap-3">
          {emailEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">{emailField?.label ?? "E-pasts"}</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                required={emailField?.is_required}
                defaultValue={lead.email ?? ""}
              />
            </div>
          )}
          {phoneEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">{phoneField?.label ?? "Telefons"}</Label>
              <Input
                id="edit-phone"
                name="phone"
                required={phoneField?.is_required}
                defaultValue={lead.phone ?? ""}
              />
            </div>
          )}
        </div>
      )}
      {(groupEnabled || datesEnabled) && (
        <div className="grid grid-cols-2 gap-3">
          {groupEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-group_name">{groupField?.label ?? "Grupa"}</Label>
              <Input
                id="edit-group_name"
                name="group_name"
                required={groupField?.is_required}
                defaultValue={lead.group_name ?? ""}
              />
            </div>
          )}
          {datesEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-dates">{datesField?.label ?? "Izvēlētie datumi"}</Label>
              <Input
                id="edit-dates"
                name="dates"
                required={datesField?.is_required}
                placeholder="GGGG-MM-DD, GGGG-MM-DD"
                defaultValue={lead.preferred_dates?.join(", ") ?? ""}
              />
            </div>
          )}
        </div>
      )}
      <LeadFieldInputs fields={customFieldDefs} values={customFieldValues} />
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
