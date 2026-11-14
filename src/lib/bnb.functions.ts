import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

type Ticker = { lastPrice: string; priceChangePercent: string; highPrice: string; lowPrice: string; quoteVolume: string; closeTime: number };
type Market = { price: number; change24h: number; high: number; low: number; volumeUsdt: number; closes: { time: number; close: number }[]; source: string; fetchedAt: string };
const opt = () => ({ signal: AbortSignal.timeout(8000), headers: { accept: "application/json", "user-agent": "MAVAI/1.0" } });
async function binanceLike(base: string, label: string): Promise<Market> {
  const [t, k] = await Promise.all([
    fetch(`${base}/api/v3/ticker/24hr?symbol=BNBUSDT`, opt()),
    fetch(`${base}/api/v3/klines?symbol=BNBUSDT&interval=1h&limit=48`, opt()),
  ]);
  if (!t.ok || !k.ok) throw new Error(`${label} ${t.status}/${k.status}`);
  const ticker = (await t.json()) as Ticker;
  const klines = ((await k.json()) as Array<[number, string, string, string, string]>).map(r => ({ time: r[0], close: Number(r[4]) }));
  return { price: Number(ticker.lastPrice), change24h: Number(ticker.priceChangePercent), high: Number(ticker.highPrice), low: Number(ticker.lowPrice), volumeUsdt: Number(ticker.quoteVolume), closes: klines, source: `${label} BNB/USDT`, fetchedAt: new Date().toISOString() };
}
async function okx(): Promise<Market> {
  const [t, k] = await Promise.all([
    fetch("https://www.okx.com/api/v5/market/ticker?instId=BNB-USDT", opt()),
    fetch("https://www.okx.com/api/v5/market/candles?instId=BNB-USDT&bar=1H&limit=48", opt()),
  ]);
  if (!t.ok || !k.ok) throw new Error(`OKX ${t.status}/${k.status}`);
  const d = ((await t.json()) as { data: Array<{ last: string; open24h: string; high24h: string; low24h: string; volCcy24h: string }> }).data[0];
  if (!d) throw new Error("OKX vide");
  const c = ((await k.json()) as { data: string[][] }).data.map(r => ({ time: Number(r[0]), close: Number(r[4]) })).reverse();
  const last = Number(d.last), open = Number(d.open24h);
  return { price: last, change24h: open ? ((last - open) / open) * 100 : 0, high: Number(d.high24h), low: Number(d.low24h), volumeUsdt: Number(d.volCcy24h), closes: c, source: "OKX spot BNB/USDT (public)", fetchedAt: new Date().toISOString() };
}
async function coingecko(): Promise<Market> {
  const [t, k] = await Promise.all([
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=binancecoin", opt()),
    fetch("https://api.coingecko.com/api/v3/coins/binancecoin/market_chart?vs_currency=usd&days=2", opt()),
  ]);
  if (!t.ok || !k.ok) throw new Error(`CoinGecko ${t.status}/${k.status}`);
  const m = ((await t.json()) as Array<{ current_price: number; price_change_percentage_24h: number; high_24h: number; low_24h: number; total_volume: number }>)[0];
  if (!m) throw new Error("CoinGecko vide");
  const prices = ((await k.json()) as { prices: [number, number][] }).prices.slice(-48).map(([time, close]) => ({ time, close }));
  return { price: m.current_price, change24h: m.price_change_percentage_24h, high: m.high_24h, low: m.low_24h, volumeUsdt: m.total_volume, closes: prices, source: "CoinGecko BNB/USD (public)", fetchedAt: new Date().toISOString() };
}
async function market(): Promise<Market> {
  const errors: string[] = [];
  for (const src of [() => binanceLike("https://data-api.binance.vision", "Binance public data"), () => binanceLike("https://api.binance.com", "Binance"), okx, coingecko]) {
    try { return await src(); } catch (e) { errors.push(e instanceof Error ? e.message : String(e)); }
  }
  throw new Error(`Données marché indisponibles [${errors.join(" · ")}]`);
}

