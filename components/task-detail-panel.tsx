"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge, TaskColorDot, TaskGroupBadge } from "@/components/ui/badge";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { formatDate } from "@/lib/dates";
import {
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  type TaskGroup,
} from "@/lib/types";
import type { TaskWithNames } from "@/components/tasks-table";

export function TaskDetailPanel({
  task,
  teamMembers,
  groups,
  hiddenFields = {},
  updateAction,
  deleteAction,
}: {
  task: TaskWithNames | null;
  teamMembers: { id: string; name: string }[];
  groups: TaskGroup[];
  hiddenFields?: Record<string, string>;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setIsEditing(false);
  }, [task?.id]);

  if (!task) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Izvēlies uzdevumu, lai redzētu detaļas.
      </div>
    );
  }

  const group = task.group_id ? groups.find((g) => g.id === task.group_id) ?? null : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-semibold">{isEditing ? "Rediģēt uzdevumu" : task.title}</h2>
        {!isEditing && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Rediģēt
            </Button>
            <form action={deleteAction}>
              <input type="hidden" name="taskId" value={task.id} />
              {Object.entries(hiddenFields).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              <Button type="submit" size="sm" variant="ghost">
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {isEditing ? (
        <form action={updateAction} onSubmit={() => setIsEditing(false)} className="space-y-3">
          <input type="hidden" name="taskId" value={task.id} />
          {Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <div className="space-y-1.5">
            <Label htmlFor="panel-title">Nosaukums</Label>
            <Input id="panel-title" name="title" required defaultValue={task.title} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panel-description">Apraksts</Label>
            <Textarea id="panel-description" name="description" rows={3} defaultValue={task.description ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="panel-priority">Prioritāte</Label>
              <Select id="panel-priority" name="priority" defaultValue={task.priority} className="w-full">
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="panel-dueDate">Termiņš</Label>
              <Input id="panel-dueDate" name="dueDate" type="date" defaultValue={task.due_date ?? ""} className="w-full" />
            </div>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="panel-assignedTo">Atbildīgais</Label>
            <Select id="panel-assignedTo" name="assignedTo" defaultValue={task.assigned_to ?? ""} className="w-full">
              <option value="">Nav piešķirts</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="panel-groupId">Grupa</Label>
            <Select id="panel-groupId" name="groupId" defaultValue={task.group_id ?? ""} className="w-full">
              <option value="">Nav grupas</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panel-tags">Tagi</Label>
            <Input
              id="panel-tags"
              name="tags"
              placeholder="piem., mārketings, steidzami"
              defaultValue={task.tags.join(", ")}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Krāsa</Label>
            <PanelColorPicker initial={task.color} />
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
          <div className="flex flex-wrap items-center gap-2">
            <TaskColorDot color={task.color} />
            <span className="text-sm uppercase text-muted-foreground">{task.color}</span>
            {group && <TaskGroupBadge name={group.name} color={group.color} />}
            {task.tags.map((tag) => (
              <Badge key={tag} className="bg-muted text-muted-foreground">
                {tag}
              </Badge>
            ))}
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
          </div>
        </div>
      )}
    </div>
  );
}

function PanelColorPicker({ initial }: { initial: string }) {
  const [color, setColor] = useState(initial);
  return <ColorSwatchPicker name="color" value={color} onChange={setColor} />;
}
