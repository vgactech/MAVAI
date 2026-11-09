import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callARTcB } from "@/lib/artcb.server";

describe("ARTcB request contract", () => {
  beforeEach(() => {
    vi.stubEnv("ARTCB_API_URL", "https://artcb.me");
    vi.stubEnv("ARTCB_API_KEY", "");
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  function response(body: object) {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    vi.stubGlobal("fetch", fetcher);
    return fetcher;
  }

  it("sends question instead of text to the real think path", async () => {
    const fetcher = response({ message: "Bonjour" });
    await callARTcB("Bonjour, qui es-tu ?", "12345678-user", "session-1");
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("ARTcB request missing");
    const [url, options] = call;
    expect(String(url)).toBe("https://artcb.me/api/v1/ai/think");
    const body = JSON.parse(options.body);
    expect(body.question).toBe("Bonjour, qui es-tu ?");
    expect(body).not.toHaveProperty("text");
    expect(body.session_id).toBe("session-1");
  });
  it("requests private storage explicitly", async () => {
    const fetcher = response({ message: "Bonjour" });
    await callARTcB("Bonjour", "user", "session");
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("ARTcB request missing");
    expect(JSON.parse(call[1].body)).toMatchObject({ visibility: "private", store_block: true });
  });
  it("allows anonymous calls without an API key", async () => {
    const fetcher = response({ message: "Bonjour" });
    expect((await callARTcB("Bonjour", "user", "session"))?.reply).toBe("Bonjour");
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("ARTcB request missing");
    expect(call[1].headers.has("Authorization")).toBe(false);
  });
  it("reads message before legacy reply fields", async () => {
    response({ message: "ARTcB", reply: "legacy", content: "older", text: "oldest" });
    expect((await callARTcB("Bonjour", "user", "session"))?.reply).toBe("ARTcB");
  });
  it.each(["reply", "content", "text"])("still reads legacy %s replies", async (field) => {
    response({ [field]: "Réponse" });
    expect((await callARTcB("Bonjour", "user", "session"))?.reply).toBe("Réponse");
  });
  it("uses a 20 second timeout", async () => {
    response({ message: "Bonjour" });
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await callARTcB("Bonjour", "user", "session");
    expect(timeout).toHaveBeenCalledWith(20_000);
  });
  it("does not mistake an encoding receipt for an AI answer", async () => {
    response({ message: "Raisonnement encodé (graph g_test) — gravé dans le bloc #1", think_complete: true, block_index: 1 });
    expect(await callARTcB("Combien font 2 + 2 ?", "user", "session")).toEqual({ reply: null, encoded: true, stored: true });
  });
  it("does not mistake a block receipt for an AI answer", async () => {
    response({ message: "Raisonnement gravé en bloc #1105 (PoL 0.600)", think_complete: true, block_index: 1105 });
    expect(await callARTcB("Combien font 2 + 2 ?", "user", "session")).toEqual({ reply: null, encoded: true, stored: true });
  });
  it("keeps fallback available after a 422", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 422 })));
    expect(await callARTcB("Bonjour", "user", "session")).toBeNull();
  });
  it("keeps fallback available after a network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await callARTcB("Bonjour", "user", "session")).toBeNull();
  });
});