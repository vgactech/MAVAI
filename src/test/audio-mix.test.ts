import { describe, it, expect } from "vitest";
import { trackGain } from "@/lib/audio-mix";
describe("independent audio tracks", () => {
  it("changing dialogue volume leaves music gain unchanged", () => { const music = { volume: 0.8, muted: false, solo: false }; const dialogue = { volume: 0.2, muted: false, solo: false }; expect(trackGain(dialogue, false)).toBe(0.2); expect(trackGain(music, false)).toBe(0.8); });
  it("mute silences only the selected track", () => { expect(trackGain({ volume: 1, muted: true, solo: false }, false)).toBe(0); expect(trackGain({ volume: 1, muted: false, solo: false }, false)).toBe(1); });
  it("solo excludes tracks not selected", () => { expect(trackGain({ volume: 0.8, muted: false, solo: false }, true)).toBe(0); expect(trackGain({ volume: 0.6, muted: false, solo: true }, true)).toBe(0.6); });
});