// Picks the chat model from the user's own connected AI account (most recently connected wins).
import type { ProviderId } from "./external-providers";

export const CHAT_CAPABLE: Partial<Record<ProviderId, { name: string; baseURL: string; model: string }>> = {
  openai: { name: "ChatGPT (OpenAI)", baseURL: "https://api.openai.com/v1", model: "gpt-5.4" },
  anthropic: { name: "Claude (Anthropic)", baseURL: "https://api.anthropic.com/v1", model: "claude-sonnet-5-5" },
  gemini: { name: "Gemini (Google)", baseURL: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-2.5-flash" },
  mistral: { name: "Mistral AI", baseURL: "https://api.mistral.ai/v1", model: "mistral-medium-latest" },
  perplexity: { name: "Perplexity", baseURL: "https://api.perplexity.ai", model: "sonar" },
};

export async function getUserChatModel(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_api_credentials").select("provider,key_ciphertext").eq("user_id", userId).in("provider", Object.keys(CHAT_CAPABLE)).order("updated_at", { ascending: false }).limit(1).maybeSingle();
  if (!data) return null;
  const cfg = CHAT_CAPABLE[data.provider as ProviderId];
  if (!cfg) return null;
  const { decryptConnectionKey } = await import("./connectionKeyCrypto.server");
  return { provider: data.provider as ProviderId, ...cfg, apiKey: decryptConnectionKey(data.key_ciphertext) };
}

/** Turns a provider failure into a clear French warning for the user. */
export function explainProviderError(name: string, message: string): string {
  const m = message.toLowerCase();
  if (/(quota|credit|billing|balance|insufficient|payment|402)/.test(m)) return `Votre compte ${name} n'a plus de crédit. Rechargez-le chez ${name} ; MAVAI répond en attendant avec son modèle intégré.`;
  if (/(429|rate limit|too many)/.test(m)) return `Votre compte ${name} a atteint sa limite d'utilisation pour le moment ; MAVAI répond avec son modèle intégré.`;
  if (/(401|403|invalid|unauthori|api key|permission)/.test(m)) return `Votre clé ${name} n'est plus acceptée. Remplacez-la dans Paramètres ; MAVAI répond avec son modèle intégré.`;
  return `Votre compte ${name} n'a pas répondu (${message.slice(0, 120)}) ; MAVAI répond avec son modèle intégré.`;
}
