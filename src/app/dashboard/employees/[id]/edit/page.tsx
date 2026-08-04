import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeForm } from "../../employee-form";
import { updateEmployee } from "../../actions";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (!employee) notFound();

  const updateWithId = updateEmployee.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit employee</h1>
      <EmployeeForm
        action={updateWithId}
        employee={employee}
        cancelHref={`/dashboard/employees/${id}`}
      />
    </div>
  );
}
