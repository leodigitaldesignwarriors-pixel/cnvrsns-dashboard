import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { StatusSelectForm } from "@/components/status-select-form";
import { formatDate } from "@/lib/format";
import { formatHours } from "@/lib/hours";
import { TASK_STATUSES, TASK_PRIORITIES, TaskPriority, TaskStatus } from "@/lib/types";
import { TASK_PRIORITY_TONE, TASK_PRIORITY_LABEL, isTaskOverdue } from "@/lib/task-status";
import { updateTaskStatus } from "./actions";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; employee?: string; status?: string; priority?: string }>;
}) {
  const { project, employee, status, priority } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*, projects(id, name), task_assignees(employee_id, employees(name))")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (project) query = query.eq("project_id", project);
  if (status) query = query.eq("status", status);
  if (priority) query = query.eq("priority", priority);

  const [{ data: tasksRaw }, { data: projects }, { data: employees }] = await Promise.all([
    query,
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("employees").select("id, name").eq("status", "active").order("name"),
  ]);

  const tasks = (tasksRaw || []).filter((t) => {
    if (!employee) return true;
    const assignees = (t.task_assignees || []) as { employee_id: string }[];
    return assignees.some((a) => a.employee_id === employee);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <LinkButton href="/dashboard/tasks/new">Add task</LinkButton>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Project</label>
          <Select name="project" defaultValue={project || ""} className="w-44">
            <option value="">All projects</option>
            {(projects || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Employee</label>
          <Select name="employee" defaultValue={employee || ""} className="w-44">
            <option value="">Everyone</option>
            {(employees || []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Status</label>
          <Select name="status" defaultValue={status || ""} className="w-40">
            <option value="">Any status</option>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
          <Select name="priority" defaultValue={priority || ""} className="w-36">
            <option value="">Any priority</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Apply
        </button>
        {(project || employee || status || priority) && (
          <Link href="/dashboard/tasks" className="text-sm text-slate-500 underline">
            Clear
          </Link>
        )}
      </form>

      <Table>
        <THead>
          <Tr>
            <Th>Task</Th>
            <Th>Project</Th>
            <Th>Assigned</Th>
            <Th>Priority</Th>
            <Th>Status</Th>
            <Th>Due</Th>
            <Th className="text-right">Est. hours</Th>
          </Tr>
        </THead>
        <TBody>
          {tasks.map((t) => {
            const assignees = (t.task_assignees || []) as {
              employees: { name: string } | null;
            }[];
            const overdue = isTaskOverdue(t.due_date, t.status as TaskStatus);
            return (
              <Tr key={t.id}>
                <Td>
                  <a href={`/dashboard/tasks/${t.id}`} className="font-medium text-slate-900 underline">
                    {t.title}
                  </a>
                </Td>
                <Td>{(t.projects as { name: string } | null)?.name || "—"}</Td>
                <Td>
                  {assignees.length > 0
                    ? assignees.map((a) => a.employees?.name).filter(Boolean).join(", ")
                    : "Unassigned"}
                </Td>
                <Td>
                  <Badge tone={TASK_PRIORITY_TONE[t.priority as TaskPriority]}>
                    {TASK_PRIORITY_LABEL[t.priority as TaskPriority]}
                  </Badge>
                </Td>
                <Td>
                  <StatusSelectForm
                    action={updateTaskStatus.bind(null, t.id)}
                    value={t.status as TaskStatus}
                    options={TASK_STATUSES}
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(t.due_date)}</span>
                    {overdue && <Badge tone="red">Overdue</Badge>}
                  </div>
                </Td>
                <Td className="text-right">
                  {t.estimated_hours != null ? formatHours(Number(t.estimated_hours)) : "—"}
                </Td>
              </Tr>
            );
          })}
          {tasks.length === 0 && (
            <Tr>
              <Td colSpan={7} className="text-center text-slate-400">
                No tasks match these filters.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
