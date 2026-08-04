// Fixed USD→PKR conversion rate used when an invoice payment is recorded.
// Update this constant if the real exchange rate moves meaningfully.
export const USD_TO_PKR_RATE = 277;

// How a converted PKR payment is split across account types.
export const SPLIT_RATIOS = {
  business: 0.4,
  personal: 0.3,
  savings: 0.3,
} as const;

// Flat platform withdrawal fee tiers (e.g. Payoneer-style), keyed by
// invoice/payment size in USD.
export function calculatePlatformFee(amountUsd: number): number {
  if (amountUsd <= 0) return 0;
  if (amountUsd <= 199) return 2;
  if (amountUsd <= 499) return 5;
  if (amountUsd <= 999) return 10;
  return 29;
}

export function convertUsdToPkr(amountUsd: number, feeOverride?: number) {
  const fee = feeOverride ?? calculatePlatformFee(amountUsd);
  const netUsd = Math.max(amountUsd - fee, 0);
  const netPkr = netUsd * USD_TO_PKR_RATE;
  return { fee, netUsd, netPkr };
}

export function splitPkr(netPkr: number) {
  return {
    business: netPkr * SPLIT_RATIOS.business,
    personal: netPkr * SPLIT_RATIOS.personal,
    savings: netPkr * SPLIT_RATIOS.savings,
  };
}

// Projects the PKR split for all outstanding (unpaid/partial) invoices, as
// if each were paid in full today — used to show an "upcoming" balance on
// account cards before any payment is actually recorded.
export function projectUpcomingSplit(
  invoices: { amount: number; paid_amount: number; status: string }[],
) {
  const totals = { business: 0, personal: 0, savings: 0 };
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    const outstanding = Number(inv.amount) - Number(inv.paid_amount);
    if (outstanding <= 0) continue;
    const { netPkr } = convertUsdToPkr(outstanding);
    const split = splitPkr(netPkr);
    totals.business += split.business;
    totals.personal += split.personal;
    totals.savings += split.savings;
  }
  return totals;
}
