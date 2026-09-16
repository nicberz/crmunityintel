"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Bug } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { submitBugReportAction, type BugReportFormState } from "@/lib/actions/bug-reports";
import { BUG_REPORT_SEVERITIES, BUG_REPORT_SEVERITY_LABELS } from "@/lib/types";

const initialState: BugReportFormState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Sūta..." : "Nosūtīt ziņojumu"}
    </Button>
  );
}

export function ReportBugButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [state, formAction] = useFormState(submitBugReportAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      const timeout = setTimeout(() => setOpen(false), 1200);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-1.5 rounded-full bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-md shadow-black/10 ring-1 ring-border hover:text-foreground"
      >
        <Bug className="h-3.5 w-3.5" />
        Ziņot par kļūdu
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Ziņot par kļūdu">
        <form ref={formRef} action={formAction} className="space-y-3">
          <input type="hidden" name="pagePath" value={pathname ?? ""} />
          <div className="space-y-1.5">
            <Label htmlFor="bug-title">Nosaukums</Label>
            <Input id="bug-title" name="title" required placeholder="Īss apraksts" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-description">Apraksts</Label>
            <Textarea
              id="bug-description"
              name="description"
              required
              rows={4}
              placeholder="Ko darīji, ko sagaidīji, kas notika..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bug-severity">Nopietnība</Label>
            <Select id="bug-severity" name="severity" defaultValue="medium">
              {BUG_REPORT_SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {BUG_REPORT_SEVERITY_LABELS[s]}
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
      </Dialog>
    </>
  );
}
