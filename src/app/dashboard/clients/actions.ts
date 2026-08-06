"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ClientStatus } from "@/lib/types";

function readClientForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    company: String(formData.get("company") || "") || null,
    contact_email: String(formData.get("contact_email") || "") || null,
    contact_phone: String(formData.get("contact_phone") || "") || null,
    status: String(formData.get("status") || "active") as ClientStatus,
    notes: String(formData.get("notes") || "") || null,
    start_date: String(formData.get("start_date") || "") || null,
    deadline: String(formData.get("deadline") || "") || null,
  };
}

export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const values = readClientForm(formData);
  const { data } = await supabase
    .from("clients")
    .insert(values)
    .select("id")
    .single();
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${data?.id}`);
}

export async function updateClientRecord(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readClientForm(formData);
  await supabase.from("clients").update(values).eq("id", id);
  revalidatePath("/dashboard/clients");
  revalidatePath(`/dashboard/clients/${id}`);
  redirect(`/dashboard/clients/${id}`);
}

export async function deleteClient(id: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", id);
  revalidatePath("/dashboard/clients");
  revalidatePath("/dashboard/invoices");
  revalidatePath("/dashboard");
  redirect("/dashboard/clients");
}
