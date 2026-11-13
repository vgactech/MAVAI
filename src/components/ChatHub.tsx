import { Link, useNavigate } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Film, FolderOpen, MessageSquare, Plus } from 'lucide-react';
import { listProjects } from '@/lib/production.functions';
import { listConversations } from '@/lib/modules.functions';
import { groupConversationsByProject, type ConversationRow } from '@/lib/chat-steps';
import { formatWhen } from '@/lib/format-when';
import { Button } from './ui/button';
import { QuickProjectForm } from './QuickProjectForm';
import { ConversationActions } from './ConversationActions';
import { ProjectActions } from './ProjectActions';

type Project = { id: string; title: string; updated_at: string };

function ConversationList({ rows, projectTitles, project }: { rows: ConversationRow[]; projectTitles?: Map<string, string>; project?: string | undefined }) {
  return <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
    {rows.map(c => <li key={c.id} className="flex items-center pr-2">
      <Link to="/chat" search={{ c: c.id, ...(project ?? c.project_id ? { project: project ?? c.project_id ?? undefined } : {}) }} className="flex min-w-0 flex-1 items-center gap-3 p-3 transition-colors hover:bg-muted">
        <MessageSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1"><span className="block truncate">{c.title}</span>
          {projectTitles && <span className="block truncate text-xs text-muted-foreground">{c.project_id ? projectTitles.get(c.project_id) ?? 'Projet' : 'Sans projet'}</span>}</span>
        <span className="shrink-0 text-xs text-muted-foreground">{formatWhen(c.updated_at)}</span>
      </Link>
      <ConversationActions id={c.id} title={c.title} projectId={c.project_id} archived={Boolean(c.archived_at)} />
    </li>)}
  </ul>;
}

function Loading() { return <div className="mt-4 grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Chargement">{[0, 1].map(i => <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />)}</div>; }

