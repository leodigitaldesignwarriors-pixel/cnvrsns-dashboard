"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { computeMonthlyLedger } from "@/lib/finance";
import { getLedgerInputsForMonth } from "@/lib/ledger-queries";

export async function closeMonth(month: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [year, m] = month.split("-").map(Number);

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, type")
    .eq("is_archived", false);

  const businessAccount = accounts?.find((a) => a.type === "business");
  const savingsAccount = accounts?.find((a) => a.type === "savings");

  if (!businessAccount || !savingsAccount) {
    redirect(
      `/dashboard/ledger?month=${month}&error=${encodeURIComponent(
        "Set up a Business and a Savings account before closing a month.",
      )}`,
    );
  }

  const { income, businessExpenses } = await getLedgerInputsForMonth(supabase, month);

  const { netAmount, savingsCut, profitTotal, partnerAProfit, partnerBProfit } =
    computeMonthlyLedger({ income, businessExpenses });

  const { error } = await supabase.from("monthly_ledger").insert({
    month,
    income,
    business_expenses: businessExpenses,
    net_amount: netAmount,
    savings_cut: savingsCut,
    profit_total: profitTotal,
    partner_a_profit: partnerAProfit,
    partner_b_profit: partnerBProfit,
    closed_by: user?.id || null,
  });

  if (error) {
    redirect(
      `/dashboard/ledger?month=${month}&error=${encodeURIComponent(
        error.code === "23505" ? "This month is already closed." : "Could not close the month.",
      )}`,
    );
  }

  if (savingsCut > 0) {
    const lastDay = new Date(year, m, 0).toISOString().slice(0, 10);
    await supabase.from("transactions").insert({
      account_id: savingsAccount!.id,
      type: "income",
      amount: savingsCut,
      category: "Savings cut",
      description: `Monthly savings — ${month}`,
      date: lastDay,
      created_by: user?.id || null,
    });
  }

  revalidatePath("/dashboard/ledger");
  revalidatePath("/dashboard/partners");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/reports");
  redirect(`/dashboard/ledger?month=${month}`);
}
