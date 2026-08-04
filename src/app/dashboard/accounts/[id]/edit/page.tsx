import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "../../account-form";
import { updateAccount } from "../../actions";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: account } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .single();

  if (!account) notFound();

  const updateWithId = updateAccount.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit account</h1>
      <AccountForm action={updateWithId} account={account} />
    </div>
  );
}
