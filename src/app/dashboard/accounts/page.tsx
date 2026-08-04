import { createClient } from "@/lib/supabase/server";
import { LinkButton, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, Tr, Th, Td } from "@/components/ui/table";
import { getAccountStatus } from "@/lib/account-status";
import { formatPKR } from "@/lib/format";
import { AccountBalance } from "@/lib/types";
import { setAccountArchived } from "./actions";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase
    .from("account_balances")
    .select("*")
    .order("is_archived")
    .order("name");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <LinkButton href="/dashboard/accounts/new">Add account</LinkButton>
      </div>

      <Table>
        <THead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Status</Th>
            <Th className="text-right">Balance</Th>
            <Th className="text-right">Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {(accounts || []).map((account) => {
            const status = account.is_archived
              ? { label: "Archived", tone: "slate" as const }
              : getAccountStatus(account as AccountBalance);
            return (
              <Tr key={account.id}>
                <Td className="font-medium text-slate-900">{account.name}</Td>
                <Td className="capitalize">{account.type}</Td>
                <Td>
                  <Badge tone={status.tone}>{status.label}</Badge>
                </Td>
                <Td className="text-right">
                  {formatPKR(Number(account.balance))}
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-3">
                    <LinkButton
                      href={`/dashboard/accounts/${account.id}/edit`}
                      variant="ghost"
                      size="sm"
                    >
                      Edit
                    </LinkButton>
                    <form
                      action={setAccountArchived.bind(
                        null,
                        account.id,
                        !account.is_archived,
                      )}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        {account.is_archived ? "Unarchive" : "Archive"}
                      </Button>
                    </form>
                  </div>
                </Td>
              </Tr>
            );
          })}
          {(!accounts || accounts.length === 0) && (
            <Tr>
              <Td colSpan={5} className="text-center text-slate-400">
                No accounts yet.
              </Td>
            </Tr>
          )}
        </TBody>
      </Table>
    </div>
  );
}
