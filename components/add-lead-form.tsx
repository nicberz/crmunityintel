"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { LeadFieldInputs } from "@/components/lead-field-inputs";
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

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="add-lead-name">Vārds</Label>
        <Input id="add-lead-name" name="name" required placeholder="Anna Kalniņa" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-lead-email">E-pasts</Label>
          <Input id="add-lead-email" name="email" type="email" placeholder="anna@piemers.lv" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-lead-phone">Telefons</Label>
          <Input id="add-lead-phone" name="phone" placeholder="+371 20000000" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="add-lead-group_name">Grupa</Label>
          <Input id="add-lead-group_name" name="group_name" placeholder="Neobligāti" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-lead-dates">Izvēlētie datumi</Label>
          <Input id="add-lead-dates" name="dates" placeholder="GGGG-MM-DD, GGGG-MM-DD" />
        </div>
      </div>
      <LeadFieldInputs fields={fieldDefs} />
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
        {state.status === "success" && <p className="text-sm text-emerald-600">{state.message}</p>}
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
