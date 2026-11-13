import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useServerFn } from '@tanstack/react-start';
import { useEffect, useRef, useState } from 'react';
import type { MavaiUIMessage } from '@/lib/chat-steps';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { MavaiMark } from '@/components/MavaiMark';
import { StreamingChat } from '@/components/StreamingChat';
import { getConversation } from '@/lib/modules.functions';
import { ProjectWorkspace } from '@/components/ProjectWorkspace';
import { ChatHub } from '@/components/ChatHub';

export const Route = createFileRoute('/_authenticated/chat')({
  head:()=>({meta:[{title:'Chat texte et voix — MAVAI'},{name:'description',content:'Conversation privée MAVAI : texte progressif et échanges vocaux.'},{property:'og:title',content:'Chat texte et voix — MAVAI'},{property:'og:description',content:'Votre conversation avec MAVAI, par écrit et à voix haute.'},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary'}]}),
  validateSearch:zodValidator(z.object({c:z.string().optional(),new:z.boolean().optional(),project:z.string().uuid().optional()})),component:ChatPage,
});
function ChatPage() {
  const {c,project,new:fresh}=Route.useSearch(); const load=useServerFn(getConversation); const navigate=useNavigate();
  const loadRef=useRef(load);loadRef.current=load;
  const [initial,setInitial]=useState<MavaiUIMessage[]>([]);const [loading,setLoading]=useState(Boolean(c));const [error,setError]=useState<string|null>(null);
  const [sessionEpoch,setSessionEpoch]=useState(0);const owner=useRef(c ?? null);const created=useRef<string|null>(null);
  useEffect(()=>{
    if(c && c===created.current){created.current=null;return;}
    let cancelled=false;
    setSessionEpoch(n=>n+1);owner.current=c ?? null;setError(null);setInitial([]);setLoading(Boolean(c));
    if(c) void loadRef.current({data:{id:c,projectId:project}}).then(rows=>{
      if(cancelled)return;
      setInitial(rows.map(r=>({id:r.client_message_id??r.id,role:r.role,metadata:r.metadata,parts:r.metadata?.parts as unknown as MavaiUIMessage['parts'] ?? [{type:'text',text:r.content}]})));setLoading(false);
    }).catch(e=>{if(!cancelled){setError(e.message);setLoading(false);}});
    return()=>{cancelled=true;};
  },[c,project]);
  return <div className="flex h-dvh flex-col bg-background text-foreground">
    <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
      <Button asChild variant="ghost" size="icon-sm" aria-label="Retour au tableau de bord"><Link to="/dashboard"><ArrowLeft className="size-4"/></Link></Button>
      <MavaiMark className="size-7"/><span className="font-display font-semibold">MAVAI</span><div className="flex-1"/>
      <Button variant="ghost" size="sm" onClick={()=>{setSessionEpoch(n=>n+1);owner.current=null;setInitial([]);navigate({to:'/chat',search:{project,new:true}});}}><Plus className="size-4"/>Nouvelle</Button><ThemeToggle/>
    </header>
    <ProjectWorkspace required={false}>{!c&&!fresh?<ChatHub project={project}/>:!c&&!project?<ChatHub project={undefined} pickForNew/>:loading?<p role="status" className="p-6">Chargement de la conversation…</p>:error?<p role="alert" className="p-6 text-destructive">{error}</p>:<StreamingChat key={sessionEpoch} id={owner.current} initialMessages={initial} onConversation={id=>{owner.current=id;created.current=id;void navigate({to:'/chat',search:{c:id,project},replace:true});}}/>}</ProjectWorkspace>
  </div>;
}
