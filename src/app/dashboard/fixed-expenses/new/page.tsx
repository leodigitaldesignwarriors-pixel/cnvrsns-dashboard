import { createClient } from "@/lib/supabase/server";
import { FixedExpenseForm } from "../fixed-expense-form";
import { createFixedExpense } from "../actions";

export default async function NewFixedExpensePage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id, name")
    .eq("is_archived", false)
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add fixed expense</h1>
      <FixedExpenseForm action={createFixedExpense} accounts={accounts || []} />
    </div>
  );
}
