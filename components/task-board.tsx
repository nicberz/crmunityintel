"use client";

import { useEffect, useState } from "react";
import { endOfWeek, format, startOfWeek } from "date-fns";
import { TaskTabs, type TaskView } from "@/components/task-tabs";
import { TaskListItem } from "@/components/task-list-item";
import { TaskStatTiles } from "@/components/task-stat-tiles";
import { TaskDetailPanel } from "@/components/task-detail-panel";
import type { TaskWithNames } from "@/components/tasks-table";
import type { TaskGroup, TaskStatus } from "@/lib/types";

type TaskWithDisplayStatus = TaskWithNames & { displayStatus: TaskStatus };

export function TaskBoard({
  tasks,
  groups,
  teamMembers,
  hiddenFields = {},
  updateAction,
  deleteAction,
}: {
  tasks: TaskWithNames[];
  groups: TaskGroup[];
  teamMembers: { id: string; name: string }[];
  hiddenFields?: Record<string, string>;
  updateAction: (formData: FormData) => void;
  deleteAction: (formData: FormData) => void;
}) {
  const [view, setView] = useState<TaskView>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, TaskStatus>>({});

  useEffect(() => {
    setOptimisticStatus({});
  }, [tasks]);

  useEffect(() => {
    if (selectedId && !tasks.some((t) => t.id === selectedId)) setSelectedId(null);
  }, [tasks, selectedId]);

  function toggleDone(task: TaskWithNames, done: boolean) {
    const nextStatus: TaskStatus = done ? "done" : "todo";
    setOptimisticStatus((prev) => ({ ...prev, [task.id]: nextStatus }));
    const formData = new FormData();
    formData.set("taskId", task.id);
    formData.set("status", nextStatus);
    for (const [k, v] of Object.entries(hiddenFields)) formData.set(k, v);
    updateAction(formData);
  }

  const today = new Date().toISOString().slice(0, 10);
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const withStatus: TaskWithDisplayStatus[] = tasks.map((t) => ({
    ...t,
    displayStatus: optimisticStatus[t.id] ?? t.status,
  }));

  const doneList = withStatus.filter((t) => t.displayStatus === "done");
  const openList = withStatus.filter((t) => t.displayStatus !== "done");
  const todayList = openList.filter((t) => t.due_date === today);
  const weekList = openList.filter((t) => t.due_date && t.due_date >= weekStart && t.due_date <= weekEnd);

  const buckets: Record<TaskView, TaskWithDisplayStatus[]> = {
    today: todayList,
    week: weekList,
    all: openList,
    done: doneList,
  };
  const counts: Record<TaskView, number> = {
    today: todayList.length,
    week: weekList.length,
    all: openList.length,
    done: doneList.length,
  };

  const activeList = buckets[view];
  const selectedTask = withStatus.find((t) => t.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-3">
        <TaskTabs active={view} counts={counts} onChange={setView} />
        <div className="space-y-2">
          {activeList.map((task) => (
            <TaskListItem
              key={task.id}
              task={task}
              group={task.group_id ? groups.find((g) => g.id === task.group_id) ?? null : null}
              selected={task.id === selectedId}
              displayStatus={task.displayStatus}
              onSelect={() => setSelectedId(task.id)}
              onToggleDone={(done) => toggleDone(task, done)}
            />
          ))}
          {activeList.length === 0 && (
            <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Šeit nekā nav.
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <TaskStatTiles open={openList.length} dueToday={todayList.length} done={doneList.length} />
        <TaskDetailPanel
          task={selectedTask}
          teamMembers={teamMembers}
          groups={groups}
          hiddenFields={hiddenFields}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />
      </div>
    </div>
  );
}
