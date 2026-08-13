import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { StatusSelectForm } from "@/components/status-select-form";
import { formatDate } from "@/lib/format";
import { formatHours } from "@/lib/hours";
import { TASK_STATUSES, TaskPriority, TaskStatus } from "@/lib/types";
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_TONE, isTaskOverdue } from "@/lib/task-status";
import { deleteTask, updateTaskStatus } from "../actions";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("tasks")
    .select("*, projects(id, name), task_assignees(employee_id, employees(id, name))")
    .eq("id", id)
    .single();

  if (!task) notFound();

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("*, employees(name)")
    .eq("task_id", id)
    .order("log_date", { ascending: false });

  const actualHours = (logs || []).reduce((s, l) => s + Number(l.hours), 0);
  const project = task.projects as { id: string; name: string } | null;
  const assignees = (task.task_assignees || []) as {
    employees: { name: string } | null;
  }[];
  const overdue = isTaskOverdue(task.due_date, task.status as TaskStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {project && (
              <a href={`/dashboard/projects/${project.id}`} className="underline">
                {project.name}
              </a>
            )}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{task.title}</h1>
            <Badge tone={TASK_PRIORITY_TONE[task.priority as TaskPriority]}>
              {TASK_PRIORITY_LABEL[task.priority as TaskPriority]} priority
            </Badge>
            {overdue && <Badge tone="red">Overdue</Badge>}
          </div>
          {task.due_date && <p className="mt-1 text-sm text-slate-500">Due {formatDate(task.due_date)}</p>}
        </div>
        <div className="flex items-center gap-3">
          <StatusSelectForm
            action={updateTaskStatus.bind(null, id)}
            value={task.status as TaskStatus}
            options={TASK_STATUSES}
          />
          <LinkButton href={`/dashboard/tasks/${id}/edit`} variant="secondary">
            Edit
          </LinkButton>
          <ConfirmDeleteForm
            action={deleteTask.bind(null, id, task.project_id)}
            confirmMessage={`Delete "${task.title}"? This also removes its logged hours history. This cannot be undone.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Estimated hours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {task.estimated_hours != null ? formatHours(Number(task.estimated_hours)) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Actual hours logged</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatHours(actualHours)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Assigned to</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {assignees.length > 0
                ? assignees.map((a) => a.employees?.name).filter(Boolean).join(", ")
                : "Unassigned"}
            </p>
          </CardContent>
        </Card>
      </div>

      {task.description && (
        <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">{task.description}</p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Logged work</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Employee</Th>
              <Th>Note</Th>
              <Th className="text-right">Hours</Th>
            </Tr>
          </THead>
          <TBody>
            {(logs || []).map((l) => (
              <Tr key={l.id}>
                <Td>{formatDate(l.log_date)}</Td>
                <Td>{(l.employees as { name: string } | null)?.name}</Td>
                <Td>{l.description}</Td>
                <Td className="text-right">{formatHours(Number(l.hours))}</Td>
              </Tr>
            ))}
            {(!logs || logs.length === 0) && (
              <Tr>
                <Td colSpan={4} className="text-center text-slate-400">
                  No hours logged yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
