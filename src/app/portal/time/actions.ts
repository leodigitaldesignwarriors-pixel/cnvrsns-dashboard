"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getPortalEmployee } from "@/lib/portal";
import { todayKey } from "@/lib/hours";

export async function clockIn() {
  const supabase = await createClient();
  const employee = await getPortalEmployee(supabase);
  if (!employee) return;

  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("employee_id", employee.id)
    .is("clock_out", null)
    .maybeSingle();
  if (open) return;

  await supabase.from("time_entries").insert({
    employee_id: employee.id,
    work_date: todayKey(),
  });

  revalidatePath("/portal");
  revalidatePath("/portal/time");
}

export async function clockOut(formData: FormData) {
  const supabase = await createClient();
  const employee = await getPortalEmployee(supabase);
  if (!employee) return;

  const note = String(formData.get("note") || "") || null;

  const { data: open } = await supabase
    .from("time_entries")
    .select("id")
    .eq("employee_id", employee.id)
    .is("clock_out", null)
    .order("clock_in", { ascending: false })
    .maybeSingle();

  if (open) {
    await supabase
      .from("time_entries")
      .update({ clock_out: new Date().toISOString(), note })
      .eq("id", open.id);
  }

  revalidatePath("/portal");
  revalidatePath("/portal/time");
}
