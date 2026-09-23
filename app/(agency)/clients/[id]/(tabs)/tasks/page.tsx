import { ListTodo } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  createTaskGroupAction,
  deleteTaskGroupAction,
} from "@/app/(agency)/actions";
import { AddTaskForm } from "@/components/add-task-form";
import { TasksTable, type TaskWithNames } from "@/components/tasks-table";
import { TasksFilterBar, type TaskSortField } from "@/components/tasks-filter-bar";
import { TaskGroupsManager } from "@/components/task-groups-manager";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { taskMatchesQuery } from "@/lib/utils";
import type { Task, TaskGroup } from "@/lib/types";

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function ClientTasksTabPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();

  const DEFAULT_SORT_DIR: Record<TaskSortField, "asc" | "desc"> = {
    due_date: "asc",
    priority: "desc",
    created_at: "desc",
    title: "asc",
  };
  const sortField = (param(searchParams, "sort") as TaskSortField | undefined) ?? "due_date";
  const explicitDir = param(searchParams, "dir");
  const sortDir = explicitDir === "asc" || explicitDir === "desc" ? explicitDir : DEFAULT_SORT_DIR[sortField];

  const filters = {
    q: param(searchParams, "q"),
    status: param(searchParams, "status"),
    priority: param(searchParams, "priority"),
    assignedTo: param(searchParams, "assignedTo"),
    groupId: param(searchParams, "groupId"),
    archived: param(searchParams, "archived"),
    sort: sortField,
    dir: sortDir,
  };

  let tasksQuery = supabase.from("tasks").select("*").eq("client_id", params.id);
  if (filters.archived === "1") {
    tasksQuery = tasksQuery.not("archived_at", "is", null);
  } else {
    tasksQuery = tasksQuery.is("archived_at", null);
  }
  if (filters.status) tasksQuery = tasksQuery.eq("status", filters.status);
  if (filters.priority) tasksQuery = tasksQuery.eq("priority", filters.priority);
  if (filters.assignedTo) tasksQuery = tasksQuery.eq("assigned_to", filters.assignedTo);
  if (filters.groupId) tasksQuery = tasksQuery.eq("group_id", filters.groupId);
  tasksQuery = tasksQuery
    .order(sortField, { ascending: sortDir === "asc", nullsFirst: false })
    .order("created_at", { ascending: false });

  const [{ data: tasksData }, { data: teamData }, { data: groupsData }] = await Promise.all([
    tasksQuery,
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("client_id", params.id)
      .order("full_name", { ascending: true }),
    supabase
      .from("task_groups")
      .select("*")
      .eq("client_id", params.id)
      .order("name", { ascending: true }),
  ]);

  const teamMembers = ((teamData ?? []) as any[]).map((p) => ({
    id: p.id as string,
    name: (p.full_name || p.email || "Bez vārda") as string,
  }));
  const nameById = new Map(teamMembers.map((m) => [m.id, m.name]));
  const groups = (groupsData ?? []) as TaskGroup[];

  const tasks: TaskWithNames[] = ((tasksData ?? []) as Task[])
    .map((t) => ({
      ...t,
      assigneeName: t.assigned_to ? nameById.get(t.assigned_to) ?? null : null,
    }))
    .filter((t) => !filters.q || taskMatchesQuery(t, filters.q));

  return (
    <div className="space-y-8">
      <div className="max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/[0.03]">
        <AddTaskForm
          teamMembers={teamMembers}
          groups={groups}
          hiddenFields={{ clientId: params.id }}
          action={createTaskAction}
        />
      </div>

      <CollapsibleSection icon={ListTodo} title="Uzdevumu grupas">
        <TaskGroupsManager
          groups={groups}
          hiddenFields={{ clientId: params.id }}
          createAction={createTaskGroupAction}
          deleteAction={deleteTaskGroupAction}
        />
      </CollapsibleSection>

      <TasksFilterBar
        basePath={`/clients/${params.id}/tasks`}
        filters={filters}
        teamMembers={teamMembers}
        groups={groups}
      />

      <TasksTable
        tasks={tasks}
        teamMembers={teamMembers}
        groups={groups}
        hiddenFields={{ clientId: params.id }}
        updateAction={updateTaskAction}
        deleteAction={deleteTaskAction}
      />
    </div>
  );
}
