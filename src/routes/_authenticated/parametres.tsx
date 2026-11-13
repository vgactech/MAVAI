import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GitHubMemoryCard } from "@/components/GitHubMemoryCard";
import { EXTERNAL_PROVIDERS } from "@/lib/external-providers";
import { deleteExternalConnection, listExternalConnections, saveExternalConnection } from "@/lib/external-providers.functions";

export const Route = createFileRoute("/_authenticated/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres et connexions — MAVAI" },
      { name: "description", content: "Connectez vos propres modèles et plateformes : ChatGPT, Claude, Mistral, Gemini et plus." },
      { property: "og:title", content: "Paramètres et connexions — MAVAI" },
      { property: "og:description", content: "Connectez vos propres comptes d'IA à MAVAI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user } = Route.useRouteContext();
  const list = useServerFn(listExternalConnections);
  const save = useServerFn(saveExternalConnection);
  const del = useServerFn(deleteExternalConnection);
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["external-connections"], queryFn: () => list() });
  const CHAT = ["openai","anthropic","gemini","mistral","perplexity"];
  const active = [...data].filter((x) => CHAT.includes(x.provider)).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]?.provider;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function connect(provider: string) {
    setBusy(provider);
    try {
      await save({ data: { provider, key: drafts[provider] ?? "" } });
      setDrafts((d) => ({ ...d, [provider]: "" }));
      toast.success("Connexion vérifiée et enregistrée");
      qc.invalidateQueries({ queryKey: ["external-connections"] });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Échec"); }
    finally { setBusy(null); }
  }
  async function remove(provider: string) {
    setBusy(provider);
    try { await del({ data: { provider } }); qc.invalidateQueries({ queryKey: ["external-connections"] }); toast.success("Connexion supprimée"); }
    finally { setBusy(null); }
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="flex items-center gap-3 border-b border-border px-6 py-3">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Tableau de bord</Link>
        <div className="flex-1" />
        <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Paramètres</h1>
        <p className="mt-2 text-sm text-muted-foreground">Le dernier modèle connecté répond dans le chat. S'il n'a plus de crédit, vous êtes prévenu et MAVAI prend le relais. Connectez vos propres comptes. Vos clés sont vérifiées puis gardées chiffrées ; personne ne peut les relire.</p>
        <h2 className="mt-10 text-lg font-semibold">Modèles et plateformes externes</h2>
        <div className="mt-4 grid gap-3">
          {EXTERNAL_PROVIDERS.map((p) => {
            const c = data.find((x) => x.provider === p.id);
            return (
              <div key={p.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{p.name}</h3>
                  {c && <span className="flex items-center gap-1 text-xs text-accent"><CheckCircle2 className="size-3.5" /> Connecté {c.key_hint}</span>}
                  {active === p.id && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Utilisé par le chat</span>}
                  <div className="flex-1" />
                  <a href={p.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Obtenir ma clé <ExternalLink className="size-3" /></a>
                </div>
                <div className="mt-3 flex gap-2">
                  <Input type="password" autoComplete="off" placeholder={c ? "Remplacer la clé" : p.hint} value={drafts[p.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))} />
                  <Button onClick={() => connect(p.id)} disabled={busy === p.id || !(drafts[p.id] ?? "").trim()}>
                    {busy === p.id ? <Loader2 className="size-4 animate-spin" /> : "Connecter"}
                  </Button>
                  {c && <Button variant="ghost" size="icon" aria-label="Supprimer" onClick={() => remove(p.id)} disabled={busy === p.id}><Trash2 className="size-4" /></Button>}
                </div>
              </div>
            );
          })}
        </div>
        <h2 className="mt-10 text-lg font-semibold">Mémoire GitHub</h2>
        <div className="mt-4"><GitHubMemoryCard /></div>
      </main>
    </div>
  );
}
