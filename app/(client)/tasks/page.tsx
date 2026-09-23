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
import { AddTaskDialogButton } from "@/components/add-task-dialog-button";
import { TaskBoard } from "@/components/task-board";
import type { TaskWithNames } from "@/components/tasks-table";
import { TasksFilterBar, type TaskSortField } from "@/components/tasks-filter-bar";
import { TaskGroupsManager } from "@/components/task-groups-manager";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { taskMatchesQuery } from "@/lib/utils";
import type { Task, TaskGroup } from "@/lib/types";

function param(searchParams: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const value = searchParams[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

const DEFAULT_SORT_DIR: Record<TaskSortField, "asc" | "desc"> = {
  due_date: "asc",
  priority: "desc",
  created_at: "desc",
  title: "asc",
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const profile = await requireClientUser();
  const supabase = createClient();

  const sortField = (param(searchParams, "sort") as TaskSortField | undefined) ?? "due_date";
  const explicitDir = param(searchParams, "dir");
  const sortDir = explicitDir === "asc" || explicitDir === "desc" ? explicitDir : DEFAULT_SORT_DIR[sortField];

  const filters = {
    q: param(searchParams, "q"),
    status: param(searchParams, "status"),
    priority: param(searchParams, "priority"),
    assignedTo: param(searchParams, "assignedTo"),
    groupId: param(searchParams, "groupId"),
    sort: sortField,
    dir: sortDir,
  };

  // Fetch active AND completed/archived tasks together — the tabs (Šodien/Šonedēļ/Visi/Pabeigtie)
  // split them client-side, so all four tab counts are visible at once.
  let tasksQuery = supabase.from("tasks").select("*").eq("client_id", profile.client_id!);
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

  const tasks: TaskWithNames[] = ((tasksData ?? []) as Task[])
    .map((t) => ({
      ...t,
      assigneeName: t.assigned_to ? nameById.get(t.assigned_to) ?? null : null,
    }))
    .filter((t) => !filters.q || taskMatchesQuery(t, filters.q));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Uzdevumi</h1>
          <p className="text-muted-foreground">Komandas darāmie darbi ar termiņiem un atbildīgajiem.</p>
        </div>
        <AddTaskDialogButton teamMembers={teamMembers} groups={groups} action={createTaskAction} />
      </div>

      <TasksFilterBar
        basePath="/tasks"
        filters={filters}
        teamMembers={teamMembers}
        groups={groups}
        showArchivedToggle={false}
      />

      <TaskBoard
        tasks={tasks}
        groups={groups}
        teamMembers={teamMembers}
        updateAction={updateTaskAction}
        deleteAction={deleteTaskAction}
      />

      <CollapsibleSection icon={ListTodo} title="Uzdevumu grupas">
        <TaskGroupsManager groups={groups} createAction={createTaskGroupAction} deleteAction={deleteTaskGroupAction} />
      </CollapsibleSection>
    </div>
  );
}