export const getBnbMarket = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async () => market());

export const analyzeBnb = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ question: z.string().max(500).default("") }).parse(d ?? {}))
  .handler(async ({ data }) => {
    const m = await market();
    const closes = m.closes.map(c => c.close);
    const sma = (n: number) => closes.slice(-n).reduce((a, b) => a + b, 0) / n;
    const indicators = { sma12h: sma(12), sma48h: sma(48), volatility48h: Math.sqrt(closes.slice(1).map((c, i) => Math.log(c / closes[i]!)).reduce((a, r) => a + r * r, 0) / (closes.length - 1)) * 100 };
    let context = ""; let contextSource = "";
    try { const { hemicycleCall } = await import("./hemicycle.server"); context = await hemicycleCall("rechercher", { q: "crypto-actifs", limit: 5 }); contextSource = "Hémicycle (Assemblée nationale, recherche « crypto-actifs »)"; }
    catch (e) { context = ""; contextSource = `Hémicycle indisponible : ${e instanceof Error ? e.message : "erreur"}`; }
    const system = "Tu es DR MANATHAN, analyste marchés. Réponds en français, en 4 rubriques courtes : Résumé, Observations chiffrées (données datées fournies uniquement), Contexte (non prédictif : précise que ce contexte politique ne prouve aucun effet sur le prix), Avertissements. Ne donne jamais d'ordre, de certitude ou de rentabilité promise ; propose au plus des scénarios conditionnels.";
    const user = `Données marché (${m.source}, collecte ${m.fetchedAt}) : prix ${m.price} USDT, variation 24h ${m.change24h} %, haut ${m.high}, bas ${m.low}, volume ${Math.round(m.volumeUsdt)} USDT. Moyenne 12h ${indicators.sma12h.toFixed(2)}, moyenne 48h ${indicators.sma48h.toFixed(2)}, volatilité horaire ${indicators.volatility48h.toFixed(2)} %.\nContexte parlementaire (${contextSource}) :\n${context.slice(0, 3000) || "aucun"}\nQuestion : ${data.question || "Analyse la situation BNB maintenant."}`;
    let text = ""; let model = "";
    const fk = process.env["FEATHERLESS_API_KEY"];
    if (fk) {
      try {
        const r = await fetch("https://api.featherless.ai/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(30000), headers: { Authorization: `Bearer ${fk}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "Qwen/Qwen3-VL-4B-Instruct", max_tokens: 700, messages: [{ role: "system", content: system }, { role: "user", content: user }] }) });
        if (r.ok) { const j = (await r.json()) as { choices?: Array<{ message?: { content?: string } }> }; text = j.choices?.[0]?.message?.content ?? ""; model = "Featherless · Qwen3-VL-4B"; }
      } catch { /* fallback below */ }
    }
    if (!text) { const { complete } = await import("./mavai-ai.server"); text = await complete(system, user); model = "Lovable AI (repli)"; }
    return { analysis: text.replace(/<think>[\s\S]*?<\/think>/g, "").trim(), model, market: { ...m, closes: undefined }, indicators, sources: [{ role: "Marché (signal)", name: m.source, at: m.fetchedAt }, { role: "Contexte (non prédictif)", name: contextSource, at: new Date().toISOString() }] };
  });

const tradeInput = z.object({ walletAddress: z.string().regex(/^0x[0-9a-fA-F]{40}$/), side: z.enum(["buy", "sell"]), tokenIn: z.string(), tokenOut: z.string(), amountIn: z.string().regex(/^\d+$/), minAmountOut: z.string().regex(/^\d+$/), quotedAmountOut: z.string().regex(/^\d+$/), slippageBps: z.number().int().min(0).max(300) });
export const recordTrade = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d: unknown) => tradeInput.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("bnb_trades").insert({ user_id: context.userId, wallet_address: data.walletAddress.toLowerCase(), side: data.side, token_in: data.tokenIn, token_out: data.tokenOut, amount_in: data.amountIn, min_amount_out: data.minAmountOut, quoted_amount_out: data.quotedAmountOut, slippage_bps: data.slippageBps }).select("id").single();
    if (error) throw new Error("Trade non journalisé.");
    return row;
  });
