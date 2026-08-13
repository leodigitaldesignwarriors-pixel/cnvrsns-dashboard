import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Project, Task } from "@/lib/types";

export function DailyLogForm({
  action,
  projects,
  tasks,
}: {
  action: (formData: FormData) => void;
  projects: Project[];
  tasks: (Task & { projects: { name: string } | null })[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="max-w-lg space-y-4">
      <Field label="Date" htmlFor="log_date">
        <Input id="log_date" name="log_date" type="date" required defaultValue={today} />
      </Field>

      <Field label="Project" htmlFor="project_id">
        <Select id="project_id" name="project_id" required defaultValue="">
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

      <Field label="Task (optional)" htmlFor="task_id">
        <Select id="task_id" name="task_id" defaultValue="">
          <option value="">No specific task</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.projects?.name} — {t.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Hours worked" htmlFor="hours">
        <Input id="hours" name="hours" type="number" step="0.25" min="0" required defaultValue="1" />
      </Field>

      <Field label="What did you work on?" htmlFor="description">
        <Textarea id="description" name="description" rows={3} required />
      </Field>

      <Button type="submit">Log work</Button>
    </form>
  );
}
