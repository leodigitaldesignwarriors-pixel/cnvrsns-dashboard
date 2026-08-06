import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatPKR, formatMonthLabel, currentMonthKey } from "@/lib/format";
import { computeMonthlyLedger } from "@/lib/finance";
import { getLedgerInputsForMonth } from "@/lib/ledger-queries";
import { closeMonth } from "./actions";

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; error?: string }>;
}) {
  const { month, error } = await searchParams;
  const monthKey = month || currentMonthKey();

  const supabase = await createClient();

  const [{ data: closedLedger }, { data: history }, { income, businessExpenses, businessAccountId }] =
    await Promise.all([
      supabase.from("monthly_ledger").select("*").eq("month", monthKey).maybeSingle(),
      supabase.from("monthly_ledger").select("*").order("month", { ascending: false }),
      getLedgerInputsForMonth(supabase, monthKey),
    ]);

  const live = computeMonthlyLedger({ income, businessExpenses });
  const isClosed = !!closedLedger;
  const display = isClosed
    ? {
        income: Number(closedLedger.income),
        businessExpenses: Number(closedLedger.business_expenses),
        netAmount: Number(closedLedger.net_amount),
        savingsCut: Number(closedLedger.savings_cut),
        profitTotal: Number(closedLedger.profit_total),
        partnerAProfit: Number(closedLedger.partner_a_profit),
        partnerBProfit: Number(closedLedger.partner_b_profit),
      }
    : { income, businessExpenses, ...live };

  const closeThisMonth = closeMonth.bind(null, monthKey);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Monthly Ledger</h1>
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

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-slate-500">{formatMonthLabel(monthKey)}</p>
        <Badge tone={isClosed ? "green" : "yellow"}>
          {isClosed ? "Closed" : "Live preview — not yet closed"}
        </Badge>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
          {error}
        </p>
      )}

      {!businessAccountId && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          Add a Business account to start tracking the monthly ledger.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600">{formatPKR(display.income)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Business expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-red-600">
              {formatPKR(display.businessExpenses)}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              All fixed expenses + salaries, whether paid yet or not
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-xl font-semibold ${display.netAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatPKR(display.netAmount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Savings cut (30%)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatPKR(display.savingsCut)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profit total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatPKR(display.profitTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Partner A / Partner B</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatPKR(display.partnerAProfit)} / {formatPKR(display.partnerBProfit)}
            </p>
          </CardContent>
        </Card>
      </div>

      {!isClosed && businessAccountId && (
        <Card>
          <CardHeader>
            <CardTitle>Close this month</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-slate-500">
              This locks in the numbers above, deposits the 30% savings cut into your Savings
              account, and sets both partners&apos; profit cards for {formatMonthLabel(monthKey)}.
              A month can only be closed once.
            </p>
            <form action={closeThisMonth}>
              <Button type="submit">Close {formatMonthLabel(monthKey)}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Closed months</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Month</Th>
              <Th className="text-right">Income</Th>
              <Th className="text-right">Expenses</Th>
              <Th className="text-right">Savings</Th>
              <Th className="text-right">Partner A</Th>
              <Th className="text-right">Partner B</Th>
            </Tr>
          </THead>
          <TBody>
            {(history || []).map((row) => (
              <Tr key={row.id}>
                <Td>
                  <a
                    href={`/dashboard/ledger?month=${row.month}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {formatMonthLabel(row.month)}
                  </a>
                </Td>
                <Td className="text-right text-emerald-600">
                  {formatPKR(Number(row.income))}
                </Td>
                <Td className="text-right text-red-600">
                  {formatPKR(Number(row.business_expenses))}
                </Td>
                <Td className="text-right">{formatPKR(Number(row.savings_cut))}</Td>
                <Td className="text-right">{formatPKR(Number(row.partner_a_profit))}</Td>
                <Td className="text-right">{formatPKR(Number(row.partner_b_profit))}</Td>
              </Tr>
            ))}
            {(!history || history.length === 0) && (
              <Tr>
                <Td colSpan={6} className="text-center text-slate-400">
                  No months closed yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
