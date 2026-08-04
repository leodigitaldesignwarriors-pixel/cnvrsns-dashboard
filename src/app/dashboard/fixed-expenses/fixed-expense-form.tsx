import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { FIXED_EXPENSE_CATEGORIES, FixedExpense } from "@/lib/types";

export function FixedExpenseForm({
  action,
  fixedExpense,
  accounts,
}: {
  action: (formData: FormData) => void;
  fixedExpense?: FixedExpense;
  accounts: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Name" htmlFor="name">
        <Input
          id="name"
          name="name"
          required
          defaultValue={fixedExpense?.name}
          placeholder="e.g. Netflix, Office rent, Bank fee"
        />
      </Field>

      <Field label="Category" htmlFor="category">
        <Select id="category" name="category" defaultValue={fixedExpense?.category || "Other expense"}>
          {FIXED_EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Amount (PKR)" htmlFor="amount">
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          defaultValue={fixedExpense?.amount}
        />
      </Field>

      <Field label="Usually paid from" htmlFor="account_id">
        <Select id="account_id" name="account_id" defaultValue={fixedExpense?.account_id ?? ""}>
          <option value="">No default</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{fixedExpense ? "Save changes" : "Add fixed expense"}</Button>
        <LinkButton href="/dashboard/fixed-expenses" variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
