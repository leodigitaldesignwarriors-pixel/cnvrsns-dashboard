import { Button, LinkButton } from "@/components/ui/button";
import { Field, Input, Select, Textarea, Label } from "@/components/ui/form";
import { Employee, Project, Task, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/types";

export function TaskForm({
  action,
  task,
  projects,
  employees,
  assigneeIds = [],
  defaultProjectId,
  cancelHref,
}: {
  action: (formData: FormData) => void;
  task?: Task;
  projects: Project[];
  employees: Employee[];
  assigneeIds?: string[];
  defaultProjectId?: string;
  cancelHref: string;
}) {
  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Project" htmlFor="project_id">
        <Select
          id="project_id"
          name="project_id"
          required
          defaultValue={task?.project_id || defaultProjectId || ""}
        >
          <option value="" disabled>
            Select a project
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Task title" htmlFor="title">
        <Input id="title" name="title" required defaultValue={task?.title} />
      </Field>

      <Field label="Description (optional)" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={task?.description ?? undefined} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Due date" htmlFor="due_date">
          <Input id="due_date" name="due_date" type="date" defaultValue={task?.due_date ?? undefined} />
        </Field>
        <Field label="Estimated hours" htmlFor="estimated_hours">
          <Input
            id="estimated_hours"
            name="estimated_hours"
            type="number"
            step="0.5"
            min="0"
            defaultValue={task?.estimated_hours ?? undefined}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={task?.priority || "medium"}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={task?.status || "todo"}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div>
        <Label>Assigned employees</Label>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-slate-300 p-3">
          {employees.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="employee_ids"
                value={e.id}
                defaultChecked={assigneeIds.includes(e.id)}
              />
              {e.name}
            </label>
          ))}
          {employees.length === 0 && (
            <p className="text-sm text-slate-400">No active employees yet.</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{task ? "Save changes" : "Add task"}</Button>
        <LinkButton href={cancelHref} variant="secondary">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
