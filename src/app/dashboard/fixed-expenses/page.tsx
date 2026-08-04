import { createClient } from "@/lib/supabase/server";
import { LinkButton, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { formatPKR, currentMonthKey } from "@/lib/format";
import { markFixedExpensePaid, setFixedExpenseActive, deleteFixedExpense } from "./actions";

export default async function FixedExpensesPage() {
  const supabase = await createClient();
  const monthKey = currentMonthKey();
  const [year, month] = monthKey.split("-").map(Number);
  const start = `${monthKey}-01`;
  const end = new Date(year, month, 1).toISOString().slice(0, 10);

  const [{ data: fixedExpenses }, { data: accounts }, { data: employees }, { data: monthTx }] =
    await Promise.all([
      supabase.from("fixed_expenses").select("*").order("is_active", { ascending: false }).order("name"),
      supabase.from("accounts").select("id, name").eq("is_archived", false).order("name"),
      supabase.from("employees").select("id, name, monthly_salary").eq("status", "active").order("name"),
      supabase
        .from("transactions")
        .select("amount, fixed_expense_id, employee_id")
        .eq("type", "expense")
        .gte("date", start)
        .lt("date", end)
        .or("fixed_expense_id.not.is.null,employee_id.not.is.null"),
    ]);

  const paidFixedIds = new Set<string>();
  const paidEmployeeIds = new Set<string>();
  let paidThisMonth = 0;
  for (const t of monthTx || []) {
    if (t.fixed_expense_id) {
      paidFixedIds.add(t.fixed_expense_id);
      paidThisMonth += Number(t.amount);
    } else if (t.employee_id) {
      paidEmployeeIds.add(t.employee_id);
      paidThisMonth += Number(t.amount);
    }
  }

  const activeFixed = (fixedExpenses || []).filter((f) => f.is_active);
  const totalFixed =
    activeFixed.reduce((s, f) => s + Number(f.amount), 0) +
    (employees || []).reduce((s, e) => s + Number(e.monthly_salary), 0);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Fixed Expenses</h1>
        <LinkButton href="/dashboard/fixed-expenses/new">Add fixed expense</LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total fixed monthly</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPKR(totalFixed)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatPKR(paidThisMonth)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Remaining this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">
              {formatPKR(Math.max(totalFixed - paidThisMonth, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Table>
        <THead>
          <Tr>
            <Th>Name</Th>
            <Th>Category</Th>
            <Th className="text-right">Amount</Th>
            <Th>This month</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {(employees || []).map((e) => {
            const paid = paidEmployeeIds.has(e.id);
            return (
              <Tr key={`employee-${e.id}`}>
                <Td className="font-medium text-slate-900">{e.name}</Td>
                <Td>Salary</Td>
                <Td className="text-right">{formatPKR(Number(e.monthly_salary))}</Td>
                <Td>
                  <Badge tone={paid ? "green" : "yellow"}>{paid ? "Paid" : "Not yet paid"}</Badge>
                </Td>
                <Td className="text-right">
                  <LinkButton href={`/dashboard/employees/${e.id}`} variant="ghost" size="sm">
                    Pay via Employees
                  </LinkButton>
                </Td>
              </Tr>
            );
          })}
          {(fixedExpenses || []).map((f) => {
            const paid = paidFixedIds.has(f.id);
            return (
              <Tr key={f.id} className={!f.is_active ? "opacity-50" : ""}>
                <Td className="font-medium text-slate-900">{f.name}</Td>
                <Td>{f.category}</Td>
                <Td className="text-right">{formatPKR(Number(f.amount))}</Td>
                <Td>
                  {!f.is_active ? (
                    <Badge tone="slate">Inactive</Badge>
                  ) : (
                    <Badge tone={paid ? "green" : "yellow"}>{paid ? "Paid" : "Not yet paid"}</Badge>
                  )}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-3">
                    {f.is_active && !paid && f.account_id && (
                      <form action={markFixedExpensePaid.bind(null, f.id)}>
                        <input type="hidden" name="amount" value={f.amount} />
                        <input type="hidden" name="account_id" value={f.account_id} />
                        <input type="hidden" name="date" value={today} />
                        <Button type="submit" variant="ghost" size="sm">
                          Mark paid
                        </Button>
                      </form>
                    )}
                    {f.is_active && !paid && !f.account_id && (
                      <LinkButton
                        href={`/dashboard/fixed-expenses/${f.id}/edit`}
                        variant="ghost"
                        size="sm"
                      >
                        Set account to pay
                      </LinkButton>
                    )}
                    <LinkButton
                      href={`/dashboard/fixed-expenses/${f.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </LinkButton>
                    <form action={setFixedExpenseActive.bind(null, f.id, !f.is_active)}>
                      <Button type="submit" variant="ghost" size="sm">
                        {f.is_active ? "Archive" : "Unarchive"}
                      </Button>
                    </form>
                    <ConfirmDeleteForm
                      action={deleteFixedExpense.bind(null, f.id)}
                      confirmMessage={`Delete ${f.name}? Past payment transactions will stay in your records but will no longer be linked to this fixed expense. This cannot be undone.`}
                    />
                  </div>
                </Td>
              </Tr>
            );
          })}
          {(!fixedExpenses || fixedExpenses.length === 0) && (!employees || employees.length === 0) && (
            <Tr>
              <Td colSpan={5} className="text-center text-slate-400">
                No fixed expenses yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>

      {accounts && accounts.length === 0 && (
        <p className="text-sm text-slate-500">
          Add an account first so fixed expenses have somewhere to be paid from.
        </p>
      )}
    </div>
  );
}
