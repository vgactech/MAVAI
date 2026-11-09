import { projectSearch } from "@/lib/project-scope";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState,useEffect } from "react";
import { Save, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listProjects, getProject, saveCharacter } from "@/lib/production.functions";
import { characterPrompt, type CharacterRecord } from "@/lib/character-record";
export const Route = createFileRoute("/_authenticated/character-studio")({ validateSearch: projectSearch, head:()=>({meta:[{title:"Character Studio — MAVAI"},{name:"description",content:"Identités visuelles, références et versions privées de personnages."},{property:"og:title",content:"Character Studio — MAVAI"},{property:"og:description",content:"Fiches de personnages et contraintes de continuité."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:CharacterStudio });
const empty: CharacterRecord = {name:"",appearance:"",costume:"",palette:"",rules:"",reference:""};
function CharacterStudio(){
 const list=useServerFn(listProjects),get=useServerFn(getProject),save=useServerFn(saveCharacter),qc=useQueryClient();
 const {data:projects=[]}=useQuery({queryKey:["production-projects"],queryFn:()=>list()});
 const {project:projectId=""}=Route.useSearch(),[character,setCharacter]=useState(empty),[previousId,setPreviousId]=useState<string>(),[busy,setBusy]=useState(false);
 useEffect(()=>{setCharacter(empty);setPreviousId(undefined);},[projectId]);
 const {data}=useQuery({queryKey:["characters",projectId],enabled:!!projectId,queryFn:()=>get({data:{id:projectId}})});
 return <ModuleShell title="Character Studio" subtitle="Identité · Références · Versions">

 <form className="grid gap-4 sm:grid-cols-2" onSubmit={async e=>{e.preventDefault();setBusy(true);try{const row=await save({data:{projectId,previousId,character}});setPreviousId(row.id);await qc.invalidateQueries({queryKey:["characters",projectId]});toast.success("Version enregistrée.");}catch(e){toast.error(e instanceof Error?e.message:"Enregistrement impossible.");}finally{setBusy(false);}}}>
 {([['name','Nom'],['appearance','Apparence'],['costume','Costume'],['palette','Palette'],['rules','Contraintes de continuité']] as const).map(([k,label])=><label key={k} className="space-y-2 text-sm"><span>{label}</span>{k==="name"?<Input required value={character[k]} onChange={e=>setCharacter({...character,[k]:e.target.value})}/>:<Textarea value={character[k]} onChange={e=>setCharacter({...character,[k]:e.target.value})}/>}</label>)}
 <label className="space-y-2 text-sm">Référence visuelle<Input type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>5*1024*1024){toast.error("5 Mo maximum.");return;}const r=new FileReader();r.onload=()=>setCharacter(c=>({...c,reference:String(r.result)}));r.readAsDataURL(f);}}/>{character.reference&&<img src={character.reference} alt={character.name||"Référence"} className="max-h-64 object-contain"/>}</label>
 <div className="flex flex-wrap gap-2 sm:col-span-2"><Button disabled={!projectId||busy||!character.name.trim()}><Save/>Enregistrer une version</Button><Button type="button" variant="outline" onClick={async()=>{await navigator.clipboard.writeText(characterPrompt(character));toast.success("Fiche copiée.");}}><Copy/>Copier la fiche</Button><Button type="button" variant="outline" onClick={()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(character,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download="mavai-personnage.json";a.click();URL.revokeObjectURL(u);}}><Download/>Exporter</Button></div>
 </form><div className="mt-8 grid gap-4 sm:grid-cols-2">{data?.items.filter(i=>i.kind==="character").map(i=><article key={i.id} className="rounded-lg border border-border p-4"><h2 className="font-semibold">{i.title} · v{i.version}</h2><p className="mt-2 whitespace-pre-wrap text-sm">{i.content}</p><Button variant="ghost" className="mt-3" onClick={()=>{setPreviousId(i.id);setCharacter({...empty,...i.data as Partial<CharacterRecord>});}}>Créer une nouvelle version</Button></article>)}</div>
 </ModuleShell>;
}