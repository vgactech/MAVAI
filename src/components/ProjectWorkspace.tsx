import { createContext, useContext, type ReactNode } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { useQuery } from '@tanstack/react-query';
import { Folder, MessageSquare, Plus } from 'lucide-react';
import { listProjects } from '@/lib/production.functions';
import { listConversations } from '@/lib/modules.functions';
import { Button } from './ui/button';

const ProjectContext = createContext<string | undefined>(undefined);
export const useSelectedProject = () => useContext(ProjectContext);
export function useProjectSearch() {
  const search = useSearch({strict:false}) as {project?:string};
  return search.project;
}
export const moduleLinks = [
  ['/chat','Chat'],['/signal-desk','Signal Desk'],['/memoire','Mémoire'],['/agents','Agents'],['/studio','Studio'],['/character-studio','Personnages'],['/audio-studio','Audio Studio'],['/frame-control','Frame Control'],['/continuity','Continuité'],
] as const;
export function ProjectWorkspace({children,required=true,projectId}:{children:ReactNode;required?:boolean;projectId?:string|undefined}) {
  const fromSearch=useProjectSearch(); const project = projectId??fromSearch; const navigate = useNavigate();
  const list = useServerFn(listProjects); const conversations = useServerFn(listConversations);
  const {data:projects=[]} = useQuery({queryKey:['production-projects'],queryFn:()=>list()});
  const {data:legacy=[]} = useQuery({queryKey:['project-conversations',undefined],queryFn:()=>conversations({data:{}})});
  const {data:chats=[]} = useQuery({queryKey:['project-conversations',project],queryFn:()=>conversations({data:{projectId:project}})});
  const selected = projects.find(p=>p.id===project);
  return <ProjectContext.Provider value={project}><div className="flex min-h-0 flex-1 flex-col md:flex-row">
    <aside aria-label="Navigation des projets" className="shrink-0 border-b border-border bg-sidebar p-3 text-sidebar-foreground md:w-56 md:overflow-y-auto md:border-r md:border-b-0">
      <div className="flex items-center gap-2"><Folder className="size-4"/><select aria-label="Projet actif" className="min-w-0 flex-1 rounded-md border border-input bg-background p-2 text-sm" value={project??''} onChange={e=>void navigate({to:'/chat',search:e.target.value?{project:e.target.value}:{}})}><option value="">Choisir un projet</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select><Button asChild size="icon-sm" variant="ghost" aria-label="Créer un projet"><Link to="/projects"><Plus className="size-4"/></Link></Button></div>
      <nav className="mt-3 flex gap-1 overflow-x-auto md:flex-col" aria-label="Modules du projet">{moduleLinks.map(([to,label])=><Button key={to} asChild size="sm" variant="ghost" className="shrink-0 justify-start"><Link to={to} search={{project}}>{label}</Link></Button>)}</nav>
      {project&&<Button asChild variant="ghost" size="sm" className="mt-2 w-full justify-start"><Link to="/projects/$projectId" params={{projectId:project}}>Ressources du projet</Link></Button>}
      <div className="mt-5 hidden md:block"><p className="mb-2 text-xs text-muted-foreground">Conversations</p>{chats.map(c=><Link key={c.id} to="/chat" search={{c:c.id,project}} className="flex items-center gap-2 py-2 text-sm"><MessageSquare className="size-3 shrink-0"/><span className="truncate">{c.title}</span></Link>)}{project&&legacy.length>0&&<details className="mt-4"><summary className="text-xs text-muted-foreground">Anciennes conversations</summary>{legacy.map(c=><Link key={c.id} to="/chat" search={{c:c.id}} className="block truncate py-2 text-sm">{c.title}</Link>)}</details>}</div>
    </aside>
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">{required&&!selected?<div className="m-auto flex flex-col items-center gap-4 p-8"><Folder className="size-10 text-muted-foreground"/><h1 className="text-xl font-semibold">Choisissez un projet</h1><Button asChild><Link to="/projects">Mes projets</Link></Button></div>:children}</div>
  </div></ProjectContext.Provider>;
}