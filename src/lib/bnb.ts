// Shared BNB Chain constants (browser-safe). Mainnet, user-signed transactions only.
export const BSC_CHAIN_ID = 56;
export const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E" as const;
export const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as const;
export const USDT = "0x55d398326f99059fF775485246999027B3197955" as const;
export const MAX_TRADE_BNB = 0.5; // safety cap per trade
export const MAX_SLIPPAGE_BPS = 300;
export const MAX_DAILY_BNB = 2; // safety cap of BNB spent per rolling 24h
/** Minimum received after slippage, in base units. */
export function minOut(quoted: bigint, slippageBps: number): bigint {
  if (slippageBps < 0 || slippageBps > MAX_SLIPPAGE_BPS) throw new Error("Slippage hors limites (0–3 %).");
  return (quoted * BigInt(10000 - slippageBps)) / 10000n;
}
/** Deterministic pre-trade controller: the AI never bypasses it. */
export function checkTrade(input: { amountBnb: number; balanceBnb: number; priceAgeMs: number; slippageBps: number; side: "buy" | "sell"; balanceUsdt: number; amountUsdt: number; spentTodayBnb?: number }): string[] {
  const issues: string[] = [];
  if (input.priceAgeMs > 60_000) issues.push("Prix de plus d’une minute : actualisez.");
  if (input.slippageBps > MAX_SLIPPAGE_BPS) issues.push("Slippage supérieur à 3 %.");
  if (input.side === "buy") {
    if (input.amountBnb <= 0) issues.push("Montant nul.");
    if (input.amountBnb > MAX_TRADE_BNB) issues.push(`Montant supérieur au plafond de ${MAX_TRADE_BNB} BNB.`);
    if (input.amountBnb + (input.spentTodayBnb ?? 0) > MAX_DAILY_BNB) issues.push(`Plafond journalier de ${MAX_DAILY_BNB} BNB atteint.`);
    if (input.amountBnb + 0.002 > input.balanceBnb) issues.push("Solde BNB insuffisant (frais compris).");
  } else {
    if (input.amountUsdt <= 0) issues.push("Montant nul.");
    if (input.amountUsdt > input.balanceUsdt) issues.push("Solde USDT insuffisant.");
    if (input.balanceBnb < 0.002) issues.push("BNB insuffisant pour les frais.");
  }
  return issues;
}
