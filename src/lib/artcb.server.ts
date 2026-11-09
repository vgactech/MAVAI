// Server-only ARTcB bridge. DEBUG MODE ACTIVE.
// CERTIFIED_100=false | unique_human_proven=false
export type ArtcbResult = { reply: string | null; encoded: boolean; stored: boolean };

export async function callARTcB(question: string, userId: string, sessionId: string, signal?: AbortSignal): Promise<ArtcbResult | null> {
  const base = process.env["ARTCB_API_URL"];
  if (!base) {
    console.debug("[mavai] ARTcB unavailable: URL not configured");
    return null;
  }
  try {
    const url = new URL("api/v1/ai/think", `${base.replace(/\/+$/, "")}/`);
    if (url.protocol !== "https:") {
      console.warn("[mavai] ARTcB unavailable: HTTPS required");
      return null;
    }
    const headers = new Headers({ "Content-Type": "application/json" });
    const key = process.env["ARTCB_API_KEY"];
    if (key) headers.set("Authorization", `Bearer ${key}`);
    const res = await fetch(url, {
      method: "POST",
      headers,
      redirect: "error",
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000),
      body: JSON.stringify({
        question,
        agent: `mavai-user-${userId.slice(0, 8)}`,
        session_id: sessionId,
        inject_context: true,
        visibility: "private",
        store_block: true,
      }),
    });
    if (!res.ok) {
      console.warn("[mavai] ARTcB unavailable", res.status);
      return null;
    }
    const json = await res.json() as {
      message?: unknown; reply?: unknown; content?: unknown; text?: unknown;
      think_complete?: boolean; graph_id?: unknown; block_index?: unknown;
    };
    const text = json.message ?? json.reply ?? json.content ?? json.text;
    // /think currently returns an encoding receipt, not necessarily an AI answer.
    // Never present that acknowledgement as an intelligent response.
    const receipt = typeof text === "string" && /^Raisonnement (?:encodé|gravé)(?:\s|$)/i.test(text.trim());
    const result = {
      reply: typeof text === "string" && text.trim() && !receipt ? text.trim() : null,
      encoded: json.think_complete === true,
      stored: typeof json.block_index === "number",
    };
    console.debug(result.reply
      ? "[DEBUG][messages] ARTcB reply received"
      : "[DEBUG][messages] ARTcB encoding receipt received; answer provided by Lovable AI");
    return result;
  } catch {
    // Do not log provider bodies, URLs, tokens, or conversation content.
    console.warn("[mavai] ARTcB unavailable: request failed");
    return null;
  }
}