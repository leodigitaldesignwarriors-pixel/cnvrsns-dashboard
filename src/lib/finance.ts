// Fixed USD→PKR conversion rate used when an invoice payment is recorded.
// Update this constant if the real exchange rate moves meaningfully.
export const USD_TO_PKR_RATE = 277;

// Monthly ledger split — applied once a month via "Close Month", not per
// payment. Change these if the ratios ever need to differ from 30% / 50-50.
export const SAVINGS_CUT_RATIO = 0.3;
export const PARTNER_SPLIT_RATIO = 0.5;

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

// Income - Business Expenses = Net; Net - 30% (Savings) = Profit; Profit
// split 50/50 across the two partners. Run this once per month at close
// time, and live (as a preview) for the current, not-yet-closed month.
export function computeMonthlyLedger({
  income,
  businessExpenses,
}: {
  income: number;
  businessExpenses: number;
}) {
  const netAmount = income - businessExpenses;
  const savingsCut = Math.max(netAmount, 0) * SAVINGS_CUT_RATIO;
  const profitTotal = netAmount - savingsCut;
  const partnerAProfit = profitTotal * PARTNER_SPLIT_RATIO;
  const partnerBProfit = profitTotal * PARTNER_SPLIT_RATIO;
  return { netAmount, savingsCut, profitTotal, partnerAProfit, partnerBProfit };
}

// Expected Total = current balance + what would land (after platform fee
// and PKR conversion) if every outstanding invoice were paid today.
export function projectExpectedTotal(
  currentBalance: number,
  outstandingInvoices: { amount: number; paid_amount: number; status: string }[],
) {
  let projected = currentBalance;
  for (const inv of outstandingInvoices) {
    if (inv.status === "paid") continue;
    const outstanding = Number(inv.amount) - Number(inv.paid_amount);
    if (outstanding <= 0) continue;
    projected += convertUsdToPkr(outstanding).netPkr;
  }
  return projected;
}
