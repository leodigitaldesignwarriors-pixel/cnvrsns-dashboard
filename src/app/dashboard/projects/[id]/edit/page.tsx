import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../../project-form";
import { updateProject } from "../../actions";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: employees }, { data: members }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("employees").select("*").eq("status", "active").order("name"),
    supabase.from("project_members").select("employee_id").eq("project_id", id),
  ]);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit project</h1>
      <ProjectForm
        action={updateProject.bind(null, id)}
        project={project}
        employees={employees || []}
        memberIds={(members || []).map((m) => m.employee_id)}
        cancelHref={`/dashboard/projects/${id}`}
      />
    </div>
  );
}
