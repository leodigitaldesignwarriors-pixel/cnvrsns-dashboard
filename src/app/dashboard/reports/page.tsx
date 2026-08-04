import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatPKR, formatMonthLabel, currentMonthKey } from "@/lib/format";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const monthKey = month || currentMonthKey();
  const [year, m] = monthKey.split("-").map(Number);
  const start = `${monthKey}-01`;
  const end = new Date(year, m, 1).toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, accounts(name, type)")
    .gte("date", start)
    .lt("date", end);

  const rows = transactions || [];
  const totalIncome = rows
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = rows
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);
  const net = totalIncome - totalExpense;

  // Profit excludes the personal account — those are personal expenses, not
  // business ones, so they shouldn't count toward business profit.
  const businessRows = rows.filter(
    (t) => (t.accounts as { type: string } | null)?.type !== "personal",
  );
  const profit = businessRows.reduce(
    (s, t) => s + (t.type === "income" ? Number(t.amount) : -Number(t.amount)),
    0,
  );

  const byCategory = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const key = t.category || "Uncategorized";
    const bucket = byCategory.get(key) || { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
    byCategory.set(key, bucket);
  }

  const byAccount = new Map<string, { income: number; expense: number }>();
  for (const t of rows) {
    const key = (t.accounts as { name: string } | null)?.name || "Unknown";
    const bucket = byAccount.get(key) || { income: 0, expense: 0 };
    if (t.type === "income") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
    byAccount.set(key, bucket);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <form method="get" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={monthKey}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            View
          </button>
        </form>
      </div>

      <p className="text-slate-500">{formatMonthLabel(monthKey)}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-emerald-600">
              {formatPKR(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-red-600">
              {formatPKR(totalExpense)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatPKR(net)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profit (excl. personal)</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-semibold ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatPKR(profit)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">By category</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Category</Th>
              <Th className="text-right">Income</Th>
              <Th className="text-right">Expense</Th>
            </Tr>
          </THead>
          <TBody>
            {Array.from(byCategory.entries()).map(([category, v]) => (
              <Tr key={category}>
                <Td>{category}</Td>
                <Td className="text-right text-emerald-600">
                  {v.income ? formatPKR(v.income) : "—"}
                </Td>
                <Td className="text-right text-red-600">
                  {v.expense ? formatPKR(v.expense) : "—"}
                </Td>
              </Tr>
            ))}
            {byCategory.size === 0 && (
              <Tr>
                <Td colSpan={3} className="text-center text-slate-400">
                  No transactions this month.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">By account</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Account</Th>
              <Th className="text-right">Income</Th>
              <Th className="text-right">Expense</Th>
              <Th className="text-right">Net movement</Th>
            </Tr>
          </THead>
          <TBody>
            {Array.from(byAccount.entries()).map(([account, v]) => (
              <Tr key={account}>
                <Td>{account}</Td>
                <Td className="text-right text-emerald-600">
                  {v.income ? formatPKR(v.income) : "—"}
                </Td>
                <Td className="text-right text-red-600">
                  {v.expense ? formatPKR(v.expense) : "—"}
                </Td>
                <Td className="text-right font-medium">
                  {formatPKR(v.income - v.expense)}
                </Td>
              </Tr>
            ))}
            {byAccount.size === 0 && (
              <Tr>
                <Td colSpan={4} className="text-center text-slate-400">
                  No transactions this month.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
