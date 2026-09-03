import { requireClientUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createTaskAction, updateTaskAction, deleteTaskAction } from "@/app/(client)/actions";
import { AddTaskForm } from "@/components/add-task-form";
import { TasksTable, type TaskWithNames } from "@/components/tasks-table";
import type { Task } from "@/lib/types";

export default async function TasksPage() {
  const profile = await requireClientUser();
  const supabase = createClient();

  const [{ data: tasksData }, { data: teamData }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("client_id", profile.client_id!)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("client_id", profile.client_id!)
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
      <div>
        <h1 className="text-2xl font-semibold">Uzdevumi</h1>
        <p className="text-muted-foreground">Komandas darāmie darbi ar termiņiem un atbildīgajiem.</p>
      </div>

      <div className="max-w-xl rounded-lg border border-border bg-card p-6 shadow-sm shadow-black/[0.03]">
        <AddTaskForm teamMembers={teamMembers} action={createTaskAction} />
      </div>

      <TasksTable
        tasks={tasks}
        teamMembers={teamMembers}
        updateAction={updateTaskAction}
        deleteAction={deleteTaskAction}
      />
    </div>
  );
}
