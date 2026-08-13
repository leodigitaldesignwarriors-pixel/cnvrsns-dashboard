# Company Finance Dashboard

Track your bank account balances, monthly income/expenses, clients and
invoices, employee salary payments, a monthly partner-profit ledger, and
your team's projects/tasks/time tracking in one place.

- **Partners (Admin)** get full access: accounts, transactions, clients,
  invoices, employees, reports, projects, tasks, timeline, and everyone's
  time entries/daily logs.
- **Employees** get a portal scoped to themselves: their own pay history,
  sign-in/sign-off time clock, assigned tasks, and daily work logs.

Built with Next.js (App Router) + Supabase (Postgres, Auth, Row Level
Security) + Tailwind. Designed to run on Vercel's free tier and a free
Supabase project.

---

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up / log in.
2. Click **New project**. Pick any name/region, set a database password
   (save it somewhere safe), and wait ~2 minutes for it to provision.
3. In the left sidebar go to **Project Settings → API**. You'll need two
   values from this page in a minute:
   - **Project URL**
   - **anon / public** key

## 2. Run the database migration

1. In the Supabase dashboard, open **SQL Editor**.
2. Open each file in [`supabase/migrations/`](supabase/migrations) **in
   order** (`0001_init.sql`, `0002_...`, `0003_...`, etc.), copy its full
   contents, paste into the SQL editor, and click **Run** — one file at a
   time, waiting for each to succeed before running the next.
3. This creates all tables (`accounts`, `transactions`, `clients`,
   `invoices`, `employees`, `profiles`, `fixed_expenses`), a
   `account_balances` view that always derives live balances from your
   transaction history, and Row Level Security policies enforcing the
   partner/employee split.

## 3. Configure environment variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   with the values from step 1.3.

## 4. Install dependencies and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected
to `/login` — but there are no users yet, so create yourself one next.

## 5. Create your partner logins

Do this for yourself and your co-partner:

1. In Supabase, go to **Authentication → Users → Add user → Create new
   user**. Enter an email and password (or use "Send invite" to email
   them a magic link instead).
