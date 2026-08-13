import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { formatHours, weekRange, todayKey } from "@/lib/hours";
import { ProjectStatus } from "@/lib/types";
import { PROJECT_STATUS_LABEL, PROJECT_STATUS_TONE } from "@/lib/task-status";

export default async function TeamDashboardPage() {
  const supabase = await createClient();
  const { start, end } = weekRange();
  const today = todayKey();
  const in7Days = new Date();
  in7Days.setDate(in7Days.getDate() + 7);
  const in7DaysKey = in7Days.toISOString().slice(0, 10);

  const [
    { data: activeProjects },
    { data: nearingDeadline },
    { data: openTasks },
    { data: overdueTasks },
    { data: weekLogs },
    { data: employees },
  ] = await Promise.all([
    supabase.from("projects").select("*").neq("status", "completed").order("due_date"),
    supabase
      .from("projects")
      .select("*")
      .neq("status", "completed")
      .gte("due_date", today)
      .lte("due_date", in7DaysKey)
      .order("due_date"),
    supabase
      .from("tasks")
      .select("*, projects(name), task_assignees(employee_id, employees(name))")
      .neq("status", "done"),
    supabase
      .from("tasks")
      .select("*, projects(name), task_assignees(employee_id, employees(name))")
      .neq("status", "done")
      .lt("due_date", today)
      .not("due_date", "is", null)
      .order("due_date"),
    supabase.from("daily_logs").select("employee_id, hours").gte("log_date", start).lte("log_date", end),
    supabase.from("employees").select("id, name").eq("status", "active").order("name"),
  ]);

  const hoursByEmployee = new Map<string, number>();
  for (const l of weekLogs || []) {
    hoursByEmployee.set(l.employee_id, (hoursByEmployee.get(l.employee_id) || 0) + Number(l.hours));
  }
  const totalHoursThisWeek = Array.from(hoursByEmployee.values()).reduce((s, h) => s + h, 0);

  const openTaskCountByEmployee = new Map<string, number>();
  const openTaskTitlesByEmployee = new Map<string, string[]>();
  for (const t of openTasks || []) {
    const assignees = (t.task_assignees || []) as { employee_id: string }[];
    for (const a of assignees) {
      openTaskCountByEmployee.set(a.employee_id, (openTaskCountByEmployee.get(a.employee_id) || 0) + 1);
      const titles = openTaskTitlesByEmployee.get(a.employee_id) || [];
      titles.push(t.title);
      openTaskTitlesByEmployee.set(a.employee_id, titles);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Team Dashboard</h1>
        <div className="flex gap-3">
          <LinkButton href="/dashboard/projects/new" variant="secondary">
            Add project
          </LinkButton>
          <LinkButton href="/dashboard/tasks/new">Add task</LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{(activeProjects || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hours logged this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatHours(totalHoursThisWeek)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">{(overdueTasks || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Deadlines this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{(nearingDeadline || []).length}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Team workload</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Employee</Th>
              <Th>Open tasks</Th>
              <Th>Working on</Th>
              <Th className="text-right">Hours this week</Th>
            </Tr>
          </THead>
          <TBody>
            {(employees || []).map((e) => {
              const titles = openTaskTitlesByEmployee.get(e.id) || [];
              return (
                <Tr key={e.id}>
                  <Td className="font-medium text-slate-900">{e.name}</Td>
                  <Td>{openTaskCountByEmployee.get(e.id) || 0}</Td>
                  <Td className="max-w-xs truncate text-slate-500">
                    {titles.length > 0 ? titles.slice(0, 3).join(", ") : "—"}
                  </Td>
                  <Td className="text-right">{formatHours(hoursByEmployee.get(e.id) || 0)}</Td>
                </Tr>
              );
            })}
            {(!employees || employees.length === 0) && (
              <Tr>
                <Td colSpan={4} className="text-center text-slate-400">
                  No active employees yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Overdue tasks</h2>
            <LinkButton href="/dashboard/tasks?status=in_progress" variant="ghost" size="sm">
              View all tasks
            </LinkButton>
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>Task</Th>
                <Th>Project</Th>
                <Th>Due</Th>
              </Tr>
            </THead>
            <TBody>
              {(overdueTasks || []).map((t) => (
                <Tr key={t.id}>
                  <Td>
                    <a href={`/dashboard/tasks/${t.id}`} className="underline">
                      {t.title}
                    </a>
                  </Td>
                  <Td>{(t.projects as { name: string } | null)?.name}</Td>
                  <Td className="text-red-600">{formatDate(t.due_date)}</Td>
                </Tr>
              ))}
              {(!overdueTasks || overdueTasks.length === 0) && (
                <Tr>
                  <Td colSpan={3} className="text-center text-slate-400">
                    Nothing overdue.
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Projects nearing deadline</h2>
            <LinkButton href="/dashboard/projects" variant="ghost" size="sm">
              View all
            </LinkButton>
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>Project</Th>
                <Th>Due</Th>
                <Th>Status</Th>
              </Tr>
            </THead>
            <TBody>
              {(nearingDeadline || []).map((p) => (
                <Tr key={p.id}>
                  <Td>
                    <a href={`/dashboard/projects/${p.id}`} className="underline">
                      {p.name}
                    </a>
                  </Td>
                  <Td>{formatDate(p.due_date)}</Td>
                  <Td>
                    <Badge tone={PROJECT_STATUS_TONE[p.status as ProjectStatus]}>
                      {PROJECT_STATUS_LABEL[p.status as ProjectStatus]}
                    </Badge>
                  </Td>
                </Tr>
              ))}
              {(!nearingDeadline || nearingDeadline.length === 0) && (
                <Tr>
                  <Td colSpan={3} className="text-center text-slate-400">
                    Nothing due in the next 7 days.
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
