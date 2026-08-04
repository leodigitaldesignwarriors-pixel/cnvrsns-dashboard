import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FixedExpenseForm } from "../../fixed-expense-form";
import { updateFixedExpense } from "../../actions";

export default async function EditFixedExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: fixedExpense }, { data: accounts }] = await Promise.all([
    supabase.from("fixed_expenses").select("*").eq("id", id).single(),
    supabase.from("accounts").select("id, name").eq("is_archived", false).order("name"),
  ]);

  if (!fixedExpense) notFound();

  const updateWithId = updateFixedExpense.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit fixed expense</h1>
      <FixedExpenseForm
        action={updateWithId}
        fixedExpense={fixedExpense}
        accounts={accounts || []}
      />
    </div>
  );
}
