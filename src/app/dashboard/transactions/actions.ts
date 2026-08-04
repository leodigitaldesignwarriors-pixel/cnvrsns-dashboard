"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { TransactionType } from "@/lib/types";

export async function createTransaction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const clientId = String(formData.get("client_id") || "");
  const employeeId = String(formData.get("employee_id") || "");

  await supabase.from("transactions").insert({
    account_id: String(formData.get("account_id")),
    type: String(formData.get("type")) as TransactionType,
    amount: Number(formData.get("amount")),
    category: String(formData.get("category") || "") || null,
    description: String(formData.get("description") || "") || null,
    date: String(formData.get("date")),
    client_id: clientId || null,
    employee_id: employeeId || null,
    created_by: user?.id || null,
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/reports");
  redirect("/dashboard/transactions");
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  await supabase.from("transactions").delete().eq("id", id);
  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/reports");
}
