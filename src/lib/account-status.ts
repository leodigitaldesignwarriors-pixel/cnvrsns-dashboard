import { AccountBalance } from "./types";

export type StatusTone = "green" | "yellow" | "red" | "slate";

export function getAccountStatus(
  account: Pick<AccountBalance, "balance" | "safety_minimum">,
): { label: string; tone: StatusTone } {
  const { balance, safety_minimum } = account;

  if (balance < 0) return { label: "Negative", tone: "red" };

  if (safety_minimum != null) {
    if (balance < safety_minimum) return { label: "Below minimum", tone: "red" };
    if (balance < safety_minimum * 1.15) return { label: "Low", tone: "yellow" };
    return { label: "Safe", tone: "green" };
  }

  if (balance === 0) return { label: "Empty", tone: "slate" };
  return { label: "Healthy", tone: "green" };
}
