-- Employee task & project tracking — projects, tasks, time clock, daily logs.
-- Reuses the existing employees/profiles tables and is_partner() /
-- current_employee_id() helpers from 0001_init.sql (partner == admin here).

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  platform text not null default 'shopify' check (platform in ('shopify','wordpress')),
  start_date date,
  due_date date,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','in_review','completed')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  primary key (project_id, employee_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  status text not null default 'todo' check (status in ('todo','in_progress','blocked','done')),
  estimated_hours numeric(6,2),
  created_at timestamptz not null default now()
);

create table public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  primary key (task_id, employee_id)
);

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  work_date date not null default current_date,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  log_date date not null default current_date,
  hours numeric(5,2) not null default 0 check (hours >= 0),
  description text not null,
  created_at timestamptz not null default now()
);

create index on public.project_members (employee_id);
create index on public.tasks (project_id);
create index on public.tasks (due_date);
create index on public.task_assignees (employee_id);
create index on public.time_entries (employee_id);
create index on public.time_entries (work_date);
create index on public.daily_logs (employee_id);
create index on public.daily_logs (project_id);
create index on public.daily_logs (task_id);
create index on public.daily_logs (log_date);

-- ============================================================================
-- Row Level Security — admins (partners) manage everything; an employee can
-- only see projects/tasks they're assigned to, and can only read/write their
-- own time entries and daily logs.
-- ============================================================================

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.time_entries enable row level security;
alter table public.daily_logs enable row level security;

create policy "projects_admin_manage" on public.projects
  for all using (public.is_partner()) with check (public.is_partner());

create policy "projects_select_member" on public.projects
  for select using (
    exists (
      select 1 from public.project_members pm
      where pm.project_id = projects.id and pm.employee_id = public.current_employee_id()
    )
  );

create policy "project_members_admin_manage" on public.project_members
  for all using (public.is_partner()) with check (public.is_partner());

create policy "project_members_select_own" on public.project_members
  for select using (employee_id = public.current_employee_id());

create policy "tasks_admin_manage" on public.tasks
  for all using (public.is_partner()) with check (public.is_partner());

create policy "tasks_select_assigned" on public.tasks
  for select using (
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = tasks.id and ta.employee_id = public.current_employee_id()
    )
  );

-- An assigned employee may update their task (the app only ever sends a
-- status change from the employee side, even though RLS itself is row- not
-- column-scoped here).
create policy "tasks_update_assigned" on public.tasks
  for update using (
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = tasks.id and ta.employee_id = public.current_employee_id()
    )
  ) with check (
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = tasks.id and ta.employee_id = public.current_employee_id()
    )
  );

create policy "task_assignees_admin_manage" on public.task_assignees
  for all using (public.is_partner()) with check (public.is_partner());

create policy "task_assignees_select_own" on public.task_assignees
  for select using (employee_id = public.current_employee_id());

create policy "time_entries_admin_select" on public.time_entries
  for select using (public.is_partner());

create policy "time_entries_own_manage" on public.time_entries
  for all using (employee_id = public.current_employee_id())
  with check (employee_id = public.current_employee_id());

create policy "daily_logs_admin_select" on public.daily_logs
  for select using (public.is_partner());

create policy "daily_logs_own_manage" on public.daily_logs
  for all using (employee_id = public.current_employee_id())
  with check (employee_id = public.current_employee_id());
