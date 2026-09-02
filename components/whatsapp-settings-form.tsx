"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateClientWhatsAppAction, type UpdateWhatsAppState } from "@/app/(agency)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: UpdateWhatsAppState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saglabā..." : "Saglabāt"}
    </Button>
  );
}

export function WhatsAppSettingsForm({
  clientId,
  whatsappPhone,
}: {
  clientId: string;
  whatsappPhone: string | null;
}) {
  const [state, formAction] = useFormState(updateClientWhatsAppAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-1.5">
        <Label htmlFor="whatsapp_phone">WhatsApp numurs</Label>
        <Input
          id="whatsapp_phone"
          name="whatsapp_phone"
          placeholder="+371 20000000"
          defaultValue={whatsappPhone ?? ""}
        />
        <p className="text-xs text-muted-foreground">
          Uz šo numuru tiks nosūtīts WhatsApp paziņojums, kad šim klientam tiek pievienots jauns leads.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.status === "success" && <p className="text-sm text-emerald-600">{state.message}</p>}
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
