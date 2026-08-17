import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/form";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { formatPKR, formatDate } from "@/lib/format";
import { paySalary } from "../actions";
import { inviteEmployeePortalAccess, revokeEmployeePortalAccess } from "../portal-access-actions";

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ invite_error?: string }>;
}) {
  const { id } = await params;
  const { invite_error: inviteError } = await searchParams;
  const supabase = await createClient();

  const [{ data: employee }, { data: accounts }, { data: payments }] =
    await Promise.all([
      supabase.from("employees").select("*").eq("id", id).single(),
      supabase.from("accounts").select("id, name").eq("is_archived", false).order("name"),
      supabase
        .from("transactions")
        .select("*")
        .eq("employee_id", id)
        .order("date", { ascending: false }),
    ]);

  if (!employee) notFound();

  let portalEmail: string | null = null;
  if (employee.user_id) {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(employee.user_id);
    portalEmail = data.user?.email || null;
  }

  const totalPaid = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const pay = paySalary.bind(null, id);
  const invite = inviteEmployeePortalAccess.bind(null, id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{employee.name}</h1>
            <Badge tone={employee.status === "active" ? "green" : "slate"}>
              {employee.status === "active" ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-slate-500">{employee.role_title}</p>
          <p className="mt-1 text-sm text-slate-500">
            Started {formatDate(employee.start_date)}
          </p>
        </div>
        <LinkButton href={`/dashboard/employees/${id}/edit`} variant="secondary">
          Edit
        </LinkButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portal access</CardTitle>
        </CardHeader>
        <CardContent>
          {employee.user_id ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <Badge tone="green">Invited</Badge>
                {portalEmail && <p className="mt-1 text-sm text-slate-500">{portalEmail}</p>}
              </div>
              <ConfirmDeleteForm
                action={revokeEmployeePortalAccess.bind(null, id, employee.user_id)}
                confirmMessage={`Revoke ${employee.name}'s portal access? They'll no longer be able to sign in and see their tasks, time clock, or pay history. You can re-invite them later.`}
              >
                Revoke access
              </ConfirmDeleteForm>
            </div>
          ) : (
            <form action={invite} className="flex flex-wrap items-end gap-3">
              <Field label="Email" htmlFor="email">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-64"
                  placeholder="employee@email.com"
                />
              </Field>
              <Button type="submit">Send invite</Button>
            </form>
          )}
          {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly salary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold">
              {formatPKR(Number(employee.monthly_salary))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total paid to date</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-semibold text-emerald-600">
              {formatPKR(totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pay salary</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={pay} className="flex flex-wrap items-end gap-3">
            <Field label="Amount (PKR)" htmlFor="amount">
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={employee.monthly_salary}
                required
                className="w-36"
              />
            </Field>
            <Field label="Pay from" htmlFor="account_id">
              <Select id="account_id" name="account_id" required className="w-48">
                {(accounts || []).map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date" htmlFor="date">
              <Input id="date" name="date" type="date" defaultValue={today} required className="w-40" />
            </Field>
            <Button type="submit">Record payment</Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Payment history</h2>
        <Table>
          <THead>
            <Tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th className="text-right">Amount</Th>
            </Tr>
          </THead>
          <TBody>
            {(payments || []).map((p) => (
              <Tr key={p.id}>
                <Td>{formatDate(p.date)}</Td>
                <Td>{p.description || "Salary payment"}</Td>
                <Td className="text-right">{formatPKR(Number(p.amount))}</Td>
              </Tr>
            ))}
            {(!payments || payments.length === 0) && (
              <Tr>
                <Td colSpan={3} className="text-center text-slate-400">
                  No payments recorded yet.
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>
      </div>
    </div>
  );
}
