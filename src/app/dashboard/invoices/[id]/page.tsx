import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { formatUSD, formatPKR, formatDate } from "@/lib/format";
import { InvoiceStatus } from "@/lib/types";
import { calculatePlatformFee, USD_TO_PKR_RATE } from "@/lib/finance";
import { recordInvoicePayment } from "../actions";

const statusTone = {
  unpaid: "red",
  partial: "yellow",
  paid: "green",
} as const;

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: invoice }, { data: accounts }, { data: payments }] =
    await Promise.all([
      supabase.from("invoices").select("*, clients(id, name)").eq("id", id).single(),
      supabase.from("accounts").select("id, type").eq("is_archived", false),
      supabase
        .from("transactions")
        .select("*")
        .eq("invoice_id", id)
        .order("date", { ascending: false }),
    ]);

  if (!invoice) notFound();

  const client = invoice.clients as { id: string; name: string } | null;
  const outstanding = Number(invoice.amount) - Number(invoice.paid_amount);
  const today = new Date().toISOString().slice(0, 10);
  const recordPayment = recordInvoicePayment.bind(null, id);
  const estimatedFee = calculatePlatformFee(outstanding);

  const hasBusiness = (accounts || []).some((a) => a.type === "business");
  const hasPersonal = (accounts || []).some((a) => a.type === "personal");
  const hasSavings = (accounts || []).some((a) => a.type === "savings");
  const missingAccountTypes = [
    !hasBusiness && "Business",
    !hasPersonal && "Personal",
    !hasSavings && "Savings",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">
              Invoice {invoice.invoice_number || `#${invoice.id.slice(0, 8)}`}
            </h1>
            <Badge tone={statusTone[invoice.status as InvoiceStatus]}>{invoice.status}</Badge>
          </div>
          <p className="text-slate-500">
            {client && (
              <a href={`/dashboard/clients/${client.id}`} className="underline">
                {client.name}
              </a>
            )}
          </p>
        </div>
        <LinkButton href={`/dashboard/invoices/${id}/edit`} variant="secondary">
          Edit
        </LinkButton>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">{formatUSD(Number(invoice.amount))}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600">
              {formatUSD(Number(invoice.paid_amount))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-red-600">
              {formatUSD(outstanding)}
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-slate-500">
        Issued {formatDate(invoice.issued_date)} · Due {formatDate(invoice.due_date)}
      </p>

      {invoice.notes && (
        <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-600">{invoice.notes}</p>
      )}

      {invoice.status !== "paid" && (
        <Card>
          <CardHeader>
            <CardTitle>Record a payment</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-200">
                {error}
              </p>
            )}
            {missingAccountTypes.length > 0 ? (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                Add a {missingAccountTypes.join(", ")} account before recording payments — the
                40/30/30 split needs one of each.
              </p>
            ) : (
              <>
                <form action={recordPayment} className="flex flex-wrap items-end gap-3">
                  <Field label="Amount received (USD)" htmlFor="payment_amount">
                    <Input
                      id="payment_amount"
                      name="payment_amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={outstanding}
                      defaultValue={outstanding}
                      required
                      className="w-40"
                    />
                  </Field>
                  <Field label="Fee override (USD, optional)" htmlFor="fee_override">
                    <Input
                      id="fee_override"
                      name="fee_override"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={`auto: $${estimatedFee}`}
                      className="w-44"
                    />
                  </Field>
                  <Field label="Date" htmlFor="date">
                    <Input id="date" name="date" type="date" defaultValue={today} required className="w-40" />
                  </Field>
                  <Button type="submit">Record payment</Button>
                </form>
                <p className="mt-2 text-xs text-slate-500">
                  After the platform fee (auto-calculated from invoice size, or override above)
                  and conversion at Rs {USD_TO_PKR_RATE}/USD, the PKR amount is automatically
                  split 40% Business / 30% Personal / 30% Safety.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium">Payment history</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th className="text-right">Amount</Th>
            </Tr>
          </THead>
          <TBody>
            {(payments || []).map((p) => (
              <Tr key={p.id}>
                <Td>{formatDate(p.date)}</Td>
                <Td>{p.description || "Payment"}</Td>
                <Td className="text-right text-emerald-600">
                  {formatPKR(Number(p.amount))}
                </Td>
              </Tr>
            ))}
            {(!payments || payments.length === 0) && (
              <Tr>
                <Td colSpan={3} className="text-center text-slate-400">
                  No payments recorded yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
