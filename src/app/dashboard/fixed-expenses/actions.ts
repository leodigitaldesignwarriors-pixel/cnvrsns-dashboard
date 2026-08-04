"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function readFixedExpenseForm(formData: FormData) {
  const accountId = String(formData.get("account_id") || "");
  return {
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || "Other expense"),
    amount: Number(formData.get("amount") || 0),
    account_id: accountId || null,
  };
}

export async function createFixedExpense(formData: FormData) {
  const supabase = await createClient();
  const values = readFixedExpenseForm(formData);
  await supabase.from("fixed_expenses").insert(values);
  revalidatePath("/dashboard/fixed-expenses");
  revalidatePath("/dashboard");
  redirect("/dashboard/fixed-expenses");
}

export async function updateFixedExpense(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readFixedExpenseForm(formData);
  await supabase.from("fixed_expenses").update(values).eq("id", id);
  revalidatePath("/dashboard/fixed-expenses");
  revalidatePath("/dashboard");
  redirect("/dashboard/fixed-expenses");
}

export async function setFixedExpenseActive(id: string, active: boolean) {
  const supabase = await createClient();
  await supabase.from("fixed_expenses").update({ is_active: active }).eq("id", id);
  revalidatePath("/dashboard/fixed-expenses");
  revalidatePath("/dashboard");
}

export async function deleteFixedExpense(id: string) {
  const supabase = await createClient();
  await supabase.from("fixed_expenses").delete().eq("id", id);
  revalidatePath("/dashboard/fixed-expenses");
  revalidatePath("/dashboard");
  redirect("/dashboard/fixed-expenses");
}

export async function markFixedExpensePaid(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: fixedExpense } = await supabase
    .from("fixed_expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (!fixedExpense) redirect("/dashboard/fixed-expenses");

  const amount = Number(formData.get("amount") || 0);
  const accountId = String(formData.get("account_id"));
  const date = String(formData.get("date"));

  if (amount > 0 && accountId) {
    await supabase.from("transactions").insert({
      account_id: accountId,
      type: "expense",
      amount,
      category: fixedExpense.category,
      description: fixedExpense.name,
      date,
      fixed_expense_id: id,
      created_by: user?.id || null,
    });
  }

  revalidatePath("/dashboard/fixed-expenses");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard/reports");
}
