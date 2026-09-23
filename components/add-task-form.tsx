"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { TASK_PRIORITIES, TASK_PRIORITY_LABELS, DEFAULT_TASK_COLOR, type TaskGroup } from "@/lib/types";

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
  groups = [],
  hiddenFields = {},
  action,
}: {
  teamMembers: { id: string; name: string }[];
  groups?: TaskGroup[];
  hiddenFields?: Record<string, string>;
  action: (prevState: TaskFormState, formData: FormData) => Promise<TaskFormState>;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [color, setColor] = useState(DEFAULT_TASK_COLOR);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      setColor(DEFAULT_TASK_COLOR);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="task-assignedTo">Atbildīgais</Label>
          <Select id="task-assignedTo" name="assignedTo" defaultValue="" className="w-full">
            <option value="">Nav piešķirts</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="task-groupId">Grupa</Label>
          <Select id="task-groupId" name="groupId" defaultValue="" className="w-full">
            <option value="">Nav grupas</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="task-priority">Prioritāte</Label>
          <Select id="task-priority" name="priority" defaultValue="medium" className="w-full">
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label htmlFor="task-dueDate">Termiņš</Label>
          <Input id="task-dueDate" name="dueDate" type="date" className="w-full" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="task-tags">Tagi</Label>
        <Input id="task-tags" name="tags" placeholder="piem., mārketings, steidzami" />
      </div>
      <div className="space-y-1.5">
        <Label>Krāsa</Label>
        <ColorSwatchPicker name="color" value={color} onChange={setColor} />
      </div>
      <div className="flex items-center gap-3">
        <SubmitButton />
        {state.status === "success" && <p className="text-sm text-emerald-400">{state.message}</p>}
        {state.status === "error" && <p className="text-sm text-destructive">{state.message}</p>}
      </div>
    </form>
  );
}
