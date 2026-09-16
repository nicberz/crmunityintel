"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { TaskColorDot, TaskGroupBadge } from "@/components/ui/badge";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { formatDate } from "@/lib/dates";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskGroup,
} from "@/lib/types";
import type { TaskWithNames } from "@/components/tasks-table";

export function TaskDetailsDialog({
  task,
  open,
  onClose,
  teamMembers,
  groups,
  hiddenFields = {},
  updateAction,
}: {
  task: TaskWithNames | null;
  open: boolean;
  onClose: () => void;
  teamMembers: { id: string; name: string }[];
  groups: TaskGroup[];
  hiddenFields?: Record<string, string>;
  updateAction: (formData: FormData) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!task) return null;

  const group = task.group_id ? groups.find((g) => g.id === task.group_id) ?? null : null;

  function handleClose() {
    setIsEditing(false);
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} title={isEditing ? "Rediģēt uzdevumu" : task.title}>
      {isEditing ? (
        <form
          action={updateAction}
          onSubmit={handleClose}
          className="space-y-3"
        >
          <input type="hidden" name="taskId" value={task.id} />
          {Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Nosaukums</Label>
            <Input id="edit-title" name="title" required defaultValue={task.title} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Apraksts</Label>
            <Textarea id="edit-description" name="description" rows={3} defaultValue={task.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-assignedTo">Atbildīgais</Label>
              <Select id="edit-assignedTo" name="assignedTo" defaultValue={task.assigned_to ?? ""}>
                <option value="">Nav piešķirts</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-priority">Prioritāte</Label>
              <Select id="edit-priority" name="priority" defaultValue={task.priority}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-groupId">Grupa</Label>
              <Select id="edit-groupId" name="groupId" defaultValue={task.group_id ?? ""}>
                <option value="">Nav grupas</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-dueDate">Termiņš</Label>
              <Input id="edit-dueDate" name="dueDate" type="date" defaultValue={task.due_date ?? ""} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Krāsa</Label>
            <ColorSwatchPickerField initial={task.color} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit">Saglabāt</Button>
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Atcelt
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TaskColorDot color={task.color} />
            <span className="text-sm uppercase text-muted-foreground">{task.color}</span>
            {group && <TaskGroupBadge name={group.name} color={group.color} />}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Apraksts</p>
            <p className="whitespace-pre-wrap text-sm">{task.description || "Nav apraksta."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Statuss</p>
              <p>{TASK_STATUS_LABELS[task.status]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Prioritāte</p>
              <p>{TASK_PRIORITY_LABELS[task.priority]}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Atbildīgais</p>
              <p>{task.assigneeName || "Nav piešķirts"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Termiņš</p>
              <p>{task.due_date ? formatDate(task.due_date) : "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Izveidots</p>
              <p>{formatDate(task.created_at)}</p>
            </div>
            {task.archived_at && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Arhivēts</p>
                <p>{formatDate(task.archived_at)}</p>
              </div>
            )}
          </div>
          <Button type="button" onClick={() => setIsEditing(true)}>
            Rediģēt
          </Button>
        </div>
      )}
    </Dialog>
  );
}

function ColorSwatchPickerField({ initial }: { initial: string }) {
  const [color, setColor] = useState(initial);
  return <ColorSwatchPicker name="color" value={color} onChange={setColor} />;
}