2. Go to **Table Editor → profiles**. A row should already exist for the
   new user (created automatically the first time they're queried) — if
   not, insert one manually with `id` = the user's UUID from the Users
   page.
3. Edit that row: set **role** to `partner`. Leave `employee_id` empty.
4. Repeat for the second partner.

Now sign in at `/login` with either partner's credentials — you'll land
on the full dashboard.

## 6. Add employees and (optionally) give them portal logins

1. In the app, go to **Employees → Add employee** and fill in their name,
   role, monthly salary, and start date.
2. If you want that employee to log in and see their own pay history:
   - Create their login the same way as step 5.1.
   - In **Table Editor → profiles**, find their row, leave `role` as
     `employee`, and set `employee_id` to the id of the employee record
     you created in step 1 (find it in **Table Editor → employees**).
   - They can now sign in and see `/portal` with only their own salary
     payments — nothing else.

Employees you never give a login to still show up everywhere in the
partner dashboard (salary payments, reports) — they just can't sign in.

## 7. Everyday use

**Currency:** company finance (accounts, transactions, salaries, ledger,
partner profit) is always shown in **PKR**. Client invoicing (invoice
amounts, client outstanding balances) is always shown in **USD**, since
clients are billed in dollars.

**Invoice payment conversion:** when you record an invoice payment, the USD
amount is automatically converted and deposited into your Business account.
This logic lives in [`src/lib/finance.ts`](src/lib/finance.ts):
1. A flat platform withdrawal fee is deducted based on invoice size ($1–199
   → $2, $200–499 → $5, $500–999 → $10, $1000+ → $29) — override it per
   payment if the real fee differs.
2. The remainder is converted to PKR at a fixed rate (currently **Rs 277 /
   USD** — update `USD_TO_PKR_RATE` in `src/lib/finance.ts` as the real rate
   moves) and deposited in full — no split happens per payment anymore.

**Monthly profit model:** there is no Personal account — every account is
either Business, Savings, or Other. Once a month, a partner opens
**Ledger** and clicks **Close Month**, which:
1. Sums that month's income and expenses on the Business account.
2. Cuts **30%** of the net amount into your Savings account (one
   transaction, `SAVINGS_CUT_RATIO` in `src/lib/finance.ts`).
3. Splits what's left **50/50** between Partner A and Partner B
   (`PARTNER_SPLIT_RATIO`), visible as each partner's profit card.

A month can only be closed once, and its numbers are locked in permanently
in `monthly_ledger` — the current, not-yet-closed month always shows a live
preview instead. Partners spend down their own profit via **Partners** →
log a withdrawal; the card always shows only the current month's remaining
profit (it resets every month, past months stay in the Ledger history).

**Expected Total** (on Overview) = current total balance + what your
outstanding invoices would net after fee/conversion if paid today — a
forward-looking number, not money you actually have yet.

**Hiding amounts:** the eye icon on Overview masks Total Balance, Expected
Total, and both partner profit cards behind `••••••` — handy if the screen
is visible to others. It resets when you close the browser tab.

- **Accounts** — add your savings and business accounts, each with an
  opening balance and an optional safety minimum. The dashboard shows a
  status badge (Safe / Low / Below minimum / Negative) per account.
- **Transactions** — every income or expense you log against an account.
  Marking an invoice paid, paying an employee's salary, or closing a month
  all create transactions automatically — you don't need to log those by
  hand.
- **Clients** — track active vs. past clients, a start date and deadline
  per client (shown with an On track / Overdue badge), and all their
  invoices and payments on one page.
- **Invoices** — create an invoice for a client, then "Record a payment"
  when they pay (full or partial) — this deducts the fee, converts to PKR,
  and deposits into your Business account.
- **Employees** — "Pay salary" logs an expense transaction against
  whichever account you paid from.
- **Fixed Expenses** — define recurring monthly costs (subscriptions, rent,
  fees, etc.) once, then "Mark paid" each month to log the actual
  transaction. Active employee salaries automatically show up in this list
  too (read-only — pay those from the Employees page).
- **Ledger** — the monthly close described above, plus a history of every
  closed month's income/expenses/savings/partner split.
- **Partners** — each partner's current profit balance, a form to log a
  withdrawal against it, and a month-filterable withdrawal history.
- **Reports** — pick a month to see income/expenses by category and by
  account. Business profit itself now lives on the Ledger page.

## Task & Project Tracking (BoxBettter)

Added on top of the finance dashboard, reusing the same login and
partner/employee roles (partner = admin here). Migration
[`0005_task_tracking.sql`](supabase/migrations/0005_task_tracking.sql) adds
six tables: `projects`, `project_members`, `tasks`, `task_assignees`,
`time_entries`, `daily_logs` — run it the same way as the others (step 2).

**Admin side** (`/dashboard/...`):
- **Team Dashboard** — active projects, team workload, hours logged this
  week, overdue tasks, and projects nearing deadline.
- **Projects** — name, client, platform (Shopify/WordPress), dates, status,
  and assigned employees; each project's detail page lists its tasks and
  total hours logged.
- **Tasks** — create under a project, assign one or more employees, set
  priority/due date/estimated hours; the list is filterable by project,
  employee, status, and priority, with inline status changes. A task's
  detail page shows estimated vs. actual hours (summed from daily logs).
- **Timeline** — a Gantt-style bar per project (today marked with a red
  line) plus a list of upcoming task deadlines, overdue and due-soon
  highlighted.
- **Time & Logs** — every employee's time-clock entries and daily logs,
  filterable by employee/project/date range.

**Employee side** (`/portal/...`):
- **Dashboard** — today's sign-in/sign-off status with a quick clock
  button, hours this week, and their open tasks.
- **Time Clock** — sign in/sign off (with an optional note on sign-off),
  today's and this week's hours.
- **My Tasks** — their assigned tasks with a status dropdown they can
  update themselves (RLS only allows updating tasks assigned to them).
- **Daily Log** — log hours against a project (and optionally a specific
  task) with a short note on what they worked on; history below the form.
- **My Pay** — unchanged, their own salary payment history.

Employees only ever see projects/tasks they're assigned to and their own
time entries and logs — enforced by Row Level Security, not just hidden in
the UI (see `tasks_select_assigned`, `time_entries_own_manage`, etc. in the
migration).

## 8. Deploy to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. In the project's **Environment Variables** settings, add the same
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` you used
   locally.
4. Deploy. Vercel auto-detects Next.js — no build config needed.

---

## Notes on security

- All data access goes through Supabase Row Level Security using each
  user's own session — the app never uses a service-role key, so there's
  nothing sensitive baked into the deployed code.
- Employees can only ever read their own `employees` row and the
  `transactions` rows linked to their own `employee_id` — verified at the
  database level, not just hidden in the UI.
- Only users with `profiles.role = 'partner'` can read or write accounts,
  clients, invoices, or other people's transactions.
