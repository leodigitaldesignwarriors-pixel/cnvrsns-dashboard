import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "../login/actions";

const navItems = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/accounts", label: "Accounts" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/invoices", label: "Invoices" },
  { href: "/dashboard/employees", label: "Employees" },
  { href: "/dashboard/fixed-expenses", label: "Fixed Expenses" },
  { href: "/dashboard/reports", label: "Reports" },
];

export default async function DashboardLayout({
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
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "partner") redirect("/portal");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 sm:flex">
        <div className="mb-8 px-2 text-lg font-semibold">Finance</div>
        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 pt-4">
          <p className="mb-2 truncate px-2 text-xs text-slate-500">
            {profile?.full_name || user.email}
          </p>
          <form action={signOut}>
            <button className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">Finance</span>
            <form action={signOut}>
              <button className="text-sm text-slate-600">Sign out</button>
            </form>
          </div>
          <nav className="flex gap-3 overflow-x-auto text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 whitespace-nowrap text-slate-600 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
