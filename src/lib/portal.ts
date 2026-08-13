import { createClient } from "@/lib/supabase/server";
import { Employee } from "@/lib/types";

export async function getPortalEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<Employee | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("employee_id")
    .eq("id", user.id)
    .single();
  if (!profile?.employee_id) return null;

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", profile.employee_id)
    .single();
  return employee;
}
