import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { todayKey, daysFromToday } from "@/lib/hours";
import { ProjectStatus, TaskStatus } from "@/lib/types";
import { PROJECT_STATUS_LABEL, isProjectOverdue, isTaskOverdue } from "@/lib/task-status";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toDays(dateKey: string) {
  return new Date(dateKey + "T00:00:00").getTime() / MS_PER_DAY;
}

export default async function TimelinePage() {
  const supabase = await createClient();

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").neq("status", "completed").order("start_date"),
    supabase
      .from("tasks")
      .select("*, projects(name)")
      .neq("status", "done")
      .not("due_date", "is", null)
      .order("due_date")
      .limit(40),
  ]);

  const today = todayKey();
  const todayDays = toDays(today);

  const dated = (projects || []).filter((p) => p.start_date || p.due_date);
  const allDates = dated.flatMap((p) => [p.start_date, p.due_date].filter(Boolean) as string[]);
  const windowStartDays = Math.min(todayDays - 7, ...(allDates.length ? allDates.map(toDays) : [todayDays - 7]));
  const windowEndDays = Math.max(todayDays + 45, ...(allDates.length ? allDates.map(toDays) : [todayDays + 45]));
  const totalDays = Math.max(1, windowEndDays - windowStartDays);

  const months: { label: string; leftPct: number }[] = [];
  const cursor = new Date(windowStartDays * MS_PER_DAY);
  cursor.setDate(1);
  while (cursor.getTime() / MS_PER_DAY < windowEndDays) {
    const days = cursor.getTime() / MS_PER_DAY;
    if (days >= windowStartDays) {
      months.push({
        label: cursor.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        leftPct: ((days - windowStartDays) / totalDays) * 100,
      });
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const todayPct = ((todayDays - windowStartDays) / totalDays) * 100;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Timeline</h1>

      <div>
        <h2 className="mb-3 text-lg font-medium">Project timeline</h2>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="relative mb-2 h-6 border-b border-slate-200">
            {months.map((m, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 text-xs text-slate-400"
                style={{ left: `${m.leftPct}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="relative space-y-3">
            <div
              className="absolute top-0 bottom-0 w-px bg-red-400"
              style={{ left: `${todayPct}%` }}
              title="Today"
            />
            {dated.map((p) => {
              const startDays = p.start_date ? toDays(p.start_date) : p.due_date ? toDays(p.due_date) - 7 : todayDays;
              const endDays = p.due_date ? toDays(p.due_date) : startDays + 7;
              const leftPct = Math.max(0, ((startDays - windowStartDays) / totalDays) * 100);
              const widthPct = Math.max(1, ((endDays - startDays) / totalDays) * 100);
              const overdue = isProjectOverdue(p.due_date, p.status as ProjectStatus);
              return (
                <div key={p.id} className="relative flex h-8 items-center">
                  <div className="w-40 shrink-0 truncate pr-3 text-sm text-slate-700">
                    <a href={`/dashboard/projects/${p.id}`} className="hover:underline">
                      {p.name}
                    </a>
                  </div>
                  <div className="relative h-5 flex-1">
                    <div
                      className={`absolute h-5 rounded-full ${
                        overdue ? "bg-red-500" : "bg-blue-500"
                      }`}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`${p.name}: ${formatDate(p.start_date)} → ${formatDate(p.due_date)}`}
                    />
                  </div>
                </div>
              );
            })}
            {dated.length === 0 && (
              <p className="py-4 text-center text-sm text-slate-400">
                No active projects with dates yet.
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Upcoming task deadlines</h2>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {(tasks || []).map((t) => {
            const overdue = isTaskOverdue(t.due_date, t.status as TaskStatus);
            const daysOut = t.due_date ? daysFromToday(t.due_date) : 0;
            const soon = !overdue && daysOut <= 3;
            return (
              <div key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <a href={`/dashboard/tasks/${t.id}`} className="font-medium text-slate-900 hover:underline">
                    {t.title}
                  </a>
                  <p className="truncate text-xs text-slate-500">
                    {(t.projects as { name: string } | null)?.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm text-slate-500">{formatDate(t.due_date)}</span>
                  {overdue && <Badge tone="red">Overdue</Badge>}
                  {soon && <Badge tone="yellow">Due soon</Badge>}
                </div>
              </div>
            );
          })}
          {(!tasks || tasks.length === 0) && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No upcoming deadlines.</p>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        {PROJECT_STATUS_LABEL.completed} projects are hidden from the timeline. The red vertical line marks today.
      </p>
    </div>
  );
}
