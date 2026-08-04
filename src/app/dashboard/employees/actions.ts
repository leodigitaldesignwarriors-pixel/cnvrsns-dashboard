"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { EmployeeStatus } from "@/lib/types";

function readEmployeeForm(formData: FormData) {
  return {
    name: String(formData.get("name") || ""),
    role_title: String(formData.get("role_title") || "") || null,
    monthly_salary: Number(formData.get("monthly_salary") || 0),
    start_date: String(formData.get("start_date")),
    status: String(formData.get("status") || "active") as EmployeeStatus,
  };
}

export async function createEmployee(formData: FormData) {
  const supabase = await createClient();
  const values = readEmployeeForm(formData);
  const { data } = await supabase
    .from("employees")
    .insert(values)
    .select("id")
    .single();
  revalidatePath("/dashboard/employees");
  redirect(`/dashboard/employees/${data?.id}`);
}

export async function updateEmployee(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readEmployeeForm(formData);
  await supabase.from("employees").update(values).eq("id", id);
  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${id}`);
  redirect(`/dashboard/employees/${id}`);
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  await supabase.from("employees").delete().eq("id", id);
  revalidatePath("/dashboard/employees");
  revalidatePath("/dashboard/fixed-expenses");
  revalidatePath("/dashboard");
  redirect("/dashboard/employees");
}

export async function paySalary(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const amount = Number(formData.get("amount") || 0);
  const accountId = String(formData.get("account_id"));
  const date = String(formData.get("date"));

  const { data: employee } = await supabase
    .from("employees")
    .select("name")
    .eq("id", id)
    .single();

  if (amount > 0 && accountId) {
    await supabase.from("transactions").insert({
      account_id: accountId,
      type: "expense",
      amount,
      category: "Salary",
      description: `Salary payment — ${employee?.name || "employee"}`,
      date,
      employee_id: id,
      created_by: user?.id || null,
    });
  }

  revalidatePath("/dashboard/employees");
  revalidatePath(`/dashboard/employees/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/transactions");
  redirect(`/dashboard/employees/${id}`);
}
