export type AccountType = "savings" | "personal" | "business" | "other";
export type ClientStatus = "active" | "past";
export type InvoiceStatus = "unpaid" | "partial" | "paid";
export type EmployeeStatus = "active" | "inactive";
export type TransactionType = "income" | "expense";
export type ProfileRole = "partner" | "employee";
export type Partner = "a" | "b";

export interface Profile {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  employee_id: string | null;
  created_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  opening_balance: number;
  safety_minimum: number | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface AccountBalance {
  id: string;
  name: string;
  type: AccountType;
  safety_minimum: number | null;
  is_archived: boolean;
  opening_balance: number;
  balance: number;
}

export interface Client {
  id: string;
  name: string;
  company: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ClientStatus;
  notes: string | null;
  start_date: string | null;
  deadline: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string | null;
  amount: number;
  issued_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  paid_amount: number;
  notes: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  name: string;
  role_title: string | null;
  monthly_salary: number;
  start_date: string;
  status: EmployeeStatus;
  user_id: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category: string | null;
  description: string | null;
  date: string;
  client_id: string | null;
  invoice_id: string | null;
  employee_id: string | null;
  fixed_expense_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface FixedExpense {
  id: string;
  name: string;
  category: string;
  amount: number;
  account_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface MonthlyLedger {
  id: string;
  month: string;
  income: number;
  business_expenses: number;
  net_amount: number;
  savings_cut: number;
  profit_total: number;
  partner_a_profit: number;
  partner_b_profit: number;
  closed_at: string;
  closed_by: string | null;
}

export interface PartnerTransaction {
  id: string;
  partner: Partner;
  amount: number;
  date: string;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

export const INCOME_CATEGORIES = [
  "Client payment",
  "Refund",
  "Other income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Salary",
  "Subscriptions & tools",
  "Rent & utilities",
  "Fees & finance",
  "Marketing & extras",
  "Contractor",
  "Taxes",
  "Other expense",
] as const;

export const FIXED_EXPENSE_CATEGORIES = [
  "Subscriptions & tools",
  "Rent & utilities",
  "Fees & finance",
  "Marketing & extras",
  "Other expense",
] as const;

export type ProjectPlatform = "shopify" | "wordpress";
export type ProjectStatus = "not_started" | "in_progress" | "in_review" | "completed";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface Project {
  id: string;
  name: string;
  client_name: string | null;
  platform: ProjectPlatform;
  start_date: string | null;
  due_date: string | null;
  status: ProjectStatus;
  notes: string | null;
  created_at: string;
}

export interface ProjectMember {
  project_id: string;
  employee_id: string;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  estimated_hours: number | null;
  created_at: string;
}

export interface TaskAssignee {
  task_id: string;
  employee_id: string;
}

export interface TimeEntry {
  id: string;
  employee_id: string;
  work_date: string;
  clock_in: string;
  clock_out: string | null;
  note: string | null;
  created_at: string;
}

export interface DailyLog {
  id: string;
  employee_id: string;
  project_id: string | null;
  task_id: string | null;
  log_date: string;
  hours: number;
  description: string;
  created_at: string;
}

export const PROJECT_PLATFORMS: { value: ProjectPlatform; label: string }[] = [
  { value: "shopify", label: "Shopify" },
  { value: "wordpress", label: "WordPress" },
];

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "completed", label: "Completed" },
];

export const TASK_PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export const DEFAULT_MILESTONE_TITLES = [
  "Wireframe",
  "Homepage design",
  "Product page design",
  "Theme setup",
  "Client revisions",
  "Launch",
];