/** Landing view of /chat: existing projects and conversations, never an empty chat. */
export function ChatHub({ project, pickForNew = false }: { project: string | undefined; pickForNew?: boolean }) {
  const list = useServerFn(listProjects); const conversations = useServerFn(listConversations); const navigate = useNavigate();
  const projectsQuery = useQuery({ queryKey: ['production-projects'], queryFn: () => list() });
  const chatsQuery = useQuery({ queryKey: ['project-conversations', 'all'], queryFn: () => conversations({ data: { all: true } }) });
  const projects: Project[] = projectsQuery.data ?? []; const chats: ConversationRow[] = chatsQuery.data ?? [];
  const groups = groupConversationsByProject(chats);
  const titles = new Map(projects.map(p => [p.id, p.title]));
  const startIn = (id: string) => void navigate({ to: '/chat', search: { project: id, new: true } });
  const failure = projectsQuery.error ?? chatsQuery.error;

  if (project) {
    const selected = projects.find(p => p.id === project); const rows = groups.get(project) ?? [];
    return <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/chat"><ArrowLeft className="size-4" />Toutes les conversations</Link></Button>
      {projectsQuery.isPending ? <Loading /> : !selected ? <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center"><p className="font-medium">Projet introuvable.</p><p className="mt-1 text-sm text-muted-foreground">Il a peut-être été supprimé.</p></div> : <>
        <div className="mt-3 flex flex-wrap items-center gap-2"><h1 className="min-w-[14rem] flex-1 break-words text-2xl font-semibold">{selected.title}</h1>
          <ProjectActions id={selected.id} title={selected.title}/>
          <Button asChild variant="outline"><Link to="/projects/$projectId" params={{ projectId: project }}><FolderOpen className="size-4" />Ressources</Link></Button>
          <Button onClick={() => startIn(project)}><Plus className="size-4" />Nouvelle conversation</Button></div>
        <h2 className="mt-6 text-sm font-medium text-muted-foreground">Conversations du projet {chatsQuery.isSuccess && `(${rows.length})`}</h2>
        {chatsQuery.isPending ? <Loading /> : rows.length === 0 ? <div className="mt-3 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center"><p className="text-muted-foreground">Aucune conversation dans ce projet.</p><Button onClick={() => startIn(project)}><Plus className="size-4" />Démarrer la première conversation</Button></div> : <ConversationList rows={rows} project={project} />}
      </>}
      {failure && <p role="alert" className="mt-4 text-sm text-destructive">{failure.message}</p>}
    </div>;
  }

  if (pickForNew) return <div className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto p-4 sm:p-6">
    <Button asChild variant="ghost" size="sm" className="-ml-2"><Link to="/chat"><ArrowLeft className="size-4" />Toutes les conversations</Link></Button>
    <h1 className="mt-3 text-2xl font-semibold">Nouvelle conversation</h1>
    <p className="mt-1 text-sm text-muted-foreground">Dans quel projet voulez-vous travailler ?</p>
    {projectsQuery.isPending ? <Loading /> : <div className="mt-4 grid gap-3 sm:grid-cols-2">
      {projects.map(p => <button key={p.id} type="button" onClick={() => startIn(p.id)} className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted"><Film className="size-5 shrink-0 text-accent" aria-hidden /><span className="min-w-0 flex-1 break-words font-medium">{p.title}</span><Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden /></button>)}
    </div>}
    <div className="mt-6 rounded-lg border border-dashed border-border p-4"><p className="mb-3 text-sm text-muted-foreground">{projects.length ? 'Ou créez un nouveau projet :' : 'Aucun projet en cours. Créez-en un pour démarrer :'}</p><QuickProjectForm submitLabel="Créer et discuter" onCreated={p => startIn(p.id)} /></div>
    {failure && <p role="alert" className="mt-4 text-sm text-destructive">{failure.message}</p>}
  </div>;

  return <div className="mx-auto w-full max-w-4xl flex-1 overflow-y-auto p-4 sm:p-6">
    <div className="flex flex-wrap items-center gap-3"><div className="min-w-[14rem] flex-1"><h1 className="text-2xl font-semibold">Vos conversations</h1><p className="mt-1 text-sm text-muted-foreground">Reprenez un échange ou démarrez-en un dans un projet.</p></div>
      {projects.length > 0 && <Button asChild><Link to="/chat" search={{ new: true }}><Plus className="size-4" />Nouvelle conversation</Link></Button>}</div>
    <section aria-labelledby="hub-projects" className="mt-8">
      <h2 id="hub-projects" className="text-sm font-medium text-muted-foreground">Projets en cours {projectsQuery.isSuccess && `(${projects.length})`}</h2>
      {projectsQuery.isPending ? <Loading /> : projects.length === 0 ? <div className="mt-3 rounded-lg border border-dashed border-border p-6 text-center"><p className="font-medium">Aucun projet en cours.</p><p className="mt-1 text-sm text-muted-foreground">Créez votre premier projet pour discuter avec MAVAI.</p><div className="mx-auto mt-4 max-w-md"><QuickProjectForm submitLabel="Créer et discuter" onCreated={p => startIn(p.id)} /></div></div> :
        <div className="mt-3 grid gap-3 sm:grid-cols-2">{projects.map(p => { const rows = groups.get(p.id) ?? []; const last = rows[0];
          return <div key={p.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3"><Film className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
              <Link to="/chat" search={{ project: p.id }} className="min-w-0 flex-1 hover:underline"><span className="block break-words font-medium">{p.title}</span><span className="block text-xs text-muted-foreground">{rows.length} conversation{rows.length > 1 ? 's' : ''}{last ? ` · ${formatWhen(last.updated_at)}` : ''}</span></Link>
              <ProjectActions id={p.id} title={p.title}/><Button size="icon-sm" variant="ghost" aria-label={`Nouvelle conversation dans ${p.title}`} onClick={() => startIn(p.id)}><Plus className="size-4" /></Button></div>
            {last && <Link to="/chat" search={{ c: last.id, project: p.id }} className="mt-3 flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm transition-colors hover:bg-muted/70"><MessageSquare className="size-3.5 shrink-0" aria-hidden /><span className="min-w-0 flex-1 truncate">Reprendre : {last.title}</span></Link>}
          </div>; })}</div>}
    </section>
    <section aria-labelledby="hub-chats" className="mt-8">
      <h2 id="hub-chats" className="text-sm font-medium text-muted-foreground">Toutes les conversations {chatsQuery.isSuccess && `(${chats.length})`}</h2>
      {chatsQuery.isPending ? <Loading /> : chats.length === 0 ? <p className="mt-3 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucune conversation pour l’instant.</p> : <ConversationList rows={[...chats].sort((a, b) => b.updated_at.localeCompare(a.updated_at))} projectTitles={titles} />}
    </section>
    <ArchivedChats titles={titles} />
    {failure && <p role="alert" className="mt-4 text-sm text-destructive">{failure.message}</p>}
  </div>;
}

function ArchivedChats({ titles }: { titles: Map<string, string> }) {
  const conversations = useServerFn(listConversations);
  const { data = [] } = useQuery({ queryKey: ['project-conversations', 'archived'], queryFn: () => conversations({ data: { all: true, archived: true } }) });
  if (!data.length) return null;
  return <details className="mt-8"><summary className="cursor-pointer text-sm font-medium text-muted-foreground">Chats archivés ({data.length})</summary><ConversationList rows={data} projectTitles={titles} /></details>;
}
