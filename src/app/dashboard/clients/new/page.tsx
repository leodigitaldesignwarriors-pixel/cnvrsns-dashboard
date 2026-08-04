import { ClientForm } from "../client-form";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add client</h1>
      <ClientForm action={createClientRecord} cancelHref="/dashboard/clients" />
    </div>
  );
}
