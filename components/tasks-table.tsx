"use client";

import { useEffect, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge, TaskColorDot, TaskGroupBadge } from "@/components/ui/badge";
import { TaskDetailsDialog } from "@/components/task-details-dialog";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type Task,
  type TaskGroup,
  type TaskStatus,
} from "@/lib/types";

export interface TaskWithNames extends Task {
  assigneeName?: string | null;
}

export function TasksTable({
  tasks,
  teamMembers,
  groups = [],
  hiddenFields = {},
  updateAction,
  deleteAction,
}: {
  tasks: TaskWithNames[];
  teamMembers: { id: string; name: string }[];
  groups?: TaskGroup[];
  hiddenFields?: Record<string, string>;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedTask, setSelectedTask] = useState<TaskWithNames | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, TaskStatus>>({});
  const [, startTransition] = useTransition();

  // Once fresh data comes back from the server (a new `tasks` array), the real
  // status has caught up, so any optimistic override is no longer needed.
  useEffect(() => {
    setOptimisticStatus({});
  }, [tasks]);

  function toggleDone(task: TaskWithNames, done: boolean) {
    const nextStatus: TaskStatus = done ? "done" : "todo";
    setOptimisticStatus((prev) => ({ ...prev, [task.id]: nextStatus }));
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("status", nextStatus);
    for (const [k, v] of Object.entries(hiddenFields)) formData.set(k, v);
    startTransition(() => {
      updateAction(formData);
    });
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead>Nosaukums</TableHead>
          <TableHead>Grupa</TableHead>
          <TableHead>Atbildīgais</TableHead>
          <TableHead>Prioritāte</TableHead>
          <TableHead>Termiņš</TableHead>
          <TableHead>Statuss</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const displayStatus = optimisticStatus[task.id] ?? task.status;
          const overdue = Boolean(task.due_date) && task.due_date! < today && displayStatus !== "done";
          const group = task.group_id ? groups.find((g) => g.id === task.group_id) ?? null : null;
          return (
            <TableRow key={task.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={displayStatus === "done"}
                  onChange={(e) => toggleDone(task, e.target.checked)}
                  aria-label="Pabeigts"
                  className="h-4 w-4"
                />
              </TableCell>
              <TableCell className="max-w-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTask(task)}
                  className="flex items-start gap-1.5 text-left"
                >
                  <TaskColorDot color={task.color} className="mt-1.5" />
                  <span>
                    <p
                      className={cn(
                        "font-medium hover:underline",
                        displayStatus === "done" && "text-muted-foreground line-through"
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.description}</p>
                    )}
                    {task.tags.length > 0 && (
                      <span className="mt-1 flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                          <Badge key={tag} className="bg-muted text-[10px] text-muted-foreground">
                            {tag}
                          </Badge>
                        ))}
                      </span>
                    )}
                  </span>
                </button>
              </TableCell>
              <TableCell>
                {group ? <TaskGroupBadge name={group.name} color={group.color} /> : "—"}
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
                    className="h-8 w-auto min-w-[9rem] max-w-full text-xs"
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
                    className="h-8 w-auto min-w-[7rem] max-w-full text-xs"
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
                    key={displayStatus}
                    name="status"
                    defaultValue={displayStatus}
                    className="h-8 w-auto min-w-[8rem] max-w-full text-xs"
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
            <TableCell colSpan={8} className="text-center text-muted-foreground">
              Vēl nav neviena uzdevuma.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
    <TaskDetailsDialog
      task={selectedTask}
      open={selectedTask !== null}
      onClose={() => setSelectedTask(null)}
      teamMembers={teamMembers}
      groups={groups}
      hiddenFields={hiddenFields}
      updateAction={updateAction}
    />
    </>
  );
}
