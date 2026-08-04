# Company Finance Dashboard

Track your bank account balances, monthly income/expenses, clients and
invoices, and employee salary payments in one place.

- **Partners** get full access: accounts, transactions, clients, invoices,
  employees, reports.
- **Employees** get a read-only "My Pay" portal showing only their own
  salary payment history.

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

**Currency:** company finance (accounts, transactions, salaries, reports) is
always shown in **PKR**. Client invoicing (invoice amounts, client
outstanding balances) is always shown in **USD**, since clients are billed
in dollars.

**Invoice payment conversion:** when you record an invoice payment, the USD
amount is automatically converted and split. This logic lives in
[`src/lib/finance.ts`](src/lib/finance.ts):
1. A flat platform withdrawal fee is deducted based on invoice size ($1–199
   → $2, $200–499 → $5, $500–999 → $10, $1000+ → $29) — override it per
   payment if the real fee differs.
2. The remainder is converted to PKR at a fixed rate (currently **Rs 277 /
   USD** — update `USD_TO_PKR_RATE` in `src/lib/finance.ts` as the real rate
   moves).
3. The PKR amount is split **40% Business / 30% Personal / 30% Savings**
   and deposited as three separate transactions into whichever accounts
   have those types. This requires exactly one account of each of the
   `business`, `personal`, and `savings` types to exist.

Account cards on the Overview page also show a projected "**+ Rs X
upcoming**" figure — the same fee/conversion/split math applied to all
currently outstanding (unpaid/partial) invoices, as if they were paid
today.

- **Accounts** — add your savings/safety, personal, and business
  accounts, each with an opening balance and an optional safety minimum.
  The dashboard shows a status badge (Safe / Low / Below minimum /
  Negative) per account, same idea as your original balance screenshot.
- **Transactions** — every income or expense you log against an account.
  Marking an invoice paid or paying an employee's salary both create a
  transaction automatically — you don't need to log those by hand.
- **Clients** — track active vs. past clients and see all their invoices
  and payments on one page.
- **Invoices** — create an invoice for a client, then "Record a payment"
  when they pay (full or partial) — this automatically deducts the fee,
  converts to PKR, and splits 40/30/30 across your Business, Personal, and
  Savings accounts.
- **Employees** — "Pay salary" logs an expense transaction against
  whichever account you paid from.
- **Fixed Expenses** — define recurring monthly costs (subscriptions, rent,
  fees, etc.) once, then "Mark paid" each month to log the actual
  transaction. Active employee salaries automatically show up in this list
  too (read-only — pay those from the Employees page), so this is the
  complete picture of your fixed monthly obligations and how much of them
  you've paid so far this month.
- **Reports** — pick a month to see income/expenses by category and by
  account, plus business profit (excludes the personal account).

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
