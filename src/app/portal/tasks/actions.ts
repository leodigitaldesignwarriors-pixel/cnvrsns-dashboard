"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { TaskStatus } from "@/lib/types";

export async function updateMyTaskStatus(taskId: string, formData: FormData) {
  const supabase = await createClient();
  const status = String(formData.get("status") || "todo") as TaskStatus;
  await supabase.from("tasks").update({ status }).eq("id", taskId);
  revalidatePath("/portal");
  revalidatePath("/portal/tasks");
}
