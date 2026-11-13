import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const CHAT_MODEL = "google/gemini-3-flash-preview";

export type Diode = { ok: boolean; detail: string; latencyMs?: number };

async function checkArtcb(): Promise<Diode> {
  const base = process.env["ARTCB_API_URL"];
  if (!base) return { ok: false, detail: "Adresse non configurée" };
  let url: URL;
  try { url = new URL("health", `${base.replace(/\/+$/, "")}/`); } catch { return { ok: false, detail: "Adresse invalide" }; }
  if (url.protocol !== "https:") return { ok: false, detail: "Adresse non sécurisée (https requis)" };
  const started = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), redirect: "error" });
    return { ok: res.ok, detail: res.ok ? "Connecté" : `Réponse ${res.status}`, latencyMs: Date.now() - started };
  } catch {
    return { ok: false, detail: "Injoignable", latencyMs: Date.now() - started };
  }
}

/** Status diodes shown in the chat: model, internet, ARTcB and the user's GitHub memory. */
export const getChatHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { checkModel, searchWeb } = await import("./web-search.server");
    const key = process.env["LOVABLE_API_KEY"];
    const [model, web, artcb, gh] = await Promise.all([
      key ? checkModel(key, CHAT_MODEL) : Promise.resolve({ ok: false, model: CHAT_MODEL, latencyMs: 0, error: "Clé IA absente" }),
      searchWeb("actualité"),
      checkArtcb(),
      context.supabase.from("github_memory_repos").select("repo_full_name,last_synced_at,last_error").eq("user_id", context.userId).maybeSingle(),
    ]);
    const repo = gh.data;
    const github: Diode = !repo
      ? { ok: false, detail: "Non connecté" }
      : repo.last_error
        ? { ok: false, detail: `Erreur : ${repo.last_error}` }
        : { ok: true, detail: repo.repo_full_name };
    return {
      model: { ok: model.ok, detail: model.ok ? "Prêt" : (model.error ?? "Indisponible"), latencyMs: model.latencyMs } as Diode,
      web: { ok: web.ok, detail: web.ok ? `${web.sources.length} sources` : (web.error ?? "Indisponible"), latencyMs: web.latencyMs } as Diode,
      artcb,
      github,
      githubConnected: !!repo,
      checkedAt: new Date().toISOString(),
    };
  });
