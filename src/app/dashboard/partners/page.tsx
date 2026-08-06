import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatPKR, formatDate, currentMonthKey, formatMonthLabel } from "@/lib/format";
import { getCurrentMonthProfitAllocation } from "@/lib/ledger-queries";
import { PartnerTransaction } from "@/lib/types";
import { logPartnerTransaction } from "./actions";

function PartnerHistoryTable({ rows }: { rows: PartnerTransaction[] }) {
  return (
    <Table>
      <THead>
        <Tr>
          <Th>Date</Th>
          <Th>Note</Th>
          <Th className="text-right">Amount</Th>
        </Tr>
      </THead>
      <TBody>
        {rows.map((t) => (
          <Tr key={t.id}>
            <Td>{formatDate(t.date)}</Td>
            <Td>{t.note || "—"}</Td>
            <Td className="text-right text-red-600">{formatPKR(Number(t.amount))}</Td>
          </Tr>
        ))}
        {rows.length === 0 && (
          <Tr>
            <Td colSpan={3} className="text-center text-slate-400">
              No withdrawals this month.
            </Td>
          </Tr>
        )}
      </TBody>
    </Table>
  );
}

export default async function PartnersPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const filterMonth = month || currentMonthKey();
  const supabase = await createClient();

  const [
    { monthKey, partnerAProfit, partnerBProfit, isClosed },
    { data: transactionsA },
    { data: transactionsB },
  ] = await Promise.all([
    getCurrentMonthProfitAllocation(supabase),
    supabase
      .from("partner_transactions")
      .select("*")
      .eq("partner", "a")
      .order("date", { ascending: false }),
    supabase
      .from("partner_transactions")
      .select("*")
      .eq("partner", "b")
      .order("date", { ascending: false }),
  ]);

  const thisMonthWithdrawalsA = (transactionsA || [])
    .filter((t) => t.date.slice(0, 7) === monthKey)
    .reduce((s, t) => s + Number(t.amount), 0);
  const thisMonthWithdrawalsB = (transactionsB || [])
    .filter((t) => t.date.slice(0, 7) === monthKey)
    .reduce((s, t) => s + Number(t.amount), 0);

  const balanceA = partnerAProfit - thisMonthWithdrawalsA;
  const balanceB = partnerBProfit - thisMonthWithdrawalsB;

  const filteredA = (transactionsA || []).filter((t) => t.date.slice(0, 7) === filterMonth);
  const filteredB = (transactionsB || []).filter((t) => t.date.slice(0, 7) === filterMonth);

  const today = new Date().toISOString().slice(0, 10);
  const logA = logPartnerTransaction.bind(null, "a");
  const logB = logPartnerTransaction.bind(null, "b");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Partners</h1>
        <p className="mt-1 text-slate-500">
          {formatMonthLabel(monthKey)} profit{" "}
          {isClosed ? "(closed)" : "(live preview — not yet closed)"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Partner A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p
              className={`text-2xl font-semibold ${balanceA >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatPKR(balanceA)}
            </p>
            <form action={logA} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (PKR)" htmlFor="amount-a">
                  <Input id="amount-a" name="amount" type="number" step="0.01" min="0.01" required />
                </Field>
                <Field label="Date" htmlFor="date-a">
                  <Input id="date-a" name="date" type="date" defaultValue={today} required />
                </Field>
              </div>
              <Field label="Note (optional)" htmlFor="note-a">
                <Textarea id="note-a" name="note" rows={2} />
              </Field>
              <Button type="submit" size="sm">
                Log withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partner B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p
              className={`text-2xl font-semibold ${balanceB >= 0 ? "text-emerald-600" : "text-red-600"}`}
            >
              {formatPKR(balanceB)}
            </p>
            <form action={logB} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Amount (PKR)" htmlFor="amount-b">
                  <Input id="amount-b" name="amount" type="number" step="0.01" min="0.01" required />
                </Field>
                <Field label="Date" htmlFor="date-b">
                  <Input id="date-b" name="date" type="date" defaultValue={today} required />
                </Field>
              </div>
              <Field label="Note (optional)" htmlFor="note-b">
                <Textarea id="note-b" name="note" rows={2} />
              </Field>
              <Button type="submit" size="sm">
                Log withdrawal
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">Withdrawal history</h2>
        <form method="get" className="flex items-center gap-2">
          <input
            type="month"
            name="month"
            defaultValue={filterMonth}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
          />
          <button
            type="submit"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-600">Partner A</h3>
          <PartnerHistoryTable rows={filteredA} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-600">Partner B</h3>
          <PartnerHistoryTable rows={filteredB} />
        </div>
      </div>
    </div>
  );
}
