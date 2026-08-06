import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { cn } from "@/lib/utils";
import { formatUSD, formatDate } from "@/lib/format";
import { getDeadlineStatus } from "@/lib/client-status";
import { deleteClient } from "./actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("clients").select("*").order("name");
  if (status === "active" || status === "past") {
    query = query.eq("status", status);
  }
  const [{ data: clients }, { data: invoices }] = await Promise.all([
    query,
    supabase.from("invoices").select("client_id, amount, paid_amount"),
  ]);

  const outstandingByClient = new Map<string, number>();
  for (const inv of invoices || []) {
    const current = outstandingByClient.get(inv.client_id) || 0;
    outstandingByClient.set(
      inv.client_id,
      current + (Number(inv.amount) - Number(inv.paid_amount)),
    );
  }

  const tabs = [
    { key: "", label: "All" },
    { key: "active", label: "Active" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <LinkButton href="/dashboard/clients/new">Add client</LinkButton>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.key ? `/dashboard/clients?status=${tab.key}` : "/dashboard/clients"}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium",
              (status || "") === tab.key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {tab.label}
          </a>
        ))}
      </div>

      <Table>
        <THead>
          <Tr>
            <Th>Name</Th>
            <Th>Company</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
            <Th>Deadline</Th>
            <Th className="text-right">Outstanding</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {(clients || []).map((c) => {
            const outstanding = outstandingByClient.get(c.id) || 0;
            const deadlineStatus = getDeadlineStatus(c.deadline);
            return (
              <Tr key={c.id}>
                <Td>
                  <a
                    href={`/dashboard/clients/${c.id}`}
                    className="font-medium text-slate-900 underline"
                  >
                    {c.name}
                  </a>
                </Td>
                <Td>{c.company || "—"}</Td>
                <Td>{c.contact_email || c.contact_phone || "—"}</Td>
                <Td>
                  <Badge tone={c.status === "active" ? "green" : "slate"}>
                    {c.status === "active" ? "Active" : "Past"}
                  </Badge>
                </Td>
                <Td>
                  {c.deadline ? (
                    <div className="flex items-center gap-2">
                      <span>{formatDate(c.deadline)}</span>
                      {deadlineStatus && (
                        <Badge tone={deadlineStatus.tone}>{deadlineStatus.label}</Badge>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </Td>
                <Td className={cn("text-right", outstanding > 0 && "text-red-600 font-medium")}>
                  {outstanding > 0 ? formatUSD(outstanding) : "—"}
                </Td>
                <Td className="text-right">
                  <ConfirmDeleteForm
                    action={deleteClient.bind(null, c.id)}
                    confirmMessage={`Delete ${c.name}? This also permanently deletes all of their invoices and payment history. This cannot be undone.`}
                  />
                </Td>
              </Tr>
            );
          })}
          {(!clients || clients.length === 0) && (
            <Tr>
              <Td colSpan={7} className="text-center text-slate-400">
                No clients yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
