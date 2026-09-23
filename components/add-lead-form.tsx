"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LeadFieldInputs } from "@/components/lead-field-inputs";
import { getDefaultFieldDef } from "@/lib/lead-fields";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadFieldDefinition } from "@/lib/types";

interface AddLeadState {
  status: "idle" | "success" | "error";
  message: string;
}

const initialState: AddLeadState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Pievieno..." : "Pievienot leadu"}
    </Button>
  );
}

export function AddLeadForm({
  fieldDefs,
  hiddenFields = {},
  action,
}: {
  fieldDefs: LeadFieldDefinition[];
  hiddenFields?: Record<string, string>;
  action: (prevState: AddLeadState, formData: FormData) => Promise<AddLeadState>;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const customFieldDefs = fieldDefs.filter((f) => !f.is_default);
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

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      {nameEnabled && (
        <div className="space-y-1.5">
          <Label htmlFor="add-lead-name">{nameField?.label ?? "Vārds"}</Label>
          <Input
            id="add-lead-name"
            name="name"
            required={nameField?.is_required ?? true}
            placeholder="Anna Kalniņa"
          />
        </div>
      )}
      {(emailEnabled || phoneEnabled) && (
        <div className="grid grid-cols-2 gap-3">
          {emailEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="add-lead-email">{emailField?.label ?? "E-pasts"}</Label>
              <Input
                id="add-lead-email"
                name="email"
                type="email"
                required={emailField?.is_required}
                placeholder="anna@piemers.lv"
              />
            </div>
          )}
          {phoneEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="add-lead-phone">{phoneField?.label ?? "Telefons"}</Label>
              <Input
                id="add-lead-phone"
                name="phone"
                required={phoneField?.is_required}
                placeholder="+371 20000000"
              />
            </div>
          )}
        </div>
      )}
      {(groupEnabled || datesEnabled) && (
        <div className="grid grid-cols-2 gap-3">
          {groupEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="add-lead-group_name">{groupField?.label ?? "Grupa"}</Label>
              <Input
                id="add-lead-group_name"
                name="group_name"
                required={groupField?.is_required}
                placeholder="Neobligāti"
              />
            </div>
          )}
          {datesEnabled && (
            <div className="space-y-1.5">
              <Label htmlFor="add-lead-dates">{datesField?.label ?? "Izvēlētie datumi"}</Label>
              <Input
                id="add-lead-dates"
                name="dates"
                required={datesField?.is_required}
                placeholder="GGGG-MM-DD, GGGG-MM-DD"
              />
            </div>
          )}
        </div>
      )}
      <LeadFieldInputs fields={customFieldDefs} />
      <div className="space-y-1.5">
        <Label htmlFor="add-lead-notes">Piezīmes</Label>
        <Textarea id="add-lead-notes" name="notes" placeholder="Neobligāti" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="add-lead-status">Statuss</Label>
        <Select id="add-lead-status" name="status" defaultValue="call_back">
          {LEAD_STATUSES.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.status === "success" && <p className="text-sm text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
