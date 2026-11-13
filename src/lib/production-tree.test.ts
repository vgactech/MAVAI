import { describe, it, expect } from "vitest";
import { toSeconds, formatDuration, canHaveChild } from "./production-tree";
describe("durée cible", () => {
  it("convertit une durée libre", () => expect(toSeconds(2, 30)).toBe(150));
  it("refuse zéro et plus de 24 h", () => { expect(toSeconds(0, 0)).toBeNull(); expect(toSeconds(1441, 0)).toBeNull(); });
  it("affiche 30 min", () => expect(formatDuration(1800)).toBe("30 min"));
});
describe("arbre", () => {
  it("un plan se range dans une scène, pas dans une séquence", () => { expect(canHaveChild("scene","shot")).toBe(true); expect(canHaveChild("sequence","shot")).toBe(false); });
});
