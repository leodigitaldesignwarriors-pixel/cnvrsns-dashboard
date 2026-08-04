import { EmployeeForm } from "../employee-form";
import { createEmployee } from "../actions";

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add employee</h1>
      <EmployeeForm action={createEmployee} cancelHref="/dashboard/employees" />
    </div>
  );
}
