"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getPortalEmployee } from "@/lib/portal";

export async function createDailyLog(formData: FormData) {
  const supabase = await createClient();
  const employee = await getPortalEmployee(supabase);
  if (!employee) return;

  let projectId = String(formData.get("project_id") || "") || null;
  const taskId = String(formData.get("task_id") || "") || null;
  const logDate = String(formData.get("log_date") || "");
  const hours = Number(formData.get("hours") || 0);
  const description = String(formData.get("description") || "");

  if (taskId) {
    const { data: task } = await supabase
      .from("tasks")
      .select("project_id")
      .eq("id", taskId)
      .single();
    if (task) projectId = task.project_id;
  }

  await supabase.from("daily_logs").insert({
    employee_id: employee.id,
    project_id: projectId,
    task_id: taskId,
    log_date: logDate,
    hours,
    description,
  });

  revalidatePath("/portal");
  revalidatePath("/portal/logs");
  redirect("/portal/logs");
}
