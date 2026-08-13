import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "../login/actions";

const navItems = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/time", label: "Time Clock" },
  { href: "/portal/tasks", label: "My Tasks" },
  { href: "/portal/logs", label: "Daily Log" },
  { href: "/portal/pay", label: "My Pay" },
];

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
      <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold">BoxBettter</span>
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
        </div>
        <nav className="flex gap-3 overflow-x-auto text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 p-4 sm:p-8">{children}</main>
    </div>
  );
}
