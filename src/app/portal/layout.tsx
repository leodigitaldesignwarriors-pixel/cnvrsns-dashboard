import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "../login/actions";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <span className="text-lg font-semibold">My Pay</span>
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-500 sm:inline">
            {profile?.full_name || user.email}
          </span>
          <form action={signOut}>
            <button className="text-sm text-slate-600 hover:text-slate-900">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
