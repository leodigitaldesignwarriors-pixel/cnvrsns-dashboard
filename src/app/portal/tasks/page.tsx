import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { StatusSelectForm } from "@/components/status-select-form";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { formatHours } from "@/lib/hours";
import { TASK_STATUSES, TaskPriority, TaskStatus } from "@/lib/types";
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_TONE, isTaskOverdue } from "@/lib/task-status";
import { updateMyTaskStatus } from "./actions";

export default async function PortalTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("tasks")
    .select("*, projects(id, name)")
    .order("due_date", { ascending: true, nullsFirst: false });
  if (status && TASK_STATUSES.some((s) => s.value === status)) {
    query = query.eq("status", status);
  }
  const { data: tasks } = await query;

  const tabs = [{ key: "", label: "All" }, ...TASK_STATUSES.map((s) => ({ key: s.value, label: s.label }))];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">My Tasks</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.key ? `/portal/tasks?status=${tab.key}` : "/portal/tasks"}
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
            <Th>Task</Th>
            <Th>Project</Th>
            <Th>Priority</Th>
            <Th>Due</Th>
            <Th>Est. hours</Th>
            <Th>Status</Th>
          </Tr>
        </THead>
        <TBody>
          {(tasks || []).map((t) => {
            const project = t.projects as { id: string; name: string } | null;
            const overdue = isTaskOverdue(t.due_date, t.status as TaskStatus);
            return (
              <Tr key={t.id}>
                <Td className="font-medium text-slate-900">{t.title}</Td>
                <Td>{project?.name || "—"}</Td>
                <Td>
                  <Badge tone={TASK_PRIORITY_TONE[t.priority as TaskPriority]}>
                    {TASK_PRIORITY_LABEL[t.priority as TaskPriority]}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(t.due_date)}</span>
                    {overdue && <Badge tone="red">Overdue</Badge>}
                  </div>
                </Td>
                <Td>{t.estimated_hours != null ? formatHours(Number(t.estimated_hours)) : "—"}</Td>
                <Td>
                  <StatusSelectForm
                    action={updateMyTaskStatus.bind(null, t.id)}
                    value={t.status as TaskStatus}
                    options={TASK_STATUSES}
                  />
                </Td>
              </Tr>
            );
          })}
          {(!tasks || tasks.length === 0) && (
            <Tr>
              <Td colSpan={6} className="text-center text-slate-400">
                No tasks assigned to you yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
