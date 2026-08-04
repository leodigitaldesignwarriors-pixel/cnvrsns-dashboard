import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "../../client-form";
import { updateClientRecord } from "../../actions";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (!client) notFound();

  const updateWithId = updateClientRecord.bind(null, id);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit client</h1>
      <ClientForm
        action={updateWithId}
        client={client}
        cancelHref={`/dashboard/clients/${id}`}
      />
    </div>
  );
}
