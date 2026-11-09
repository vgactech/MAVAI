import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CHAT_MODEL = "google/gemini-3-flash-preview";

/** Diode 1 = model reachable and listed; diode 2 = server really reached the internet. */
export const getChatHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { checkModel, searchWeb } = await import("./web-search.server");
    const key = process.env["LOVABLE_API_KEY"];
    const [model, web] = await Promise.all([
      key ? checkModel(key, CHAT_MODEL) : Promise.resolve({ ok: false, model: CHAT_MODEL, latencyMs: 0, error: "Clé IA absente" }),
      searchWeb("actualité"),
    ]);
    return { model, web: { ok: web.ok, latencyMs: web.latencyMs, count: web.sources.length, error: web.error ?? null }, checkedAt: new Date().toISOString() };
  });
