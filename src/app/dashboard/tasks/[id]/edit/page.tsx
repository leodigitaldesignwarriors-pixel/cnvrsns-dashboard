import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "../../task-form";
import { updateTask } from "../../actions";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: task }, { data: projects }, { data: employees }, { data: assignees }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).single(),
    supabase.from("projects").select("*").order("name"),
    supabase.from("employees").select("*").eq("status", "active").order("name"),
    supabase.from("task_assignees").select("employee_id").eq("task_id", id),
  ]);

  if (!task) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit task</h1>
      <TaskForm
        action={updateTask.bind(null, id)}
        task={task}
        projects={projects || []}
        employees={employees || []}
        assigneeIds={(assignees || []).map((a) => a.employee_id)}
        cancelHref={`/dashboard/tasks/${id}`}
      />
    </div>
  );
}
