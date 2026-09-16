import { ListTodo } from "lucide-react";
import { requireClientUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  createTaskAction,
  updateTaskAction,
  deleteTaskAction,
  createTaskGroupAction,
  deleteTaskGroupAction,
} from "@/app/(client)/actions";
import { AddTaskForm } from "@/components/add-task-form";
import { TasksTable, type TaskWithNames } from "@/components/tasks-table";
import { TasksFilterBar } from "@/components/tasks-filter-bar";
import { TaskGroupsManager } from "@/components/task-groups-manager";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import type { Task, TaskGroup } from "@/lib/types";

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const profile = await requireClientUser();
  const supabase = createClient();

  const filters = {
    status: param(searchParams, "status"),
    priority: param(searchParams, "priority"),
    assignedTo: param(searchParams, "assignedTo"),
    groupId: param(searchParams, "groupId"),
    archived: param(searchParams, "archived"),
  };

  let tasksQuery = supabase.from("tasks").select("*").eq("client_id", profile.client_id!);
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
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const [{ data: tasksData }, { data: teamData }, { data: groupsData }] = await Promise.all([
    tasksQuery,
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("client_id", profile.client_id!)
      .order("full_name", { ascending: true }),
    supabase
      .from("task_groups")
      .select("*")
      .eq("client_id", profile.client_id!)
      .order("name", { ascending: true }),
  ]);

  const teamMembers = ((teamData ?? []) as any[]).map((p) => ({
    id: p.id as string,
    name: (p.full_name || p.email || "Bez vārda") as string,
  }));
  const nameById = new Map(teamMembers.map((m) => [m.id, m.name]));
  const groups = (groupsData ?? []) as TaskGroup[];

  const tasks: TaskWithNames[] = ((tasksData ?? []) as Task[]).map((t) => ({
    ...t,
    assigneeName: t.assigned_to ? nameById.get(t.assigned_to) ?? null : null,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Uzdevumi</h1>
        <p className="text-muted-foreground">Komandas darāmie darbi ar termiņiem un atbildīgajiem.</p>
      </div>

      <div className="max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/[0.03]">
        <AddTaskForm teamMembers={teamMembers} groups={groups} action={createTaskAction} />
      </div>

      <CollapsibleSection icon={ListTodo} title="Uzdevumu grupas">
        <TaskGroupsManager groups={groups} createAction={createTaskGroupAction} deleteAction={deleteTaskGroupAction} />
      </CollapsibleSection>

      <TasksFilterBar basePath="/tasks" filters={filters} teamMembers={teamMembers} groups={groups} />

      <TasksTable
        tasks={tasks}
        teamMembers={teamMembers}
        groups={groups}
        updateAction={updateTaskAction}
        deleteAction={deleteTaskAction}
      />
    </div>
  );
}
