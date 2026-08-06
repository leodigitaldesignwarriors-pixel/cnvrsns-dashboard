-- Replaces the Personal-account / per-invoice split model with a monthly
-- partner-profit ledger: Personal account removed entirely, invoice
-- payments now land 100% in Business, and a manual month-close computes
-- Income - Business Expenses = Net, cuts 30% to Savings, and splits the
-- remainder 50/50 into two partner profit balances.

-- Personal account removal was an explicit, confirmed choice: hard delete,
-- not archive. This permanently removes any test transactions recorded
-- against it.
delete from public.transactions
where account_id in (select id from public.accounts where type = 'personal');

delete from public.accounts where type = 'personal';

create table public.monthly_ledger (
  id uuid primary key default gen_random_uuid(),
  month text not null unique, -- 'YYYY-MM'
  income numeric(14,2) not null default 0,
  business_expenses numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  savings_cut numeric(14,2) not null default 0,
  profit_total numeric(14,2) not null default 0,
  partner_a_profit numeric(14,2) not null default 0,
  partner_b_profit numeric(14,2) not null default 0,
  closed_at timestamptz not null default now(),
  closed_by uuid references public.profiles(id) on delete set null
);

alter table public.monthly_ledger enable row level security;

create policy "monthly_ledger_partner_only" on public.monthly_ledger
  for all using (public.is_partner()) with check (public.is_partner());

create table public.partner_transactions (
  id uuid primary key default gen_random_uuid(),
  partner text not null check (partner in ('a', 'b')),
  amount numeric(14,2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index on public.partner_transactions (partner, date);

alter table public.partner_transactions enable row level security;

create policy "partner_transactions_partner_only" on public.partner_transactions
  for all using (public.is_partner()) with check (public.is_partner());

alter table public.clients add column start_date date;
alter table public.clients add column deadline date;
