import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Account } from "@/lib/types";

export function AccountForm({
  action,
  account,
}: {
  action: (formData: FormData) => void;
  account?: Account;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Account name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={account?.name}
          placeholder="e.g. Business account"
        />
      </Field>

      <Field label="Type" htmlFor="type">
        <Select id="type" name="type" defaultValue={account?.type || "other"}>
          <option value="business">Business</option>
          <option value="savings">Savings / safety</option>
          <option value="other">Other</option>
        </Select>
      </Field>

      <Field label="Opening balance (PKR)" htmlFor="opening_balance">
        <Input
          id="opening_balance"
          name="opening_balance"
          type="number"
          step="0.01"
          defaultValue={account?.opening_balance ?? 0}
        />
      </Field>

      <Field label="Safety minimum (PKR, optional)" htmlFor="safety_minimum">
        <Input
          id="safety_minimum"
          name="safety_minimum"
          type="number"
          step="0.01"
          defaultValue={account?.safety_minimum ?? undefined}
          placeholder="Alert if balance drops below this"
        />
      </Field>

      <Field label="Notes (optional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={account?.notes ?? undefined} />
      </Field>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{account ? "Save changes" : "Add account"}</Button>
        <LinkButton href="/dashboard/accounts" variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
