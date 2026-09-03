"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS } from "@/lib/types";

interface TaskFormState {
  status: "idle" | "success" | "error";
  message: string;
}

const initialState: TaskFormState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Pievieno..." : "Pievienot uzdevumu"}
    </Button>
  );
}

export function AddTaskForm({
  teamMembers,
  hiddenFields = {},
  action,
}: {
  teamMembers: { id: string; name: string }[];
  hiddenFields?: Record<string, string>;
  action: (prevState: TaskFormState, formData: FormData) => Promise<TaskFormState>;
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
        <Label htmlFor="task-title">Nosaukums</Label>
        <Input id="task-title" name="title" required placeholder="Sagatavot piedāvājumu" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="task-description">Apraksts</Label>
        <Textarea id="task-description" name="description" placeholder="Neobligāti" rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-assignedTo">Atbildīgais</Label>
          <Select id="task-assignedTo" name="assignedTo" defaultValue="">
            <option value="">Nav piešķirts</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-priority">Prioritāte</Label>
          <Select id="task-priority" name="priority" defaultValue="medium">
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-dueDate">Termiņš</Label>
          <Input id="task-dueDate" name="dueDate" type="date" />
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
