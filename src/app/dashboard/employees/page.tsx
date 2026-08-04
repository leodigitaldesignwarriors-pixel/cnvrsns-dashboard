import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { ConfirmDeleteForm } from "@/components/confirm-delete-form";
import { formatPKR, formatDate } from "@/lib/format";
import { deleteEmployee } from "./actions";

export default async function EmployeesPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .order("status")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Employees</h1>
        <LinkButton href="/dashboard/employees/new">Add employee</LinkButton>
      </div>

      <Table>
        <THead>
          <Tr>
            <Th>Name</Th>
            <Th>Role</Th>
            <Th>Started</Th>
            <Th>Status</Th>
            <Th className="text-right">Monthly salary</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {(employees || []).map((e) => (
            <Tr key={e.id}>
              <Td>
                <a
                  href={`/dashboard/employees/${e.id}`}
                  className="font-medium text-slate-900 underline"
                >
                  {e.name}
                </a>
              </Td>
              <Td>{e.role_title || "—"}</Td>
              <Td>{formatDate(e.start_date)}</Td>
              <Td>
                <Badge tone={e.status === "active" ? "green" : "slate"}>
                  {e.status === "active" ? "Active" : "Inactive"}
                </Badge>
              </Td>
              <Td className="text-right">
                {formatPKR(Number(e.monthly_salary))}
              </Td>
              <Td className="text-right">
                <ConfirmDeleteForm
                  action={deleteEmployee.bind(null, e.id)}
                  confirmMessage={`Delete ${e.name}? Their past salary payment transactions will stay in your records but will no longer be linked to this employee. This cannot be undone.`}
                />
              </Td>
            </Tr>
          ))}
          {(!employees || employees.length === 0) && (
            <Tr>
              <Td colSpan={6} className="text-center text-slate-400">
                No employees yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
