import { createClient } from "@/lib/supabase/server";
import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types";
import { createTransaction } from "../actions";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const [{ data: accounts }, { data: clients }, { data: employees }] =
    await Promise.all([
      supabase.from("accounts").select("id, name").eq("is_archived", false).order("name"),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("employees").select("id, name").order("name"),
    ]);

  const today = new Date().toISOString().slice(0, 10);
  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add transaction</h1>
      <form action={createTransaction} className="max-w-lg space-y-4">
        <Field label="Type" htmlFor="type">
          <Select id="type" name="type" defaultValue="expense" required>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </Select>
        </Field>

        <Field label="Account" htmlFor="account_id">
          <Select id="account_id" name="account_id" required>
            {(accounts || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Amount (PKR)" htmlFor="amount">
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </Field>

        <Field label="Date" htmlFor="date">
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </Field>

        <Field label="Category" htmlFor="category">
          <Input id="category" name="category" list="category-options" placeholder="e.g. Salary, Tools & subscriptions" />
          <datalist id="category-options">
            {allCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field label="Description (optional)" htmlFor="description">
          <Textarea id="description" name="description" rows={2} />
        </Field>

        <Field label="Related client (optional)" htmlFor="client_id">
          <Select id="client_id" name="client_id" defaultValue="">
            <option value="">None</option>
            {(clients || []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Related employee (optional, for salary)" htmlFor="employee_id">
          <Select id="employee_id" name="employee_id" defaultValue="">
            <option value="">None</option>
            {(employees || []).map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex gap-3 pt-2">
          <Button type="submit">Add transaction</Button>
          <LinkButton href="/dashboard/transactions" variant="secondary">
            Cancel
          </LinkButton>
        </div>
      </form>
    </div>
  );
}
