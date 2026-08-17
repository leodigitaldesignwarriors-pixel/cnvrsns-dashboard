"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function assertPartner(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = user
    ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data
    : null;
  if (profile?.role !== "partner") redirect("/portal");
}

function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function inviteEmployeePortalAccess(employeeId: string, formData: FormData) {
  const supabase = await createClient();
  await assertPartner(supabase);

  const email = String(formData.get("email") || "").trim();
  if (!email) {
    redirect(`/dashboard/employees/${employeeId}?invite_error=${encodeURIComponent("Email is required")}`);
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${getSiteUrl()}/set-password`,
  });

  if (error || !data.user) {
    redirect(
      `/dashboard/employees/${employeeId}?invite_error=${encodeURIComponent(error?.message || "Invite failed")}`,
    );
  }

  await supabase.from("profiles").update({ employee_id: employeeId, role: "employee" }).eq("id", data.user.id);
  await supabase.from("employees").update({ user_id: data.user.id }).eq("id", employeeId);

  revalidatePath(`/dashboard/employees/${employeeId}`);
  revalidatePath("/dashboard/employees");
  redirect(`/dashboard/employees/${employeeId}`);
}

export async function revokeEmployeePortalAccess(employeeId: string, userId: string) {
  const supabase = await createClient();
  await assertPartner(supabase);

  await supabase.from("employees").update({ user_id: null }).eq("id", employeeId);
  await supabase.from("profiles").update({ employee_id: null }).eq("id", userId);

  revalidatePath(`/dashboard/employees/${employeeId}`);
  revalidatePath("/dashboard/employees");
}
