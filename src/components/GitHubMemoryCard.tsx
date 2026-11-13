import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Github, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeGitHubConnect, disconnectGitHub, getGitHubMemoryStatus, startGitHubConnect } from "@/lib/github-memory.functions";
import { formatWhen } from "@/lib/format-when";

function waitForOAuth(popup: Window) {
  return new Promise<string | null>((resolve, reject) => {
    const cleanup = () => { window.removeEventListener("message", onMessage); window.clearInterval(poll); };
    const onMessage = (e: MessageEvent) => {
      const type = e.data?.type;
      if (e.origin !== window.location.origin || e.source !== popup || e.data?.connectorId !== "github" || (type !== "appUserConnectorOAuthComplete" && type !== "appUserConnectorOAuthFailed")) return;
      cleanup();
      if (type === "appUserConnectorOAuthComplete") resolve(typeof e.data?.code === "string" ? e.data.code : null);
      else { popup.close(); reject(new Error("Connexion GitHub refusée.")); }
    };
    window.addEventListener("message", onMessage);
    const poll = window.setInterval(() => { if (popup.closed) { cleanup(); reject(new Error("Fenêtre GitHub fermée avant la fin.")); } }, 500);
  });
}

export function GitHubMemoryCard() {
  const qc = useQueryClient();
  const status = useServerFn(getGitHubMemoryStatus);
  const start = useServerFn(startGitHubConnect);
  const complete = useServerFn(completeGitHubConnect);
  const disconnect = useServerFn(disconnectGitHub);
  const { data } = useQuery({ queryKey: ["github-memory"], queryFn: () => status() });
  const [busy, setBusy] = useState(false);

  async function connect() {
    const popup = window.open("", "mavai-github", "width=600,height=720");
    if (!popup) { toast.error("Autorisez les fenêtres pop-up puis réessayez."); return; }
    setBusy(true);
    try {
      const { authorizationUrl } = await start();
      const done = waitForOAuth(popup);
      popup.location.href = authorizationUrl;
      const code = await done;
      if (code) { const r = await complete({ data: { code } }); toast.success(`Mémoire reliée à ${r.repo}`); }
      await qc.invalidateQueries({ queryKey: ["github-memory"] });
    } catch (e) { popup.close(); toast.error(e instanceof Error ? e.message : "Connexion impossible."); }
    finally { setBusy(false); }
  }
  async function unlink() {
    if (!confirm("Déconnecter GitHub ? Le dépôt reste dans votre GitHub, MAVAI arrête simplement d'y écrire.")) return;
    setBusy(true);
    try { await disconnect(); await qc.invalidateQueries({ queryKey: ["github-memory"] }); toast.success("GitHub déconnecté."); }
    catch { toast.error("Déconnexion impossible."); } finally { setBusy(false); }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold"><Github className="h-4 w-4" /> Mémoire dans votre GitHub</h2>
          {data?.connected ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Dépôt privé <a className="underline" href={`https://github.com/${data.repo_full_name}`} target="_blank" rel="noreferrer">{data.repo_full_name}</a>
              {data.last_synced_at ? ` · dernière sauvegarde ${formatWhen(data.last_synced_at)}` : " · aucune sauvegarde encore"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Chaque prompt, raisonnement, tâche et commande est rangé dans un dépôt privé créé dans votre propre GitHub.</p>
          )}
          {data?.connected && data.last_error && <p className="mt-1 text-sm text-destructive">Dernière sauvegarde échouée : {data.last_error}</p>}
        </div>
        {data?.connected
          ? <div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={connect}>Reconnecter</Button><Button variant="ghost" size="sm" disabled={busy} onClick={unlink}>Déconnecter</Button></div>
          : <Button size="sm" disabled={busy} onClick={connect}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Connecter mon GitHub</Button>}
      </div>
    </section>
  );
}
