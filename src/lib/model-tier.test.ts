import { describe, expect, it } from "vitest";
import { wantsAdvancedModel } from "./model-tier";
describe("model tier", () => {
  it("uses the advanced model for a final review", () => expect(wantsAdvancedModel("Fais la révision finale du script")).toBe(true));
  it("uses the cheap model for an ordinary turn", () => expect(wantsAdvancedModel("Écris trois idées de plans")).toBe(false));
});
