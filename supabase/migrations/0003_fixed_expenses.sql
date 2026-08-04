-- Fixed monthly expenses (subscriptions, rent, fees, etc.) — a recurring
-- obligations list, separate from employee salaries (which already live in
-- the employees table). Each one can be "marked paid" for the month, which
-- creates a normal expense transaction linked back via fixed_expense_id.

create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'Other expense',
  amount numeric(14,2) not null check (amount > 0),
  account_id uuid references public.accounts(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.transactions
  add column fixed_expense_id uuid references public.fixed_expenses(id) on delete set null;

create index on public.transactions (fixed_expense_id);

alter table public.fixed_expenses enable row level security;

create policy "fixed_expenses_partner_only" on public.fixed_expenses
  for all using (public.is_partner()) with check (public.is_partner());
