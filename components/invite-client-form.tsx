"use client";

import { useFormState, useFormStatus } from "react-dom";
import { inviteClientUserAction, type InviteState } from "@/app/(agency)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: InviteState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sūta..." : "Nosūtīt ielūgumu"}
    </Button>
  );
}

export function InviteClientForm({ clientId }: { clientId: string }) {
  const [state, formAction] = useFormState(inviteClientUserAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="space-y-1.5">
        <Label htmlFor="email">E-pasts</Label>
        <Input id="email" name="email" type="email" required placeholder="klients@piemers.lv" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Vārds (nav obligāts)</Label>
        <Input id="fullName" name="fullName" placeholder="Jānis Bērziņš" />
      </div>
      <SubmitButton />
      {state.status === "success" && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
