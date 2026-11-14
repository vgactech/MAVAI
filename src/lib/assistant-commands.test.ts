import { describe, expect, it } from "vitest";
import { parseCommand } from "./assistant-commands";
describe("parseCommand", () => {
  it("recognises mode silence with Oui chef ack", () => { expect(parseCommand("Mode silence")).toEqual({ id: "silence", ack: "Oui chef, je passe en mode silence." }); });
  it("recognises DR MANATHAN mode with accents/case", () => { expect(parseCommand("Passe en mode DR MANATHAN !")?.id).toBe("mode_dr"); });
  it("returns to MAVAI", () => { expect(parseCommand("retour à MAVAI")?.id).toBe("mode_av"); });
  it("does not trigger on a quoted word", () => { expect(parseCommand("écris le mot « silence »")).toBeNull(); });
  it("does not trigger inside an ordinary sentence", () => { expect(parseCommand("explique pourquoi le mode silence est utile en réunion")).toBeNull(); });
  it("coupe le micro", () => { expect(parseCommand("coupe le micro")?.id).toBe("mic_off"); });
});
