"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { InvoiceStatus } from "@/lib/types";
import { convertUsdToPkr, splitPkr, USD_TO_PKR_RATE } from "@/lib/finance";

function readInvoiceForm(formData: FormData) {
  return {
    client_id: String(formData.get("client_id") || ""),
    invoice_number: String(formData.get("invoice_number") || "") || null,
    amount: Number(formData.get("amount") || 0),
    issued_date: String(formData.get("issued_date")),
    due_date: String(formData.get("due_date") || "") || null,
    notes: String(formData.get("notes") || "") || null,
  };
}

export async function createInvoice(formData: FormData) {
  const supabase = await createClient();
  const values = readInvoiceForm(formData);
  const { data } = await supabase
    .from("invoices")
    .insert(values)
    .select("id")
    .single();
  revalidatePath("/dashboard/invoices");
  redirect(`/dashboard/invoices/${data?.id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  const supabase = await createClient();
  const values = readInvoiceForm(formData);
  await supabase.from("invoices").update(values).eq("id", id);
  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  redirect(`/dashboard/invoices/${id}`);
}

export async function recordInvoicePayment(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .single();

  if (!invoice) redirect("/dashboard/invoices");

  const paymentAmount = Number(formData.get("payment_amount") || 0);
  const feeOverrideRaw = formData.get("fee_override");
  const feeOverride =
    feeOverrideRaw && String(feeOverrideRaw).length > 0
      ? Number(feeOverrideRaw)
      : undefined;
  const date = String(formData.get("date"));

  if (paymentAmount > 0) {
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, type")
      .eq("is_archived", false);

    const businessAccount = accounts?.find((a) => a.type === "business");
    const personalAccount = accounts?.find((a) => a.type === "personal");
    const savingsAccount = accounts?.find((a) => a.type === "savings");

    if (!businessAccount || !personalAccount || !savingsAccount) {
      redirect(
        `/dashboard/invoices/${id}?error=${encodeURIComponent(
          "Set up one Business, one Personal, and one Savings account before recording payments — the split needs all three.",
        )}`,
      );
    }

    const { fee, netUsd, netPkr } = convertUsdToPkr(paymentAmount, feeOverride);
    const split = splitPkr(netPkr);

    const newPaidAmount = Number(invoice.paid_amount) + paymentAmount;
    const newStatus: InvoiceStatus =
      newPaidAmount >= Number(invoice.amount) ? "paid" : "partial";

    await supabase
      .from("invoices")
      .update({ paid_amount: newPaidAmount, status: newStatus })
      .eq("id", id);

    const invoiceRef = invoice.invoice_number ? ` #${invoice.invoice_number}` : "";
    const summary = `$${paymentAmount.toFixed(2)} - $${fee.toFixed(2)} fee = $${netUsd.toFixed(2)} @ Rs${USD_TO_PKR_RATE}`;

    await supabase.from("transactions").insert([
      {
        account_id: businessAccount!.id,
        type: "income",
        amount: split.business,
        category: "Client payment",
        description: `Invoice payment${invoiceRef} — Business 40% (${summary})`,
        date,
        client_id: invoice.client_id,
        invoice_id: id,
        created_by: user?.id || null,
      },
      {
        account_id: personalAccount!.id,
        type: "income",
        amount: split.personal,
        category: "Client payment",
        description: `Invoice payment${invoiceRef} — Personal 30% (${summary})`,
        date,
        client_id: invoice.client_id,
        invoice_id: id,
        created_by: user?.id || null,
      },
      {
        account_id: savingsAccount!.id,
        type: "income",
        amount: split.savings,
        category: "Client payment",
        description: `Invoice payment${invoiceRef} — Safety 30% (${summary})`,
        date,
        client_id: invoice.client_id,
        invoice_id: id,
        created_by: user?.id || null,
      },
    ]);
  }

  revalidatePath("/dashboard/invoices");
  revalidatePath(`/dashboard/invoices/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard/transactions");
  redirect(`/dashboard/invoices/${id}`);
}
