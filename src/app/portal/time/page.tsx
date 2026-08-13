import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { getPortalEmployee } from "@/lib/portal";
import { formatDate } from "@/lib/format";
import { formatHours, clockedHours, weekRange, todayKey } from "@/lib/hours";
import { clockIn, clockOut } from "./actions";

export default async function PortalTimePage() {
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
  const today = todayKey();

  const [{ data: openEntry }, { data: weekEntries }] = await Promise.all([
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
      .lte("work_date", end)
      .order("clock_in", { ascending: false }),
  ]);

  const todayHours = (weekEntries || [])
    .filter((e) => e.work_date === today)
    .reduce((s, e) => s + clockedHours(e.clock_in, e.clock_out), 0);
  const weekHours = (weekEntries || []).reduce((s, e) => s + clockedHours(e.clock_in, e.clock_out), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Time Clock</h1>

      <Card>
        <CardHeader>
          <CardTitle>{openEntry ? "You're signed in" : "You're signed off"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {openEntry ? (
            <>
              <p className="text-sm text-slate-500">
                Signed in at{" "}
                {new Date(openEntry.clock_in).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <form action={clockOut} className="space-y-3">
                <Textarea name="note" rows={2} placeholder="What did you work on today? (optional)" />
                <Button type="submit" variant="danger">
                  Sign off
                </Button>
              </form>
            </>
          ) : (
            <form action={clockIn}>
              <Button type="submit">Sign in</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Hours today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatHours(todayHours)}</p>
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
        <h2 className="mb-3 text-lg font-medium">This week</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Sign in</Th>
              <Th>Sign off</Th>
              <Th>Note</Th>
              <Th className="text-right">Hours</Th>
            </Tr>
          </THead>
          <TBody>
            {(weekEntries || []).map((e) => (
              <Tr key={e.id}>
                <Td>{formatDate(e.work_date)}</Td>
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
            {(!weekEntries || weekEntries.length === 0) && (
              <Tr>
                <Td colSpan={5} className="text-center text-slate-400">
                  No time entries yet this week.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
