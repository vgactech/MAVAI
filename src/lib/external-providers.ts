export const EXTERNAL_PROVIDERS = [
  { id: "openai", name: "ChatGPT (OpenAI)", hint: "sk-…", url: "https://platform.openai.com/api-keys" },
  { id: "anthropic", name: "Claude (Anthropic)", hint: "sk-ant-…", url: "https://console.anthropic.com/settings/keys" },
  { id: "mistral", name: "Mistral AI", hint: "Clé Mistral", url: "https://console.mistral.ai/api-keys" },
  { id: "gemini", name: "Gemini (Google)", hint: "AIza…", url: "https://aistudio.google.com/apikey" },
  { id: "perplexity", name: "Perplexity", hint: "pplx-…", url: "https://www.perplexity.ai/settings/api" },
  { id: "elevenlabs", name: "ElevenLabs", hint: "Clé ElevenLabs", url: "https://elevenlabs.io/app/settings/api-keys" },
  { id: "replicate", name: "Replicate", hint: "r8_…", url: "https://replicate.com/account/api-tokens" },
] as const;
export type ProviderId = (typeof EXTERNAL_PROVIDERS)[number]["id"];
export const isProviderId = (v: unknown): v is ProviderId => EXTERNAL_PROVIDERS.some((p) => p.id === v);
