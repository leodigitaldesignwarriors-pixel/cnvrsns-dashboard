import { createClient } from "@/lib/supabase/server";
import { formatPKR, formatDate } from "@/lib/format";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("employee_id")
    .eq("id", user!.id)
    .single();

  if (!profile?.employee_id) {
    return (
      <p className="text-slate-500">
        Your account isn&apos;t linked to an employee record yet. Ask a
        partner to link it from the Employees page.
      </p>
    );
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", profile.employee_id)
    .single();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .eq("employee_id", profile.employee_id)
    .order("date", { ascending: false });

  const totalPaid = (transactions || []).reduce(
    (sum, t) => sum + Number(t.amount),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome, {employee?.name}</h1>
        <p className="text-slate-500">
          {employee?.role_title} · Monthly salary{" "}
          {formatPKR(Number(employee?.monthly_salary || 0))}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total paid to date</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{formatPKR(totalPaid)}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Payment history</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th className="text-right">Amount</Th>
            </Tr>
          </THead>
          <TBody>
            {(transactions || []).map((t) => (
              <Tr key={t.id}>
                <Td>{formatDate(t.date)}</Td>
                <Td>{t.description || "Salary payment"}</Td>
                <Td className="text-right">
                  {formatPKR(Number(t.amount))}
                </Td>
              </Tr>
            ))}
            {(!transactions || transactions.length === 0) && (
              <Tr>
                <Td colSpan={3} className="text-center text-slate-400">
                  No payments recorded yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
