import { createClient } from "@/lib/supabase/server";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/(agency)/actions";
import { AddTaskForm } from "@/components/add-task-form";
import { TasksTable, type TaskWithNames } from "@/components/tasks-table";
import type { Task } from "@/lib/types";

export default async function ClientTasksTabPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const [{ data: tasksData }, { data: teamData }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", params.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("client_id", params.id)
      .eq("role", "client_user")
      .order("full_name", { ascending: true }),
  ]);

  const teamMembers = ((teamData ?? []) as any[]).map((p) => ({
    id: p.id as string,
    name: (p.full_name || p.email || "Bez vārda") as string,
  }));
  const nameById = new Map(teamMembers.map((m) => [m.id, m.name]));

  const tasks: TaskWithNames[] = ((tasksData ?? []) as Task[]).map((t) => ({
    ...t,
    assigneeName: t.assigned_to ? nameById.get(t.assigned_to) ?? null : null,
  }));

  return (
    <div className="space-y-8">
      <div className="max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/[0.03]">
        <AddTaskForm
          teamMembers={teamMembers}
          hiddenFields={{ clientId: params.id }}
          action={createTaskAction}
        />
      </div>

      <TasksTable
        tasks={tasks}
        teamMembers={teamMembers}
        hiddenFields={{ clientId: params.id }}
        updateAction={updateTaskAction}
        deleteAction={deleteTaskAction}
      />
    </div>
  );
}
