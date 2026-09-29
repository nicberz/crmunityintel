"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { InviteState } from "@/app/(agency)/actions";
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

export function InviteClientForm({
  action,
  clientId,
  allowAdmin = false,
}: {
  action: (prevState: InviteState, formData: FormData) => Promise<InviteState>;
  clientId?: string;
  allowAdmin?: boolean;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      {clientId && <input type="hidden" name="clientId" value={clientId} />}
      <div className="space-y-1.5">
        <Label htmlFor="email">E-pasts</Label>
        <Input id="email" name="email" type="email" required placeholder="klients@piemers.lv" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Vārds (nav obligāts)</Label>
        <Input id="fullName" name="fullName" placeholder="Jānis Bērziņš" />
      </div>
      {allowAdmin && (
        <label htmlFor="isClientAdmin" className="flex items-center gap-2 text-sm">
          <input id="isClientAdmin" type="checkbox" name="isClientAdmin" className="h-4 w-4" />
          Klienta administrators (API, leadu lauki, datu dzēšana, komandas ielūgšana)
        </label>
      )}
      <SubmitButton />
      {state.status === "success" && <p className="text-sm text-emerald-400">{state.message}</p>}
      {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
    </form>
  );
}
