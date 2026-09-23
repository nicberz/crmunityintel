"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AddTaskForm } from "@/components/add-task-form";
import type { TaskGroup } from "@/lib/types";

interface TaskFormState {
  status: "idle" | "success" | "error";
  message: string;
}

export function AddTaskDialogButton({
  teamMembers,
  groups,
  hiddenFields,
  action,
}: {
  teamMembers: { id: string; name: string }[];
  groups: TaskGroup[];
  hiddenFields?: Record<string, string>;
  action: (prevState: TaskFormState, formData: FormData) => Promise<TaskFormState>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Pievienot uzdevumu
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Jauns uzdevums">
        <AddTaskForm teamMembers={teamMembers} groups={groups} hiddenFields={hiddenFields} action={action} />
      </Dialog>
    </>
  );
}
