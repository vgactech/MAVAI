import { describe, expect, it } from "vitest";
import { memoryRepoName, turnFiles } from "@/lib/github-memory-layout";

const t = { ownerId: "11111111-2222-3333-4444-555555555555", ownerMarker: "m1", projectId: "p1", conversationId: "c1", conversationTitle: "T", userMessageId: "u1", userText: "Bonjour", userParts: [], assistantMessageId: "a1", answer: "Salut", assistantParts: [{ type: "reasoning", text: "thinking" }, { type: "data-step", id: "memory", data: { label: "Mémoire", status: "done" } }], model: "m", tokens: 5, memoryCount: 0, artcbStored: false, systemPrompt: "S", startedAt: new Date("2026-11-13T10:00:00Z"), durationMs: 1000, status: "completed" as const };

describe("github memory layout", () => {
  it("names one repo per user", () => { expect(memoryRepoName(t.ownerId)).toBe("mavai-memoire-111111112222"); });
  it("uses the KLERIO folders", () => {
    const keys = Object.keys(turnFiles(t));
    expect(keys).toContain("conversations/2026/11/c1/messages/a1.json");
    expect(keys).toContain("ai-runs/2026/11/13/a1/request.json");
    expect(keys).toContain("tasks/a1/manifest.json");
    expect(keys).toContain("events/2026/11/13/a1-before.json");
  });
  it("stamps every file with the owner marker and keeps reasoning verbatim", () => {
    const files = turnFiles(t);
    for (const c of Object.values(files)) expect(JSON.parse(c).owner_marker).toBe("m1");
    expect(JSON.parse(files["ai-runs/2026/11/13/a1/result.json"]!).reasoning).toEqual(["thinking"]);
  });
});
