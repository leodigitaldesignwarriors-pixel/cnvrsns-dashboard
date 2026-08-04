import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatUSD, formatDate } from "@/lib/format";
import { InvoiceStatus } from "@/lib/types";

const statusTone = {
  unpaid: "red",
  partial: "yellow",
  paid: "green",
} as const;

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: invoices }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).single(),
    supabase
      .from("invoices")
      .select("*")
      .eq("client_id", id)
      .order("issued_date", { ascending: false }),
  ]);

  if (!client) notFound();

  const totalInvoiced = (invoices || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = (invoices || []).reduce((s, i) => s + Number(i.paid_amount), 0);
  const totalOutstanding = totalInvoiced - totalPaid;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <Badge tone={client.status === "active" ? "green" : "slate"}>
              {client.status === "active" ? "Active" : "Past"}
            </Badge>
          </div>
          {client.company && <p className="text-slate-500">{client.company}</p>}
          <p className="mt-1 text-sm text-slate-500">
            {client.contact_email} {client.contact_phone && `· ${client.contact_phone}`}
          </p>
        </div>
        <div className="flex gap-3">
          <LinkButton href={`/dashboard/clients/${id}/edit`} variant="secondary">
            Edit
          </LinkButton>
          <LinkButton href={`/dashboard/invoices/new?client=${id}`}>
            New invoice
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatUSD(totalInvoiced)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600">
              {formatUSD(totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-red-600">
              {formatUSD(totalOutstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      {client.notes && (
        <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">
          {client.notes}
        </p>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Invoices</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Invoice</Th>
              <Th>Issued</Th>
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
                <Td>{formatDate(inv.issued_date)}</Td>
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
    </div>
  );
}
