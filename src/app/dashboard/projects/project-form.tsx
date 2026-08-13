import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/form";
import { Employee, Project, PROJECT_PLATFORMS, PROJECT_STATUSES } from "@/lib/types";

export function ProjectForm({
  action,
  project,
  employees,
  memberIds = [],
  cancelHref,
}: {
  action: (formData: FormData) => void;
  project?: Project;
  employees: Employee[];
  memberIds?: string[];
  cancelHref: string;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Project name" htmlFor="name">
        <Input id="name" name="name" required defaultValue={project?.name} />
      </Field>

      <Field label="Client name (optional)" htmlFor="client_name">
        <Input id="client_name" name="client_name" defaultValue={project?.client_name ?? undefined} />
      </Field>

      <Field label="Platform" htmlFor="platform">
        <Select id="platform" name="platform" defaultValue={project?.platform || "shopify"}>
          {PROJECT_PLATFORMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Start date" htmlFor="start_date">
          <Input id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? undefined} />
        </Field>
        <Field label="Due date" htmlFor="due_date">
          <Input id="due_date" name="due_date" type="date" defaultValue={project?.due_date ?? undefined} />
        </Field>
      </div>

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={project?.status || "not_started"}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </Field>

      <div>
        <Label>Assigned employees</Label>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-3">
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="employee_ids"
                value={e.id}
                defaultChecked={memberIds.includes(e.id)}
              />
              {e.name}
            </label>
          ))}
          {employees.length === 0 && (
            <p className="text-sm text-slate-400">No active employees yet.</p>
          )}
        </div>
      </div>

      <Field label="Notes (optional)" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={project?.notes ?? undefined} />
      </Field>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{project ? "Save changes" : "Add project"}</Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
