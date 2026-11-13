import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isProviderId, type ProviderId } from "@/lib/external-providers";

async function verify(provider: ProviderId, key: string): Promise<boolean> {
  const h = (o: Record<string, string>) => ({ headers: o });
  const req: Record<ProviderId, [string, RequestInit]> = {
    openai: ["https://api.openai.com/v1/models", h({ Authorization: `Bearer ${key}` })],
    anthropic: ["https://api.anthropic.com/v1/models", h({ "x-api-key": key, "anthropic-version": "2023-06-01" })],
    mistral: ["https://api.mistral.ai/v1/models", h({ Authorization: `Bearer ${key}` })],
    gemini: [`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`, {}],
    perplexity: ["https://api.perplexity.ai/models", h({ Authorization: `Bearer ${key}` })],
    elevenlabs: ["https://api.elevenlabs.io/v1/models", h({ "xi-api-key": key })],
    replicate: ["https://api.replicate.com/v1/account", h({ Authorization: `Bearer ${key}` })],
  };
  try { const [u, i] = req[provider]; const r = await fetch(u, i); return r.ok; } catch { return false; }
}

export const listExternalConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.from("user_api_credentials").select("provider,key_hint,verified_at,updated_at").eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveExternalConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { provider: string; key: string }) => {
    if (!isProviderId(i?.provider)) throw new Error("Service inconnu");
    const key = typeof i.key === "string" ? i.key.trim() : "";
    if (key.length < 8 || key.length > 500) throw new Error("Clé invalide");
    return { provider: i.provider, key };
  })
  .handler(async ({ data, context }) => {
    const ok = await verify(data.provider, data.key);
    if (!ok) throw new Error("Le service a refusé cette clé. Vérifiez-la et réessayez.");
    const { encryptConnectionKey } = await import("@/lib/connectionKeyCrypto.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("user_api_credentials").upsert({
      user_id: context.userId, provider: data.provider, key_ciphertext: encryptConnectionKey(data.key),
      key_hint: `••••${data.key.slice(-4)}`, verified_at: now, updated_at: now,
    }, { onConflict: "user_id,provider" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExternalConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { provider: string }) => { if (!isProviderId(i?.provider)) throw new Error("Service inconnu"); return i; })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_api_credentials").delete().eq("user_id", context.userId).eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
