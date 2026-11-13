import { describe, expect, it } from "vitest";
import { explainProviderError } from "./user-model.server";
describe("avertissement compte externe", () => {
  it("prévient quand il n'y a plus de crédit", () => {
    expect(explainProviderError("ChatGPT (OpenAI)", "You exceeded your current quota")).toContain("n'a plus de crédit");
    expect(explainProviderError("Claude (Anthropic)", "Your credit balance is too low")).toContain("n'a plus de crédit");
  });
  it("prévient quand la clé est refusée", () => {
    expect(explainProviderError("Mistral AI", "401 Unauthorized")).toContain("n'est plus acceptée");
  });
});
