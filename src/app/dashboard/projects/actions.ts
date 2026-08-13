"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ProjectPlatform, ProjectStatus } from "@/lib/types";

function readProjectForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    client_name: String(formData.get("client_name") || "") || null,
    platform: String(formData.get("platform") || "shopify") as ProjectPlatform,
    start_date: String(formData.get("start_date") || "") || null,
    due_date: String(formData.get("due_date") || "") || null,
    status: String(formData.get("status") || "not_started") as ProjectStatus,
    notes: String(formData.get("notes") || "") || null,
  };
}

async function syncMembers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  formData: FormData,
) {
  const employeeIds = formData.getAll("employee_ids").map(String);
  await supabase.from("project_members").delete().eq("project_id", projectId);
  if (employeeIds.length > 0) {
    await supabase
      .from("project_members")
      .insert(employeeIds.map((employee_id) => ({ project_id: projectId, employee_id })));
  }
}

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const values = readProjectForm(formData);
  const { data } = await supabase.from("projects").insert(values).select("id").single();
  if (data?.id) await syncMembers(supabase, data.id, formData);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/team");
  redirect(`/dashboard/projects/${data?.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readProjectForm(formData);
  await supabase.from("projects").update(values).eq("id", id);
  await syncMembers(supabase, id, formData);
  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/timeline");
  redirect(`/dashboard/projects/${id}`);
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", id);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/timeline");
  redirect("/dashboard/projects");
}
