import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatUSD, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { InvoiceStatus } from "@/lib/types";

const statusTone = {
  unpaid: "red",
  partial: "yellow",
  paid: "green",
} as const;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("invoices")
    .select("*, clients(name)")
    .order("issued_date", { ascending: false });

  if (status === "unpaid" || status === "partial" || status === "paid") {
    query = query.eq("status", status as InvoiceStatus);
  }

  const { data: invoices } = await query;

  const tabs = [
    { key: "", label: "All" },
    { key: "unpaid", label: "Unpaid" },
    { key: "partial", label: "Partial" },
    { key: "paid", label: "Paid" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <LinkButton href="/dashboard/invoices/new">Create invoice</LinkButton>
      </div>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <a
            key={tab.key}
            href={tab.key ? `/dashboard/invoices?status=${tab.key}` : "/dashboard/invoices"}
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
            <Th>Invoice</Th>
            <Th>Client</Th>
            <Th>Due</Th>
            <Th>Status</Th>
            <Th className="text-right">Amount</Th>
            <Th className="text-right">Outstanding</Th>
          </Tr>
        </THead>
        <TBody>
          {(invoices || []).map((inv) => (
            <Tr key={inv.id}>
              <Td>
                <a
                  href={`/dashboard/invoices/${inv.id}`}
                  className="font-medium text-slate-900 underline"
                >
                  {inv.invoice_number || inv.id.slice(0, 8)}
                </a>
              </Td>
              <Td>{(inv.clients as { name: string } | null)?.name}</Td>
              <Td>{formatDate(inv.due_date)}</Td>
              <Td>
                <Badge tone={statusTone[inv.status as InvoiceStatus]}>{inv.status}</Badge>
              </Td>
              <Td className="text-right">{formatUSD(Number(inv.amount))}</Td>
              <Td className="text-right">
                {formatUSD(Number(inv.amount) - Number(inv.paid_amount))}
              </Td>
            </Tr>
          ))}
          {(!invoices || invoices.length === 0) && (
            <Tr>
              <Td colSpan={6} className="text-center text-slate-400">
                No invoices yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
