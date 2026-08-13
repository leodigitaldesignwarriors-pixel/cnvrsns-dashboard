"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TaskPriority, TaskStatus } from "@/lib/types";

function readTaskForm(formData: FormData) {
  return {
    project_id: String(formData.get("project_id") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || null,
    due_date: String(formData.get("due_date") || "") || null,
    priority: String(formData.get("priority") || "medium") as TaskPriority,
    status: String(formData.get("status") || "todo") as TaskStatus,
    estimated_hours: formData.get("estimated_hours")
      ? Number(formData.get("estimated_hours"))
      : null,
  };
}

async function syncAssignees(
  supabase: Awaited<ReturnType<typeof createClient>>,
  taskId: string,
  formData: FormData,
) {
  const employeeIds = formData.getAll("employee_ids").map(String);
  await supabase.from("task_assignees").delete().eq("task_id", taskId);
  if (employeeIds.length > 0) {
    await supabase
      .from("task_assignees")
      .insert(employeeIds.map((employee_id) => ({ task_id: taskId, employee_id })));
  }
}

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const values = readTaskForm(formData);
  const { data } = await supabase.from("tasks").insert(values).select("id").single();
  if (data?.id) await syncAssignees(supabase, data.id, formData);
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/projects/${values.project_id}`);
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/timeline");
  redirect(`/dashboard/tasks/${data?.id}`);
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readTaskForm(formData);
  await supabase.from("tasks").update(values).eq("id", id);
  await syncAssignees(supabase, id, formData);
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath(`/dashboard/projects/${values.project_id}`);
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/timeline");
  redirect(`/dashboard/tasks/${id}`);
}

export async function updateTaskStatus(id: string, formData: FormData) {
  const supabase = await createClient();
  const status = String(formData.get("status") || "todo") as TaskStatus;
  await supabase.from("tasks").update({ status }).eq("id", id);
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/tasks/${id}`);
  revalidatePath("/dashboard/team");
}

export async function deleteTask(id: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", id);
  revalidatePath("/dashboard/tasks");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/timeline");
  redirect(`/dashboard/projects/${projectId}`);
}
