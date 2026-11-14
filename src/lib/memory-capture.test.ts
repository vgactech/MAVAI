import { describe, expect, it } from "vitest";
import { extractMemoryRule } from "./memory-capture";
describe("extractMemoryRule", () => {
  it("saves an explicit standing rule", () => expect(extractMemoryRule("Rappelle-toi de toujours lister les questions sans réponse")).not.toBeNull());
  it("ignores an ordinary question", () => expect(extractMemoryRule("Quelle heure est-il à Paris ?")).toBeNull());
});
