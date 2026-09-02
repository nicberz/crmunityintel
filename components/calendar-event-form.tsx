"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CalendarEventState {
  status: "idle" | "success" | "error";
  message: string;
}

const initialState: CalendarEventState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Pievieno..." : "Pievienot ierakstu"}
    </Button>
  );
}

export function CalendarEventForm({
  action,
  hiddenFields = {},
  defaultStartAt,
}: {
  action: (prevState: CalendarEventState, formData: FormData) => Promise<CalendarEventState>;
  hiddenFields?: Record<string, string>;
  defaultStartAt?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setReminderEnabled(true);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="space-y-1.5">
        <Label htmlFor="event-title">Nosaukums</Label>
        <Input id="event-title" name="title" required placeholder="Piezvanīt Annai" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-note">Piezīme</Label>
        <Textarea id="event-note" name="note" placeholder="Neobligāti" rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="event-startAt">Datums un laiks</Label>
        <Input
          id="event-startAt"
          name="startAt"
          type="datetime-local"
          required
          defaultValue={defaultStartAt}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="reminderEnabled"
            defaultChecked
            onChange={(e) => setReminderEnabled(e.target.checked)}
          />
          Atgādināt
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="event-reminderMinutesBefore" className="text-xs text-muted-foreground">
            Minūtes iepriekš
          </Label>
          <Input
            id="event-reminderMinutesBefore"
            name="reminderMinutesBefore"
            type="number"
            min={0}
            defaultValue={60}
            disabled={!reminderEnabled}
            className="w-24"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.status === "success" && <p className="text-sm text-emerald-600">{state.message}</p>}
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
