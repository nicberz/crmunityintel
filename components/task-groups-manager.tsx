"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskGroupBadge } from "@/components/ui/badge";
import { ColorSwatchPicker } from "@/components/color-swatch-picker";
import { DEFAULT_TASK_COLOR, type TaskGroup } from "@/lib/types";

export function TaskGroupsManager({
  groups,
  hiddenFields = {},
  createAction,
  deleteAction,
}: {
  groups: TaskGroup[];
  hiddenFields?: Record<string, string>;
  createAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [color, setColor] = useState(DEFAULT_TASK_COLOR);

  return (
    <div className="space-y-4">
      <form action={createAction} className="flex flex-wrap items-end gap-3">
        {Object.entries(hiddenFields).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Jaunas grupas nosaukums</label>
          <Input name="name" required placeholder="Piem., Mārketings" className="h-9 w-56" />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Krāsa</label>
          <ColorSwatchPicker name="color" value={color} onChange={setColor} />
        </div>
        <Button type="submit" size="sm">
          Pievienot grupu
        </Button>
      </form>

      {groups.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <li key={g.id} className="flex items-center gap-1.5 rounded-full border border-border py-0.5 pl-2 pr-1">
              <TaskGroupBadge name={g.name} color={g.color} />
              <form action={deleteAction}>
                <input type="hidden" name="groupId" value={g.id} />
                {Object.entries(hiddenFields).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={v} />
                ))}
                <Button type="submit" variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Vēl nav neviena grupa.</p>
      )}
    </div>
  );
}
