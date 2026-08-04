"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AccountType } from "@/lib/types";

function readAccountForm(formData: FormData) {
  const safetyRaw = formData.get("safety_minimum");
  return {
    name: String(formData.get("name") || ""),
    type: String(formData.get("type") || "other") as AccountType,
    opening_balance: Number(formData.get("opening_balance") || 0),
    safety_minimum: safetyRaw && String(safetyRaw).length > 0 ? Number(safetyRaw) : null,
    notes: String(formData.get("notes") || "") || null,
  };
}

export async function createAccount(formData: FormData) {
  const supabase = await createClient();
  const values = readAccountForm(formData);
  await supabase.from("accounts").insert(values);
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  redirect("/dashboard/accounts");
}

export async function updateAccount(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readAccountForm(formData);
  await supabase.from("accounts").update(values).eq("id", id);
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
  redirect("/dashboard/accounts");
}

export async function setAccountArchived(id: string, archived: boolean) {
  const supabase = await createClient();
  await supabase.from("accounts").update({ is_archived: archived }).eq("id", id);
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
}
