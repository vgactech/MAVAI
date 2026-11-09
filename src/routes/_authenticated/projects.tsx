// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Film, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createProject, listProjects } from "@/lib/production.functions";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Productions — MAVAI" }, { name: "description", content: "Projets audiovisuels, scènes et décisions artistiques MAVAI." }, { property: "og:title", content: "Productions — MAVAI" }, { property: "og:description", content: "Votre espace privé de production audiovisuelle." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Projects,
});
function Projects() {
  const list = useServerFn(listProjects); const create = useServerFn(createProject); const qc = useQueryClient();
  const { data = [], isPending, error } = useQuery({ queryKey: ["production-projects"], queryFn: () => list() });
  const [title, setTitle] = useState(""); const [busy, setBusy] = useState(false);
  return <ModuleShell title="Mes productions" subtitle="Projets audiovisuels">
    <form className="flex gap-2" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await create({ data: { title } }); setTitle(""); await qc.invalidateQueries({ queryKey: ["production-projects"] }); } catch(e) { toast.error(e instanceof Error ? e.message : "Création impossible."); } finally { setBusy(false); } }}>
      <Input aria-label="Nom du projet" placeholder="Nom de la production" value={title} onChange={e => setTitle(e.target.value)} maxLength={160} required />
      <Button disabled={busy || !title.trim()}><Plus className="size-4" />Créer</Button>
    </form>
    {error && <p role="alert" className="mt-4 text-destructive">{error.message}</p>}
    {isPending && <p className="mt-6 text-muted-foreground">Chargement…</p>}
    {!isPending && !data.length && <p className="mt-12 text-center text-muted-foreground">Aucune production.</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{data.map(p => <Link key={p.id} to="/projects/$projectId" params={{ projectId: p.id }} className="rounded-lg border border-border p-6 hover:bg-muted"><div className="flex justify-between"><Film className="size-6 text-accent" /><ArrowUpRight className="size-4" /></div><h2 className="mt-4 break-words text-xl">{p.title}</h2><p className="mt-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</p></Link>)}</div>
  </ModuleShell>;
}