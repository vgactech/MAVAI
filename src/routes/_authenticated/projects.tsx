// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Film, FolderOpen, MessageSquare, Plus } from "lucide-react";
import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { QuickProjectForm } from "@/components/QuickProjectForm";
import { ProjectActions } from '@/components/ProjectActions';
import { ConversationActions } from '@/components/ConversationActions';
import { listProjects } from "@/lib/production.functions";
import { listConversations } from "@/lib/modules.functions";
import { groupConversationsByProject } from "@/lib/chat-steps";
import { formatWhen } from "@/lib/format-when";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({ meta: [{ title: "Mes projets — MAVAI" }, { name: "description", content: "Vos projets audiovisuels MAVAI et leurs conversations, accessibles en un clic." }, { property: "og:title", content: "Mes projets — MAVAI" }, { property: "og:description", content: "Votre espace privé de production audiovisuelle et ses conversations." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Projects,
});

function Projects() {
  const list = useServerFn(listProjects); const conversations = useServerFn(listConversations); const navigate = useNavigate();
  const { data = [], isPending, error } = useQuery({ queryKey: ["production-projects"], queryFn: () => list() });
  const chats = useQuery({ queryKey: ["project-conversations", "all"], queryFn: () => conversations({ data: { all: true } }) });
  const groups = groupConversationsByProject(chats.data ?? []);
  const startIn = (id: string) => void navigate({ to: "/chat", search: { project: id, new: true } });
  return <ModuleShell title="Mes projets" subtitle="Choisissez un projet pour reprendre ou démarrer une conversation avec MAVAI.">
    <div className="rounded-lg border border-border bg-card p-4"><p className="mb-3 text-sm font-medium">Nouveau projet</p><QuickProjectForm submitLabel="Créer et discuter" onCreated={p => startIn(p.id)} /></div>
    {(error ?? chats.error) && <p role="alert" className="mt-4 text-destructive">{(error ?? chats.error)?.message}</p>}
    {isPending && <div className="mt-8 grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Chargement">{[0, 1].map(i => <div key={i} className="h-40 animate-pulse rounded-lg bg-muted" />)}</div>}
    {!isPending && !error && !data.length && <div className="mt-8 rounded-lg border border-dashed border-border p-10 text-center"><Film className="mx-auto size-8 text-muted-foreground" aria-hidden /><p className="mt-3 font-medium">Aucun projet en cours.</p><p className="mt-1 text-sm text-muted-foreground">Donnez un nom à votre production ci-dessus : la conversation s’ouvre aussitôt.</p></div>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2">{data.map(p => { const rows = groups.get(p.id) ?? [];
      return <article key={p.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-5">
        <div className="flex items-start gap-3"><Film className="mt-1 size-5 shrink-0 text-accent" aria-hidden />
          <div className="min-w-0 flex-1"><h2 className="break-words text-lg font-semibold"><Link to="/chat" search={{ project: p.id }} className="hover:underline">{p.title}</Link></h2>
            <p className="text-xs text-muted-foreground">{chats.isPending ? "Conversations…" : `${rows.length} conversation${rows.length > 1 ? "s" : ""}`} · créé le {new Date(p.created_at).toLocaleDateString("fr-FR")}</p></div><ProjectActions id={p.id} title={p.title}/></div>
        {rows.length > 0 && <ul className="mt-4 space-y-1" aria-label={`Conversations récentes de ${p.title}`}>{rows.slice(0, 3).map(c => <li key={c.id} className="flex items-center"><Link to="/chat" search={{ c: c.id, project: p.id }} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"><MessageSquare className="size-3.5 shrink-0 text-muted-foreground" aria-hidden /><span className="min-w-0 flex-1 truncate">{c.title}</span><span className="shrink-0 text-xs text-muted-foreground">{formatWhen(c.updated_at)}</span></Link><ConversationActions id={c.id} title={c.title} projectId={p.id}/></li>)}
          {rows.length > 3 && <li><Link to="/chat" search={{ project: p.id }} className="block px-2 py-1 text-xs text-muted-foreground hover:underline">Voir les {rows.length} conversations</Link></li>}</ul>}
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Button size="sm" onClick={() => startIn(p.id)}><Plus className="size-4" />Nouvelle conversation</Button>
          {rows.length > 0 && <Button asChild size="sm" variant="outline"><Link to="/chat" search={{ project: p.id }}><MessageSquare className="size-4" />Conversations</Link></Button>}
          <Button asChild size="sm" variant="ghost"><Link to="/projects/$projectId" params={{ projectId: p.id }}><FolderOpen className="size-4" />Ressources</Link></Button>
        </div>
      </article>; })}</div>
  </ModuleShell>;
}
