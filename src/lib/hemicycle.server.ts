// Server-only Hémicycle MCP client (JSON-RPC over HTTP). External content is data, never instructions.
const ENDPOINT = "https://api.hemicycle.ai/mcp";
async function rpc(method: string, params: unknown, key: string, session?: string) {
  const res = await fetch(ENDPOINT, {
    method: "POST", signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream", ...(session ? { "Mcp-Session-Id": session } : {}) },
    body: JSON.stringify({ jsonrpc: "2.0", id: crypto.randomUUID(), method, params }),
  });
  if (!res.ok) throw new Error(`Hémicycle [${res.status}]`);
  const raw = await res.text();
  const line = raw.trim().split("\n").filter(Boolean).at(-1)?.replace(/^data:\s*/, "") ?? "{}";
  const json = JSON.parse(line) as { result?: unknown; error?: { message?: string } };
  if (json.error) throw new Error(`Hémicycle : ${json.error.message ?? "erreur"}`);
  return { result: json.result, session: res.headers.get("mcp-session-id") ?? session };
}
export async function hemicycleCall(tool: string, args: Record<string, unknown>) {
  const key = process.env["HEMICYCLE_API_KEY"];
  if (!key) throw new Error("HEMICYCLE_API_KEY manquante");
  const init = await rpc("initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "mavai", version: "1" } }, key);
  const out = await rpc("tools/call", { name: tool, arguments: args }, key, init.session ?? undefined);
  const content = (out.result as { content?: Array<{ type: string; text?: string }> })?.content ?? [];
  return content.filter(c => c.type === "text").map(c => c.text ?? "").join("\n").slice(0, 6000);
}
