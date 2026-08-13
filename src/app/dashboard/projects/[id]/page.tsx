import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { formatHours } from "@/lib/hours";
import { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";
import {
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_TONE,
  TASK_STATUS_LABEL,
  TASK_STATUS_TONE,
  TASK_PRIORITY_LABEL,
  TASK_PRIORITY_TONE,
  isProjectOverdue,
  isTaskOverdue,
} from "@/lib/task-status";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: members }, { data: tasks }, { data: logs }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase
      .from("project_members")
      .select("employee_id, employees(id, name)")
      .eq("project_id", id),
    supabase.from("tasks").select("*").eq("project_id", id).order("due_date", { ascending: true }),
    supabase.from("daily_logs").select("hours").eq("project_id", id),
  ]);

  if (!project) notFound();

  const totalLoggedHours = (logs || []).reduce((s, l) => s + Number(l.hours), 0);
  const overdue = isProjectOverdue(project.due_date, project.status as ProjectStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <Badge tone={PROJECT_STATUS_TONE[project.status as ProjectStatus]}>
              {PROJECT_STATUS_LABEL[project.status as ProjectStatus]}
            </Badge>
            {overdue && <Badge tone="red">Overdue</Badge>}
          </div>
          {project.client_name && <p className="text-slate-500">{project.client_name}</p>}
          <p className="mt-1 text-sm capitalize text-slate-500">{project.platform}</p>
          {(project.start_date || project.due_date) && (
            <p className="mt-1 text-sm text-slate-500">
              {project.start_date && <span>Started {formatDate(project.start_date)}</span>}
              {project.due_date && <span> · Due {formatDate(project.due_date)}</span>}
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <LinkButton href={`/dashboard/projects/${id}/edit`} variant="secondary">
            Edit
          </LinkButton>
          <LinkButton href={`/dashboard/tasks/new?project=${id}`}>Add task</LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {(tasks || []).filter((t) => t.status === "done").length}/{(tasks || []).length} done
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hours logged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatHours(totalLoggedHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {(members || []).length > 0
                ? (members || [])
                    .map((m) => (m.employees as unknown as { name: string } | null)?.name)
                    .filter(Boolean)
                    .join(", ")
                : "Unassigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      {project.notes && (
        <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">{project.notes}</p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Tasks &amp; milestones</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Task</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Due</Th>
              <Th className="text-right">Est. hours</Th>
            </Tr>
          </THead>
          <TBody>
            {(tasks || []).map((t) => (
              <Tr key={t.id}>
                <Td>
                  <a
                    href={`/dashboard/tasks/${t.id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {t.title}
                  </a>
                </Td>
                <Td>
                  <Badge tone={TASK_PRIORITY_TONE[t.priority as TaskPriority]}>
                    {TASK_PRIORITY_LABEL[t.priority as TaskPriority]}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={TASK_STATUS_TONE[t.status as TaskStatus]}>
                    {TASK_STATUS_LABEL[t.status as TaskStatus]}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(t.due_date)}</span>
                    {isTaskOverdue(t.due_date, t.status as TaskStatus) && (
                      <Badge tone="red">Overdue</Badge>
                    )}
                  </div>
                </Td>
                <Td className="text-right">
                  {t.estimated_hours != null ? formatHours(Number(t.estimated_hours)) : "—"}
                </Td>
              </Tr>
            ))}
            {(!tasks || tasks.length === 0) && (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400">
                  No tasks yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
