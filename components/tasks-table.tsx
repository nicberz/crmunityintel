"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type Task,
} from "@/lib/types";

export interface TaskWithNames extends Task {
  assigneeName?: string | null;
}

export function TasksTable({
  tasks,
  teamMembers,
  hiddenFields = {},
  updateAction,
  deleteAction,
}: {
  tasks: TaskWithNames[];
  teamMembers: { id: string; name: string }[];
  hiddenFields?: Record<string, string>;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nosaukums</TableHead>
          <TableHead>Atbildīgais</TableHead>
          <TableHead>Prioritāte</TableHead>
          <TableHead>Termiņš</TableHead>
          <TableHead>Statuss</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const overdue = Boolean(task.due_date) && task.due_date! < today && task.status !== "done";
          return (
            <TableRow key={task.id}>
              <TableCell className="max-w-xs">
                <p className={cn("font-medium", task.status === "done" && "text-muted-foreground line-through")}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
                )}
              </TableCell>
              <TableCell>
                <form action={updateAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  {Object.entries(hiddenFields).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                  <Select
                    name="assignedTo"
                    defaultValue={task.assigned_to ?? ""}
                    className="h-8 w-40 text-xs"
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  >
                    <option value="">Nav piešķirts</option>
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </form>
              </TableCell>
              <TableCell>
                <form action={updateAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  {Object.entries(hiddenFields).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                  <Select
                    name="priority"
                    defaultValue={task.priority}
                    className="h-8 w-28 text-xs"
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  >
                    {TASK_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {TASK_PRIORITY_LABELS[p]}
                      </option>
                    ))}
                  </Select>
                </form>
              </TableCell>
              <TableCell className={cn(overdue && "font-medium text-destructive")}>
                {task.due_date ? formatDate(task.due_date) : "—"}
              </TableCell>
              <TableCell>
                <form action={updateAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  {Object.entries(hiddenFields).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                  <Select
                    name="status"
                    defaultValue={task.status}
                    className="h-8 w-32 text-xs"
                    onChange={(e) => e.currentTarget.form?.requestSubmit()}
                  >
                    {TASK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {TASK_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                </form>
              </TableCell>
              <TableCell>
                <form action={deleteAction}>
                  <input type="hidden" name="taskId" value={task.id} />
                  {Object.entries(hiddenFields).map(([k, v]) => (
                    <input key={k} type="hidden" name={k} value={v} />
                  ))}
                  <Button type="submit" variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          );
        })}
        {tasks.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              Vēl nav neviena uzdevuma.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
