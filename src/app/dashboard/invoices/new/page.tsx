import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "../invoice-form";
import { createInvoice } from "../actions";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const { client } = await searchParams;
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create invoice</h1>
      <InvoiceForm
        action={createInvoice}
        clients={clients || []}
        defaultClientId={client}
        cancelHref="/dashboard/invoices"
      />
    </div>
  );
}
