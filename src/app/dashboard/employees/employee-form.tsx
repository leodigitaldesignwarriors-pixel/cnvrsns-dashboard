import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form";
import { Employee } from "@/lib/types";

export function EmployeeForm({
  action,
  employee,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  employee?: Employee;
  cancelHref: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Full name" htmlFor="name">
        <Input id="name" name="name" required defaultValue={employee?.name} />
      </Field>

      <Field label="Role / title (optional)" htmlFor="role_title">
        <Input
          id="role_title"
          name="role_title"
          defaultValue={employee?.role_title ?? undefined}
        />
      </Field>

      <Field label="Monthly salary (PKR)" htmlFor="monthly_salary">
        <Input
          id="monthly_salary"
          name="monthly_salary"
          type="number"
          step="0.01"
          min="0"
          required
          defaultValue={employee?.monthly_salary ?? 0}
        />
      </Field>

      <Field label="Start date" htmlFor="start_date">
        <Input
          id="start_date"
          name="start_date"
          type="date"
          required
          defaultValue={employee?.start_date || today}
        />
      </Field>

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={employee?.status || "active"}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Field>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{employee ? "Save changes" : "Add employee"}</Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
