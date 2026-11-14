import { describe, expect, it } from "vitest";
import { checkTrade, minOut } from "./bnb";
const base = { amountBnb: 0.1, balanceBnb: 1, priceAgeMs: 1000, slippageBps: 100, side: "buy" as const, balanceUsdt: 0, amountUsdt: 0 };
describe("BNB controller", () => {
  it("1% slippage keeps 99% of quote", () => { expect(minOut(10000n, 100)).toBe(9900n); });
  it("rejects slippage above 3%", () => { expect(() => minOut(100n, 301)).toThrow(); });
  it("accepts a valid buy", () => { expect(checkTrade(base)).toEqual([]); });
  it("blocks trades above 0.5 BNB", () => { expect(checkTrade({ ...base, amountBnb: 0.6 })).toContain("Montant supérieur au plafond de 0.5 BNB."); });
  it("blocks stale price over 60s", () => { expect(checkTrade({ ...base, priceAgeMs: 61_000 }).length).toBe(1); });
  it("blocks insufficient balance", () => { expect(checkTrade({ ...base, balanceBnb: 0.1 })).toContain("Solde BNB insuffisant (frais compris)."); });
});
