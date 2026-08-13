import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { getPortalEmployee } from "@/lib/portal";
import { formatDate } from "@/lib/format";
import { formatHours, weekRange } from "@/lib/hours";
import { DailyLogForm } from "./daily-log-form";
import { createDailyLog } from "./actions";

export default async function PortalLogsPage() {
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

  const [{ data: projects }, { data: tasks }, { data: logs }] = await Promise.all([
    supabase.from("projects").select("*").order("name"),
    supabase.from("tasks").select("*, projects(name)").order("title"),
    supabase
      .from("daily_logs")
      .select("*, projects(name), tasks(title)")
      .eq("employee_id", employee.id)
      .order("log_date", { ascending: false })
      .limit(30),
  ]);

  const { start, end } = weekRange();
  const weekHours = (logs || [])
    .filter((l) => l.log_date >= start && l.log_date <= end)
    .reduce((s, l) => s + Number(l.hours), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Daily Log</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Log today&apos;s work</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyLogForm action={createDailyLog} projects={projects || []} tasks={tasks || []} />
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Hours logged this week</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatHours(weekHours)}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Recent logs</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Project</Th>
              <Th>Task</Th>
              <Th>Note</Th>
              <Th className="text-right">Hours</Th>
            </Tr>
          </THead>
          <TBody>
            {(logs || []).map((l) => (
              <Tr key={l.id}>
                <Td>{formatDate(l.log_date)}</Td>
                <Td>{(l.projects as { name: string } | null)?.name || "—"}</Td>
                <Td>{(l.tasks as { title: string } | null)?.title || "—"}</Td>
                <Td className="max-w-xs truncate">{l.description}</Td>
                <Td className="text-right">{formatHours(Number(l.hours))}</Td>
              </Tr>
            ))}
            {(!logs || logs.length === 0) && (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400">
                  No logs yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
