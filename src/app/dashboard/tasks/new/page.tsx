import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "../task-form";
import { createTask } from "../actions";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project } = await searchParams;
  const supabase = await createClient();
  const [{ data: projects }, { data: employees }] = await Promise.all([
    supabase.from("projects").select("*").order("name"),
    supabase.from("employees").select("*").eq("status", "active").order("name"),
  ]);

  const cancelHref = project ? `/dashboard/projects/${project}` : "/dashboard/tasks";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add task</h1>
      <TaskForm
        action={createTask}
        projects={projects || []}
        employees={employees || []}
        defaultProjectId={project}
        cancelHref={cancelHref}
      />
    </div>
  );
}
