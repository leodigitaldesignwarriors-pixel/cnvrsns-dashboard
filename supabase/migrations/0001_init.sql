-- Company Finance Dashboard — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================================
-- Tables
-- ============================================================================

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text,
  monthly_salary numeric(14,2) not null default 0,
  start_date date not null default current_date,
  status text not null default 'active' check (status in ('active','inactive')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'employee' check (role in ('partner','employee')),
  employee_id uuid references public.employees(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'other' check (type in ('savings','personal','business','other')),
  opening_balance numeric(14,2) not null default 0,
  safety_minimum numeric(14,2),
  notes text,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  contact_email text,
  contact_phone text,
  status text not null default 'active' check (status in ('active','past')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text,
  amount numeric(14,2) not null check (amount > 0),
  issued_date date not null default current_date,
  due_date date,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid')),
  paid_amount numeric(14,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete restrict,
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null check (amount > 0),
  category text,
  description text,
  date date not null default current_date,
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.transactions (account_id);
create index on public.transactions (date);
create index on public.transactions (employee_id);
create index on public.transactions (client_id);
create index on public.invoices (client_id);

-- ============================================================================
-- account_balances view — balance is always derived, never stored, so it
-- can't drift from the transaction history.
-- ============================================================================

create view public.account_balances as
select
  a.id,
  a.name,
  a.type,
  a.safety_minimum,
  a.is_archived,
  a.opening_balance
    + coalesce(sum(case when t.type = 'income' then t.amount
                         when t.type = 'expense' then -t.amount
                         else 0 end), 0) as balance
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

-- ============================================================================
-- Helper: is_partner() — security definer so it can read profiles without
-- recursively triggering the profiles RLS policy it's used inside of.
-- ============================================================================

create function public.is_partner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'partner'
  );
$$;

create function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from public.profiles where id = auth.uid();
$$;

-- ============================================================================
-- Auto-create a profiles row for every new Supabase Auth user, defaulting to
-- the least-privileged role. Without this, a freshly created login has no
-- profiles row and can't be routed or authorized anywhere.
-- ============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.clients enable row level security;
alter table public.invoices enable row level security;
alter table public.employees enable row level security;
alter table public.transactions enable row level security;

-- profiles: everyone can see their own row; partners can see/manage all
create policy "profiles_select_own_or_partner" on public.profiles
  for select using (id = auth.uid() or public.is_partner());

create policy "profiles_update_own_name" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_partner_manage" on public.profiles
  for all using (public.is_partner()) with check (public.is_partner());

-- accounts, clients, invoices: partner-only, no employee access
create policy "accounts_partner_only" on public.accounts
  for all using (public.is_partner()) with check (public.is_partner());

create policy "clients_partner_only" on public.clients
  for all using (public.is_partner()) with check (public.is_partner());

create policy "invoices_partner_only" on public.invoices
  for all using (public.is_partner()) with check (public.is_partner());

-- employees: partners manage everyone; an employee can read their own row
create policy "employees_partner_manage" on public.employees
  for all using (public.is_partner()) with check (public.is_partner());

create policy "employees_select_own" on public.employees
  for select using (user_id = auth.uid());

-- transactions: partners manage everything; an employee can read only the
-- salary/expense transactions linked to their own employee record
create policy "transactions_partner_manage" on public.transactions
  for all using (public.is_partner()) with check (public.is_partner());

create policy "transactions_select_own_salary" on public.transactions
  for select using (employee_id = public.current_employee_id());

-- account_balances view inherits the accounts table's RLS (partner-only).
