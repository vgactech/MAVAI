// Real internet access for MAVAI: server-side Google News RSS lookup whose success is reported to the chat diode.
export type WebSource = { title: string; url: string; date: string | null; source: string | null };

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

export function parseNewsRss(xml: string, limit = 6): WebSource[] {
  const items: WebSource[] = [];
  for (const match of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const body = match[1] ?? "";
    const pick = (tag: string) => { const m = body.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`)); return m?.[1] ? decode(m[1]) : null; };
    const title = pick("title"); const url = pick("link");
    if (!title || !url || !/^https?:\/\//.test(url)) continue;
    items.push({ title, url, date: pick("pubDate"), source: pick("source") });
    if (items.length >= limit) break;
  }
  return items;
}

export type WebSearchResult = { ok: boolean; sources: WebSource[]; latencyMs: number; error?: string };

export async function searchWeb(query: string, signal?: AbortSignal): Promise<WebSearchResult> {
  const started = Date.now();
  const q = query.replace(/\s+/g, " ").trim().slice(0, 150);
  if (!q) return { ok: false, sources: [], latencyMs: 0, error: "Requête vide" };
  const timeout = AbortSignal.timeout(6000);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const res = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=fr&gl=FR&ceid=FR:fr`, { signal: combined, headers: { "User-Agent": "MAVAI/1.0" } });
    if (!res.ok) return { ok: false, sources: [], latencyMs: Date.now() - started, error: `HTTP ${res.status}` };
    return { ok: true, sources: parseNewsRss(await res.text()), latencyMs: Date.now() - started };
  } catch (e) {
    if (signal?.aborted) throw e;
    return { ok: false, sources: [], latencyMs: Date.now() - started, error: e instanceof Error ? e.message : "Réseau indisponible" };
  }
}

export async function checkModel(apiKey: string, modelId: string) {
  const started = Date.now();
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/models", { headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(6000) });
    if (!res.ok) return { ok: false, model: modelId, latencyMs: Date.now() - started, error: `HTTP ${res.status}` };
    const listed = (await res.text()).includes(`"${modelId}"`);
    return { ok: listed, model: modelId, latencyMs: Date.now() - started, ...(listed ? {} : { error: "Modèle non listé" }) };
  } catch (e) {
    return { ok: false, model: modelId, latencyMs: Date.now() - started, error: e instanceof Error ? e.message : "Injoignable" };
  }
}
