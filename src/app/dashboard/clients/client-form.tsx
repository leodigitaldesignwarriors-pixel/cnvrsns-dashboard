import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Client } from "@/lib/types";

export function ClientForm({
  action,
  client,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  client?: Client;
  cancelHref: string;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Client name" htmlFor="name">
        <Input id="name" name="name" required defaultValue={client?.name} />
      </Field>

      <Field label="Company (optional)" htmlFor="company">
        <Input id="company" name="company" defaultValue={client?.company ?? undefined} />
      </Field>

      <Field label="Contact email (optional)" htmlFor="contact_email">
        <Input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={client?.contact_email ?? undefined}
        />
      </Field>

      <Field label="Contact phone (optional)" htmlFor="contact_phone">
        <Input
          id="contact_phone"
          name="contact_phone"
          defaultValue={client?.contact_phone ?? undefined}
        />
      </Field>

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={client?.status || "active"}>
          <option value="active">Active</option>
          <option value="past">Past</option>
        </Select>
      </Field>

      <Field label="Notes (optional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={client?.notes ?? undefined} />
      </Field>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{client ? "Save changes" : "Add client"}</Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
