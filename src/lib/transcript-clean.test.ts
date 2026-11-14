import { expect, it } from "vitest";
import { cleanTranscript } from "./transcript-clean";
it("drops noise-only transcripts", () => expect(cleanTranscript("[background noise]")).toBe(""));
it("keeps spoken words", () => expect(cleanTranscript("[music] bonjour MAVAI")).toBe("bonjour MAVAI"));