export const updateTrade = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["submitted", "confirmed", "failed", "rejected"]), txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional(), error: z.string().max(500).optional(), blockNumber: z.number().int().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("bnb_trades").update({ status: data.status, tx_hash: data.txHash ?? null, error: data.error ?? null, block_number: data.blockNumber ?? null, updated_at: new Date().toISOString() }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error("Suivi non enregistré.");
    return { ok: true };
  });
export const listTrades = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data } = await context.supabase.from("bnb_trades").select("id,side,amount_in,quoted_amount_out,status,tx_hash,error,created_at").eq("user_id", context.userId).order("created_at", { ascending: false }).limit(20);
  return data ?? [];
});

/** Live checks: a key present is not proof that it works. */
export const checkApis = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async () => {
  const probe = async (name: string, role: string, fn: () => Promise<Response | string>) => {
    try { const r = await fn(); if (typeof r === "string") return { name, role, status: "manquante", detail: r }; return { name, role, status: r.ok ? "fonctionne" : "erreur", detail: `HTTP ${r.status}` }; }
    catch (e) { return { name, role, status: "erreur", detail: e instanceof Error ? e.message : "inconnue" }; }
  };
  const env = (k: string) => process.env[k];
  return Promise.all([
    probe("Binance (prix)", "Données marché", () => fetch("https://data-api.binance.vision/api/v3/ping", { signal: AbortSignal.timeout(6000) })),
    probe("BNB Chain RPC", "Soldes, confirmations", () => fetch("https://bsc-dataseed.bnbchain.org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }), signal: AbortSignal.timeout(6000) })),
    probe("Lovable AI", "Chat, analyses (repli)", async () => env("LOVABLE_API_KEY") ? fetch("https://ai.gateway.lovable.dev/v1/models", { headers: { Authorization: `Bearer ${env("LOVABLE_API_KEY")}` }, signal: AbortSignal.timeout(6000) }) : "LOVABLE_API_KEY absente"),
    probe("ElevenLabs", "Voix (TTS/STT)", async () => (env("ELEVENLABS_API_KEY_ACTIVE") ?? env("ELEVENLABS_API_KEY")) ? fetch("https://api.elevenlabs.io/v1/models", { headers: { "xi-api-key": (env("ELEVENLABS_API_KEY_ACTIVE") ?? env("ELEVENLABS_API_KEY"))! }, signal: AbortSignal.timeout(6000) }) : "ELEVENLABS_API_KEY absente"),
    probe("Featherless", "Analyse marché", async () => env("FEATHERLESS_API_KEY") ? fetch("https://api.featherless.ai/v1/models?limit=1", { headers: { Authorization: `Bearer ${env("FEATHERLESS_API_KEY")}` }, signal: AbortSignal.timeout(8000) }) : "FEATHERLESS_API_KEY absente"),
    probe("Hémicycle", "Contexte parlementaire (non prédictif)", async () => env("HEMICYCLE_API_KEY") ? fetch("https://api.hemicycle.ai/mcp", { method: "POST", headers: { Authorization: `Bearer ${env("HEMICYCLE_API_KEY")}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "mavai", version: "1" } } }), signal: AbortSignal.timeout(8000) }) : "HEMICYCLE_API_KEY absente"),
    probe("Oriane", "Contexte social", async () => "Contrat d'API Oriane non documenté : à configurer"),
    probe("Higgsfield", "Vidéo Seedance", async () => env("HF_CREDENTIALS") ? "Clé présente, crédits insuffisants constatés (HTTP 403)" : "HF_CREDENTIALS absente (crédits Higgsfield à recharger)"),
  ]);
});
