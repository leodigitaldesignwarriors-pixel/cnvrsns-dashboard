import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import { createProject } from "../actions";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("status", "active")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add project</h1>
      <ProjectForm action={createProject} employees={employees || []} cancelHref="/dashboard/projects" />
    </div>
  );
}
