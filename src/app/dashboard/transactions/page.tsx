import { createClient } from "@/lib/supabase/server";
import { Button, LinkButton } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatPKR, formatDate } from "@/lib/format";
import { deleteTransaction } from "./actions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string; type?: string; month?: string }>;
}) {
  const { account, type, month } = await searchParams;
  const supabase = await createClient();

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name")
    .order("name");

  let query = supabase
    .from("transactions")
    .select("*, accounts(name)")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (account) query = query.eq("account_id", account);
  if (type) query = query.eq("type", type);
  if (month) {
    const start = `${month}-01`;
    const [y, m] = month.split("-").map(Number);
    const end = new Date(y, m, 1).toISOString().slice(0, 10);
    query = query.gte("date", start).lt("date", end);
  }

  const { data: transactions } = await query.limit(200);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <LinkButton href="/dashboard/transactions/new">Add transaction</LinkButton>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <Select name="account" defaultValue={account || ""} className="w-auto">
          <option value="">All accounts</option>
          {(accounts || []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
        <Select name="type" defaultValue={type || ""} className="w-auto">
          <option value="">Income & expense</option>
          <option value="income">Income only</option>
          <option value="expense">Expense only</option>
        </Select>
        <input
          type="month"
          name="month"
          defaultValue={month || ""}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
        />
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
        {(account || type || month) && (
          <LinkButton href="/dashboard/transactions" variant="ghost" size="sm">
            Clear
          </LinkButton>
        )}
      </form>

      <Table>
        <THead>
          <Tr>
            <Th>Date</Th>
            <Th>Account</Th>
            <Th>Category</Th>
            <Th>Description</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {(transactions || []).map((t) => (
            <Tr key={t.id}>
              <Td>{formatDate(t.date)}</Td>
              <Td>{(t.accounts as { name: string } | null)?.name}</Td>
              <Td>{t.category || "—"}</Td>
              <Td>{t.description || "—"}</Td>
              <Td
                className={`text-right font-medium ${
                  t.type === "income" ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {formatPKR(Number(t.amount))}
              </Td>
              <Td className="text-right">
                <form action={deleteTransaction.bind(null, t.id)}>
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
                  </Button>
                </form>
              </Td>
            </Tr>
          ))}
          {(!transactions || transactions.length === 0) && (
            <Tr>
              <Td colSpan={6} className="text-center text-slate-400">
                No transactions match these filters.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
