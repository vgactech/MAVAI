import { createContext, useContext, type ReactNode } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Folder, MessageSquare, Plus } from 'lucide-react';
import { listProjects } from '@/lib/production.functions';
import { listConversations } from '@/lib/modules.functions';
import { Button } from './ui/button';
import { ConversationActions } from './ConversationActions';
import { ProjectActions } from './ProjectActions';

const ProjectContext = createContext<string | undefined>(undefined);
export const useSelectedProject = () => useContext(ProjectContext);
export function useProjectSearch() {
  const search = useSearch({strict:false}) as {project?:string};
  return search.project;
}
function useOpenConversation() { return (useSearch({strict:false}) as {c?:string}).c; }
export const moduleLinks = [
  ['/chat','Chat'],['/bnb','Poste BNB'],['/signal-desk','Signal Desk'],['/memoire','Mémoire'],['/agents','Agents'],['/studio','Studio'],['/decoupage','Découpage'],['/character-studio','Personnages'],['/audio-studio','Audio Studio'],['/frame-control','Frame Control'],['/continuity','Continuité'],
] as const;
export function ProjectWorkspace({children,required=true,projectId}:{children:ReactNode;required?:boolean;projectId?:string|undefined}) {
  const fromSearch=useProjectSearch(); const project = projectId??fromSearch; const navigate = useNavigate(); const openConversation=useOpenConversation();
  const list = useServerFn(listProjects); const conversations = useServerFn(listConversations);
  const {data:projects=[]} = useQuery({queryKey:['production-projects'],queryFn:()=>list()});
  const {data:legacy=[]} = useQuery({queryKey:['project-conversations',undefined],queryFn:()=>conversations({data:{}})});
  const {data:chats=[]} = useQuery({queryKey:['project-conversations',project??'all'],queryFn:()=>conversations({data:project?{projectId:project}:{all:true}})});
  const selected = projects.find(p=>p.id===project);
  return <ProjectContext.Provider value={project}><div className="flex min-h-0 flex-1 flex-col md:flex-row">
    <aside aria-label="Navigation des projets" className="shrink-0 border-b border-border bg-sidebar p-3 text-sidebar-foreground md:w-56 md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex items-center gap-2"><Folder className="size-4"/><select aria-label="Projet actif" className="min-w-0 flex-1 rounded-md border border-input bg-background p-2 text-sm" value={project??''} onChange={e=>void navigate({to:'/chat',search:e.target.value?{project:e.target.value}:{}})}><option value="">Choisir un projet</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><Button asChild size="icon-sm" variant="ghost" aria-label="Créer un projet"><Link to="/projects"><Plus className="size-4"/></Link></Button></div>
      {selected && <div className="flex items-center justify-between gap-2 pt-2"><span className="truncate text-xs text-muted-foreground">{selected.title}</span><ProjectActions id={selected.id} title={selected.title}/></div>}
      <nav className="mt-3 flex gap-1 overflow-x-auto md:flex-col" aria-label="Modules du projet">{moduleLinks.map(([to,label])=><Button key={to} asChild size="sm" variant="ghost" className="shrink-0 justify-start"><Link to={to} search={{project}}>{label}</Link></Button>)}{project&&<Button asChild size="sm" variant="ghost" className="shrink-0 justify-start md:mt-2"><Link to="/projects/$projectId" params={{projectId:project}}>Ressources du projet</Link></Button>}</nav>
      <div className="mt-5 hidden md:block"><p className="mb-2 text-xs text-muted-foreground">{project?'Conversations du projet':'Toutes les conversations'}</p>{chats.length===0&&<p className="py-2 text-xs text-muted-foreground">Aucune conversation.</p>}{chats.slice(0,30).map(c=><div key={c.id} className={`group flex items-center rounded-md ${c.id===openConversation?'bg-sidebar-accent':''}`}><Link to="/chat" search={{c:c.id,...((project??c.project_id)?{project:project??c.project_id??undefined}:{})}} aria-current={c.id===openConversation?'page':undefined} className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-2 text-sm hover:bg-sidebar-accent ${c.id===openConversation?'font-medium':''}`}><MessageSquare className="size-3 shrink-0"/><span className="truncate">{c.title}</span></Link><ConversationActions id={c.id} title={c.title} projectId={c.project_id}/></div>)}{project&&legacy.length>0&&<details className="mt-4"><summary className="text-xs text-muted-foreground">Anciennes conversations</summary>{legacy.map(c=><Link key={c.id} to="/chat" search={{c:c.id}} className="block truncate py-2 text-sm">{c.title}</Link>)}</details>}</div>
    </aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">{required&&!selected?<div className="m-auto flex flex-col items-center gap-4 p-8"><Folder className="size-10 text-muted-foreground"/><h1 className="text-xl font-semibold">Choisissez un projet</h1><Button asChild><Link to="/projects">Mes projets</Link></Button></div>:children}</div>
  </div></ProjectContext.Provider>;
}