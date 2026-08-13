import { createClient } from "@/lib/supabase/server";
import { Select, Input } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { formatHours, clockedHours } from "@/lib/hours";

export default async function TimeLogsPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    employee?: string;
    project?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const { view, employee, project, from, to } = await searchParams;
  const activeView = view === "entries" ? "entries" : "logs";
  const supabase = await createClient();

  const [{ data: employees }, { data: projects }] = await Promise.all([
    supabase.from("employees").select("id, name").order("name"),
    supabase.from("projects").select("id, name").order("name"),
  ]);

  let logsQuery = supabase
    .from("daily_logs")
    .select("*, employees(name), projects(name), tasks(title)")
    .order("log_date", { ascending: false });
  if (employee) logsQuery = logsQuery.eq("employee_id", employee);
  if (project) logsQuery = logsQuery.eq("project_id", project);
  if (from) logsQuery = logsQuery.gte("log_date", from);
  if (to) logsQuery = logsQuery.lte("log_date", to);

  let entriesQuery = supabase
    .from("time_entries")
    .select("*, employees(name)")
    .order("work_date", { ascending: false });
  if (employee) entriesQuery = entriesQuery.eq("employee_id", employee);
  if (from) entriesQuery = entriesQuery.gte("work_date", from);
  if (to) entriesQuery = entriesQuery.lte("work_date", to);

  const [{ data: logs }, { data: entries }] = await Promise.all([logsQuery, entriesQuery]);

  const totalLogHours = (logs || []).reduce((s, l) => s + Number(l.hours), 0);
  const totalClockHours = (entries || []).reduce((s, e) => s + clockedHours(e.clock_in, e.clock_out), 0);

  const baseParams = new URLSearchParams();
  if (employee) baseParams.set("employee", employee);
  if (project) baseParams.set("project", project);
  if (from) baseParams.set("from", from);
  if (to) baseParams.set("to", to);
  const logsHref = `/dashboard/time-logs?${new URLSearchParams({ ...Object.fromEntries(baseParams), view: "logs" })}`;
  const entriesHref = `/dashboard/time-logs?${new URLSearchParams({ ...Object.fromEntries(baseParams), view: "entries" })}`;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Time &amp; Logs</h1>

      <div className="flex gap-2">
        <a
          href={logsHref}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            activeView === "logs" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          Daily logs
        </a>
        <a
          href={entriesHref}
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            activeView === "entries" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
          )}
        >
          Time clock
        </a>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input type="hidden" name="view" value={activeView} />
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
        {activeView === "logs" && (
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
        )}
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">From</label>
          <Input type="date" name="from" defaultValue={from} className="w-40" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">To</label>
          <Input type="date" name="to" defaultValue={to} className="w-40" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Apply
        </button>
        {(employee || project || from || to) && (
          <a href={`/dashboard/time-logs?view=${activeView}`} className="text-sm text-slate-500 underline">
            Clear
          </a>
        )}
      </form>

      {activeView === "logs" ? (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            {(logs || []).length} entries · {formatHours(totalLogHours)} total
          </p>
          <Table>
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Employee</Th>
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
                  <Td>{(l.employees as { name: string } | null)?.name}</Td>
                  <Td>{(l.projects as { name: string } | null)?.name || "—"}</Td>
                  <Td>{(l.tasks as { title: string } | null)?.title || "—"}</Td>
                  <Td className="max-w-xs truncate">{l.description}</Td>
                  <Td className="text-right">{formatHours(Number(l.hours))}</Td>
                </Tr>
              ))}
              {(!logs || logs.length === 0) && (
                <Tr>
                  <Td colSpan={6} className="text-center text-slate-400">
                    No daily logs match these filters.
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm text-slate-500">
            {(entries || []).length} entries · {formatHours(totalClockHours)} total
          </p>
          <Table>
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Employee</Th>
                <Th>Sign in</Th>
                <Th>Sign off</Th>
                <Th>Note</Th>
                <Th className="text-right">Hours</Th>
              </Tr>
            </THead>
            <TBody>
              {(entries || []).map((e) => (
                <Tr key={e.id}>
                  <Td>{formatDate(e.work_date)}</Td>
                  <Td>{(e.employees as { name: string } | null)?.name}</Td>
                  <Td>{new Date(e.clock_in).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</Td>
                  <Td>
                    {e.clock_out
                      ? new Date(e.clock_out).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      : "Still working"}
                  </Td>
                  <Td className="max-w-xs truncate">{e.note || "—"}</Td>
                  <Td className="text-right">{formatHours(clockedHours(e.clock_in, e.clock_out))}</Td>
                </Tr>
              ))}
              {(!entries || entries.length === 0) && (
                <Tr>
                  <Td colSpan={6} className="text-center text-slate-400">
                    No time entries match these filters.
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
      )}
    </div>
  );
}
