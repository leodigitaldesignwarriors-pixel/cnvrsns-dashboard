"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Partner } from "@/lib/types";

export async function logPartnerTransaction(partner: Partner, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const amount = Number(formData.get("amount") || 0);
  const date = String(formData.get("date"));
  const note = String(formData.get("note") || "") || null;

  if (amount > 0) {
    await supabase.from("partner_transactions").insert({
      partner,
      amount,
      date,
      note,
      created_by: user?.id || null,
    });
  }

  revalidatePath("/dashboard/partners");
  revalidatePath("/dashboard");
  redirect("/dashboard/partners");
}
