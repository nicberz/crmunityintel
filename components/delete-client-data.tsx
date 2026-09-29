"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/action-result";

type Scope = "leads" | "tasks" | "calendar" | "all";

const OPTIONS: { value: Scope; label: string; note?: string }[] = [
  { value: "leads", label: "Leadi", note: "Kopā ar komentāriem, statusu vēsturi, lauku vērtībām un saistītajiem kalendāra ierakstiem." },
  { value: "tasks", label: "Uzdevumi", note: "Arī pabeigtie un arhivētie." },
  { value: "calendar", label: "Kalendāra ieraksti" },
  { value: "all", label: "Visi dati", note: "Leadi, uzdevumi un kalendāra ieraksti. Iestatījumi (leadu lauki, uzdevumu grupas) paliek." },
];

export function DeleteClientData({
  counts,
  action,
}: {
  counts: { leads: number; tasks: number; calendar: number };
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const [scope, setScope] = useState<Scope>("leads");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const confirmed = confirm.trim().toUpperCase() === "DZĒST";
  const countFor = (s: Scope) => (s === "all" ? counts.leads + counts.tasks + counts.calendar : counts[s]);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setMessage(null);
    const result = await action(formData);
    setPending(false);
    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "Dati dzēsti." });
      setConfirm("");
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <fieldset className="space-y-2.5">
        <legend className="mb-2 text-sm font-medium">Ko dzēst?</legend>
        {OPTIONS.map((option) => (
          <label key={option.value} htmlFor={`delete-scope-${option.value}`} className="flex items-start gap-2.5 text-sm">
            <input
              id={`delete-scope-${option.value}`}
              type="radio"
              name="scope"
              value={option.value}
              checked={scope === option.value}
              onChange={() => setScope(option.value)}
              className="mt-0.5 h-4 w-4 accent-destructive"
            />
            <span>
              <span className="font-medium">{option.label}</span>{" "}
              <span className="text-muted-foreground tabular-nums">({countFor(option.value)})</span>
              {option.note && <span className="block text-xs text-muted-foreground">{option.note}</span>}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="delete-confirm">
          Lai apstiprinātu, ieraksti <strong>DZĒST</strong>
        </Label>
        <Input
          id="delete-confirm"
          name="confirm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          className="max-w-xs"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="destructive" disabled={!confirmed || pending}>
          {pending ? "Dzēš..." : "Dzēst neatgriezeniski"}
        </Button>
        {message && (
          <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-emerald-400"}>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
