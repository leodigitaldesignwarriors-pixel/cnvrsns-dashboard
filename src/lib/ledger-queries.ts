import type { createClient } from "./supabase/server";
import { computeMonthlyLedger } from "./finance";
import { currentMonthKey } from "./format";

// Business expenses for the ledger formula = every active fixed expense +
// every active employee's salary, at their FULL configured amount —
// regardless of whether "Mark paid" / "Pay salary" has actually been
// clicked yet this month — plus any other one-off expense transaction on
// the Business account that isn't linked to a fixed expense or employee
// (avoiding double-counting the ones that are).
export async function getLedgerInputsForMonth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  monthKey: string,
) {
  const [year, m] = monthKey.split("-").map(Number);
  const start = `${monthKey}-01`;
  const end = new Date(year, m, 1).toISOString().slice(0, 10);

  const [{ data: accounts }, { data: fixedExpenses }, { data: activeEmployees }] =
    await Promise.all([
      supabase.from("accounts").select("id, type").eq("is_archived", false),
      supabase.from("fixed_expenses").select("amount").eq("is_active", true),
      supabase.from("employees").select("monthly_salary").eq("status", "active"),
    ]);

  const businessAccount = accounts?.find((a) => a.type === "business");
  if (!businessAccount) {
    return { income: 0, businessExpenses: 0, businessAccountId: null as string | null };
  }

  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, fixed_expense_id, employee_id")
    .eq("account_id", businessAccount.id)
    .gte("date", start)
    .lt("date", end);

  const income = (transactions || [])
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);

  const adHocExpenses = (transactions || [])
    .filter((t) => t.type === "expense" && !t.fixed_expense_id && !t.employee_id)
    .reduce((s, t) => s + Number(t.amount), 0);

  const fixedObligations =
    (fixedExpenses || []).reduce((s, f) => s + Number(f.amount), 0) +
    (activeEmployees || []).reduce((s, e) => s + Number(e.monthly_salary), 0);

  const businessExpenses = adHocExpenses + fixedObligations;

  return { income, businessExpenses, businessAccountId: businessAccount.id };
}

// Current month's partner profit + savings allocation: the closed ledger
// row if the month has already been closed, otherwise a live preview
// computed from this month's inputs so far.
export async function getCurrentMonthProfitAllocation(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const monthKey = currentMonthKey();

  const { data: closedLedger } = await supabase
    .from("monthly_ledger")
    .select("partner_a_profit, partner_b_profit, savings_cut")
    .eq("month", monthKey)
    .maybeSingle();

  if (closedLedger) {
    return {
      monthKey,
      partnerAProfit: Number(closedLedger.partner_a_profit),
      partnerBProfit: Number(closedLedger.partner_b_profit),
      savingsCut: Number(closedLedger.savings_cut),
      isClosed: true,
    };
  }

  const { income, businessExpenses } = await getLedgerInputsForMonth(supabase, monthKey);
  const { partnerAProfit, partnerBProfit, savingsCut } = computeMonthlyLedger({
    income,
    businessExpenses,
  });

  return { monthKey, partnerAProfit, partnerBProfit, savingsCut, isClosed: false };
}
