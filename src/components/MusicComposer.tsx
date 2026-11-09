import { useSelectedProject } from "./ProjectWorkspace";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Music2, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { listProjects, getProject } from "@/lib/production.functions";
import { composeMusic } from "@/lib/music.functions";
export function MusicComposer({onImport}:{onImport:(file:File)=>Promise<void>}){
 const list=useServerFn(listProjects),get=useServerFn(getProject),compose=useServerFn(composeMusic),qc=useQueryClient();
 const {data:projects=[]}=useQuery({queryKey:["production-projects"],queryFn:()=>list()});
 const projectId=useSelectedProject()??""; const [prompt,setPrompt]=useState(""),[busy,setBusy]=useState(false);
 const {data}=useQuery({queryKey:["music",projectId],enabled:!!projectId,queryFn:()=>get({data:{id:projectId}})});
 return <section className="mt-10 border-t border-border pt-6"><h2 className="mb-4 text-lg font-semibold">Composition musicale · 30 secondes</h2>

 <Textarea aria-label="Direction musicale" placeholder="Instrumental, suspense, cordes, 90 BPM…" className="mt-3" value={prompt} onChange={e=>setPrompt(e.target.value)}/>
 <Button className="mt-3" disabled={!projectId||prompt.trim().length<3||busy} onClick={async()=>{setBusy(true);try{const result=await compose({data:{id:crypto.randomUUID(),projectId,prompt}});if(result.error)toast.error(result.error);await qc.invalidateQueries({queryKey:["music",projectId]});}catch(e){toast.error(e instanceof Error?e.message:"Composition impossible.");}finally{setBusy(false);}}}><Music2/>{busy?"Composition en cours…":"Composer"}</Button>
 <div className="mt-6 divide-y divide-border">{data?.items.filter(i=>i.kind==="audio").map(i=>{const r=i.data as {status?:string;audio?:string;error?:string};return <article key={i.id} className="py-4"><h3 className="text-sm font-semibold">{i.title}</h3>{r.audio?<><audio controls src={r.audio} className="mt-3 w-full"/><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" asChild><a href={r.audio} download="mavai-musique.mp3"><Download/>Télécharger</a></Button><Button size="sm" variant="outline" onClick={async()=>{if(!r.audio)return;const blob=await(await fetch(r.audio)).blob();await onImport(new File([blob],`${i.title.slice(0,30)}.mp3`,{type:"audio/mpeg"}));}}><Plus/>Ajouter au mix</Button></div></>:<p role="status" className="text-sm text-muted-foreground">{r.error??"Composition en cours ou interrompue"}</p>}</article>;})}</div>
 </section>;
}