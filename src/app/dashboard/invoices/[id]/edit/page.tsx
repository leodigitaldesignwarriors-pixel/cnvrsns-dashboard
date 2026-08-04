import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "../../invoice-form";
import { updateInvoice } from "../../actions";

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: invoice }, { data: clients }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  if (!invoice) notFound();

  const updateWithId = updateInvoice.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit invoice</h1>
      <InvoiceForm
        action={updateWithId}
        invoice={invoice}
        clients={clients || []}
        cancelHref={`/dashboard/invoices/${id}`}
      />
    </div>
  );
}
