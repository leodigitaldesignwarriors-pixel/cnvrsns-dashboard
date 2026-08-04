import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Invoice } from "@/lib/types";

export function InvoiceForm({
  action,
  invoice,
  clients,
  defaultClientId,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  invoice?: Invoice;
  clients: { id: string; name: string }[];
  defaultClientId?: string;
  cancelHref: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Client" htmlFor="client_id">
        <Select
          id="client_id"
          name="client_id"
          required
          defaultValue={invoice?.client_id || defaultClientId || ""}
        >
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Invoice number (optional)" htmlFor="invoice_number">
        <Input
          id="invoice_number"
          name="invoice_number"
          defaultValue={invoice?.invoice_number ?? undefined}
        />
      </Field>

      <Field label="Amount (USD)" htmlFor="amount">
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={invoice?.amount}
        />
      </Field>

      <Field label="Issued date" htmlFor="issued_date">
        <Input
          id="issued_date"
          name="issued_date"
          type="date"
          required
          defaultValue={invoice?.issued_date || today}
        />
      </Field>

      <Field label="Due date (optional)" htmlFor="due_date">
        <Input
          id="due_date"
          name="due_date"
          type="date"
          defaultValue={invoice?.due_date ?? undefined}
        />
      </Field>

      <Field label="Notes (optional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={invoice?.notes ?? undefined} />
      </Field>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{invoice ? "Save changes" : "Create invoice"}</Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
