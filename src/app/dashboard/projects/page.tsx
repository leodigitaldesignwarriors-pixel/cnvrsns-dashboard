import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUSES, ProjectStatus } from "@/lib/types";
import { PROJECT_STATUS_TONE, PROJECT_STATUS_LABEL, isProjectOverdue } from "@/lib/task-status";
import { deleteProject } from "./actions";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*, project_members(employee_id, employees(name)), tasks(id, status)")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (status && PROJECT_STATUSES.some((s) => s.value === status)) {
    query = query.eq("status", status);
  }
  const { data: projects } = await query;

  const tabs = [{ key: "", label: "All" }, ...PROJECT_STATUSES.map((s) => ({ key: s.value, label: s.label }))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <LinkButton href="/dashboard/projects/new">Add project</LinkButton>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.key ? `/dashboard/projects?status=${tab.key}` : "/dashboard/projects"}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              (status || "") === tab.key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <Table>
        <THead>
          <Tr>
            <Th>Project</Th>
            <Th>Client</Th>
            <Th>Platform</Th>
            <Th>Team</Th>
            <Th>Tasks</Th>
            <Th>Due</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {(projects || []).map((p) => {
            const members = (p.project_members || []) as {
              employees: { name: string } | null;
            }[];
            const tasks = (p.tasks || []) as { status: string }[];
            const doneTasks = tasks.filter((t) => t.status === "done").length;
            const overdue = isProjectOverdue(p.due_date, p.status as ProjectStatus);
            return (
              <Tr key={p.id}>
                <Td>
                  <a
                    href={`/dashboard/projects/${p.id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {p.name}
                  </a>
                </Td>
                <Td>{p.client_name || "—"}</Td>
                <Td className="capitalize">{p.platform}</Td>
                <Td>
                  {members.length > 0
                    ? members.map((m) => m.employees?.name).filter(Boolean).join(", ")
                    : "—"}
                </Td>
                <Td>
                  {tasks.length > 0 ? `${doneTasks}/${tasks.length} done` : "—"}
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(p.due_date)}</span>
                    {overdue && <Badge tone="red">Overdue</Badge>}
                  </div>
                </Td>
                <Td>
                  <Badge tone={PROJECT_STATUS_TONE[p.status as ProjectStatus]}>
                    {PROJECT_STATUS_LABEL[p.status as ProjectStatus]}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <ConfirmDeleteForm
                    action={deleteProject.bind(null, p.id)}
                    confirmMessage={`Delete ${p.name}? This also permanently deletes all of its tasks, time logs, and assignments. This cannot be undone.`}
                  />
                </Td>
              </Tr>
            );
          })}
          {(!projects || projects.length === 0) && (
            <Tr>
              <Td colSpan={8} className="text-center text-slate-400">
                No projects yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
