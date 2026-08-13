import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { getPortalEmployee } from "@/lib/portal";
import { formatDate } from "@/lib/format";
import { formatHours, clockedHours, weekRange } from "@/lib/hours";
import { TaskPriority, TaskStatus } from "@/lib/types";
import { TASK_PRIORITY_LABEL, TASK_PRIORITY_TONE, isTaskOverdue } from "@/lib/task-status";
import { clockIn, clockOut } from "./time/actions";

export default async function PortalDashboardPage() {
  const supabase = await createClient();
  const employee = await getPortalEmployee(supabase);

  if (!employee) {
    return (
      <p className="text-slate-500">
        Your account isn&apos;t linked to an employee record yet. Ask an
        admin to link it from the Employees page.
      </p>
    );
  }

  const { start, end } = weekRange();

  const [{ data: openEntry }, { data: weekEntries }, { data: tasks }] = await Promise.all([
    supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employee.id)
      .is("clock_out", null)
      .order("clock_in", { ascending: false })
      .maybeSingle(),
    supabase
      .from("time_entries")
      .select("*")
      .eq("employee_id", employee.id)
      .gte("work_date", start)
      .lte("work_date", end),
    supabase
      .from("tasks")
      .select("*, projects(name)")
      .neq("status", "done")
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(5),
  ]);

  const weekHours = (weekEntries || []).reduce((s, e) => s + clockedHours(e.clock_in, e.clock_out), 0);
  const overdueCount = (tasks || []).filter((t) => isTaskOverdue(t.due_date, t.status as TaskStatus)).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome, {employee.name}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{openEntry ? "You're signed in" : "You're signed off"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openEntry ? (
              <>
                <p className="text-sm text-slate-500">
                  Since{" "}
                  {new Date(openEntry.clock_in).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <form action={clockOut} className="space-y-2">
                  <Textarea name="note" rows={2} placeholder="What did you work on today? (optional)" />
                  <Button type="submit" variant="danger" size="sm">
                    Sign off
                  </Button>
                </form>
              </>
            ) : (
              <form action={clockIn}>
                <Button type="submit" size="sm">
                  Sign in
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Hours this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatHours(weekHours)}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">
            Your tasks {overdueCount > 0 && <Badge tone="red">{overdueCount} overdue</Badge>}
          </h2>
          <LinkButton href="/portal/tasks" variant="ghost" size="sm">
            View all
          </LinkButton>
        </div>
        <Table>
          <THead>
            <Tr>
              <Th>Task</Th>
              <Th>Project</Th>
              <Th>Priority</Th>
              <Th>Due</Th>
            </Tr>
          </THead>
          <TBody>
            {(tasks || []).map((t) => (
              <Tr key={t.id}>
                <Td className="font-medium text-slate-900">{t.title}</Td>
                <Td>{(t.projects as { name: string } | null)?.name || "—"}</Td>
                <Td>
                  <Badge tone={TASK_PRIORITY_TONE[t.priority as TaskPriority]}>
                    {TASK_PRIORITY_LABEL[t.priority as TaskPriority]}
                  </Badge>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <span>{formatDate(t.due_date)}</span>
                    {isTaskOverdue(t.due_date, t.status as TaskStatus) && <Badge tone="red">Overdue</Badge>}
                  </div>
                </Td>
              </Tr>
            ))}
            {(!tasks || tasks.length === 0) && (
              <Tr>
                <Td colSpan={4} className="text-center text-slate-400">
                  No open tasks assigned to you.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
