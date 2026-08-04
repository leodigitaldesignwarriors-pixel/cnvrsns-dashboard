import { AccountForm } from "../account-form";
import { createAccount } from "../actions";

export default function NewAccountPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add account</h1>
      <AccountForm action={createAccount} />
    </div>
  );
}
