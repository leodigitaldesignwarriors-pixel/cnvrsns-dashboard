import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { getAccountStatus } from "@/lib/account-status";
import { formatPKR, formatUSD, formatDate, formatMonthLabel } from "@/lib/format";
import { MonthlyChart } from "@/components/monthly-chart";
import { LinkButton } from "@/components/ui/button";
import { AccountBalance } from "@/lib/types";
import { projectUpcomingSplit } from "@/lib/finance";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: accounts }, { data: recentTx }, { data: dueInvoices }, { data: outstandingInvoices }] =
    await Promise.all([
      supabase
        .from("account_balances")
        .select("*")
        .eq("is_archived", false)
        .order("name"),
      supabase
        .from("transactions")
        .select("*, accounts(name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("invoices")
        .select("*, clients(name)")
        .neq("status", "paid")
        .order("due_date", { ascending: true })
        .limit(5),
      supabase.from("invoices").select("amount, paid_amount, status").neq("status", "paid"),
    ]);

  const upcomingSplit = projectUpcomingSplit(outstandingInvoices || []);
  const upcomingByType: Record<string, number> = {
    business: upcomingSplit.business,
    personal: upcomingSplit.personal,
    savings: upcomingSplit.savings,
  };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  const { data: recentPeriodTx } = await supabase
    .from("transactions")
    .select("date, type, amount, accounts(type)")
    .gte("date", sixMonthsAgo.toISOString().slice(0, 10));

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, { income: 0, expense: 0 });
  }
  for (const t of recentPeriodTx || []) {
    const key = t.date.slice(0, 7);
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    if (t.type === "income") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }
  const chartData = Array.from(monthlyMap.entries()).map(([key, v]) => ({
    month: formatMonthLabel(key).split(" ")[0],
    ...v,
  }));

  const totalBalance = (accounts || []).reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );
  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const thisMonth = monthlyMap.get(thisMonthKey) || { income: 0, expense: 0 };

  // Profit excludes the personal account — those are personal expenses,
  // not business ones, so they shouldn't count toward business profit.
  const thisMonthProfit = (recentPeriodTx || [])
    .filter(
      (t) =>
        t.date.slice(0, 7) === thisMonthKey &&
        (t.accounts as unknown as { type: string } | null)?.type !== "personal",
    )
    .reduce(
      (sum, t) => sum + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
      0,
    );

  const [monthYear, monthNum] = thisMonthKey.split("-").map(Number);
  const monthStart = `${thisMonthKey}-01`;
  const monthEnd = new Date(monthYear, monthNum, 1).toISOString().slice(0, 10);

  const [{ data: fixedExpenses }, { data: activeEmployees }, { data: fixedMonthTx }] =
    await Promise.all([
      supabase.from("fixed_expenses").select("amount").eq("is_active", true),
      supabase.from("employees").select("monthly_salary").eq("status", "active"),
      supabase
        .from("transactions")
        .select("amount, fixed_expense_id, employee_id")
        .eq("type", "expense")
        .gte("date", monthStart)
        .lt("date", monthEnd)
        .or("fixed_expense_id.not.is.null,employee_id.not.is.null"),
    ]);

  const totalFixedCosts =
    (fixedExpenses || []).reduce((s, f) => s + Number(f.amount), 0) +
    (activeEmployees || []).reduce((s, e) => s + Number(e.monthly_salary), 0);
  const paidFixedCosts = (fixedMonthTx || []).reduce((s, t) => s + Number(t.amount), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(accounts || []).map((account) => {
          const status = getAccountStatus(account as AccountBalance);
          const upcoming = upcomingByType[account.type];
          return (
            <Card key={account.id}>
              <CardHeader>
                <CardTitle>{account.name}</CardTitle>
                <Badge tone={status.tone}>{status.label}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {formatPKR(Number(account.balance))}
                </p>
                {account.safety_minimum != null && (
                  <p className="mt-1 text-xs text-slate-500">
                    Minimum: {formatPKR(Number(account.safety_minimum))}
                  </p>
                )}
                {upcoming > 0 && (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    + {formatPKR(upcoming)} upcoming
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-slate-900/10 bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-300">Total balance</CardTitle>
            <Badge tone={totalBalance >= 0 ? "green" : "red"}>
              {totalBalance >= 0 ? "Total Positive" : "Total Negative"}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-white">
              {formatPKR(totalBalance)}
            </p>
            {upcomingSplit.business + upcomingSplit.personal + upcomingSplit.savings > 0 && (
              <p className="mt-1 text-xs font-medium text-emerald-400">
                +{" "}
                {formatPKR(
                  upcomingSplit.business + upcomingSplit.personal + upcomingSplit.savings,
                )}{" "}
                upcoming
              </p>
            )}
          </CardContent>
        </Card>
        {(!accounts || accounts.length === 0) && (
          <p className="col-span-full text-sm text-slate-500">
            No accounts yet.{" "}
            <a href="/dashboard/accounts/new" className="underline">
              Add your first account
            </a>
            .
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>This month&apos;s income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatPKR(thisMonth.income)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>This month&apos;s expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">
              {formatPKR(thisMonth.expense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${thisMonthProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatPKR(thisMonthProfit)}
            </p>
            <p className="mt-1 text-xs text-slate-500">Excludes personal account</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fixed monthly costs</CardTitle>
          <LinkButton href="/dashboard/fixed-expenses" variant="ghost" size="sm">
            Manage
          </LinkButton>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-2xl font-semibold text-emerald-600">
              {formatPKR(paidFixedCosts)}
            </span>
            <span className="text-slate-400">/</span>
            <span className="text-lg text-slate-500">{formatPKR(totalFixedCosts)} paid so far</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${totalFixedCosts > 0 ? Math.min((paidFixedCosts / totalFixedCosts) * 100, 100) : 0}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Income vs. expenses (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Recent transactions</h2>
            <LinkButton href="/dashboard/transactions" variant="ghost" size="sm">
              View all
            </LinkButton>
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>Date</Th>
                <Th>Account</Th>
                <Th>Description</Th>
                <Th className="text-right">Amount</Th>
              </Tr>
            </THead>
            <TBody>
              {(recentTx || []).map((t) => (
                <Tr key={t.id}>
                  <Td>{formatDate(t.date)}</Td>
                  <Td>{(t.accounts as { name: string } | null)?.name}</Td>
                  <Td>{t.description || t.category || "—"}</Td>
                  <Td
                    className={`text-right font-medium ${
                      t.type === "income" ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatPKR(Number(t.amount))}
                  </Td>
                </Tr>
              ))}
              {(!recentTx || recentTx.length === 0) && (
                <Tr>
                  <Td colSpan={4} className="text-center text-slate-400">
                    No transactions yet.
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-medium">Invoices due</h2>
            <LinkButton href="/dashboard/invoices" variant="ghost" size="sm">
              View all
            </LinkButton>
          </div>
          <Table>
            <THead>
              <Tr>
                <Th>Client</Th>
                <Th>Due</Th>
                <Th className="text-right">Outstanding</Th>
              </Tr>
            </THead>
            <TBody>
              {(dueInvoices || []).map((inv) => (
                <Tr key={inv.id}>
                  <Td>{(inv.clients as { name: string } | null)?.name}</Td>
                  <Td>{formatDate(inv.due_date)}</Td>
                  <Td className="text-right">
                    {formatUSD(Number(inv.amount) - Number(inv.paid_amount))}
                  </Td>
                </Tr>
              ))}
              {(!dueInvoices || dueInvoices.length === 0) && (
                <Tr>
                  <Td colSpan={3} className="text-center text-slate-400">
                    Nothing outstanding.
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
