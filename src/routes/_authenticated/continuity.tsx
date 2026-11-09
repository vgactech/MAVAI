import { projectSearch } from "@/lib/project-scope";
// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState,useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { compareContinuity } from "@/lib/continuity.functions";
import { MessageResponse } from "@/components/ai-elements/message";
import { listProjects, addProjectItem } from "@/lib/production.functions";
export const Route = createFileRoute("/_authenticated/continuity")({ validateSearch: projectSearch, head: () => ({ meta: [{ title: "Continuité — MAVAI" }, { name: "description", content: "Comparaison assistée de références et plans de production." }, { property: "og:title", content: "Continuité — MAVAI" }, { property: "og:description", content: "Rapports de différences visuelles à valider." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Continuity });
function Continuity() {
  const compare = useServerFn(compareContinuity); const [files, setFiles] = useState<(File | null)[]>([null,null]); const [result,setResult] = useState(""); const [busy,setBusy] = useState(false);
  const list=useServerFn(listProjects),add=useServerFn(addProjectItem);const {data:projects=[]}=useQuery({queryKey:["production-projects"],queryFn:()=>list()});const {project:projectId=""}=Route.useSearch();
  useEffect(()=>{setResult("");setFiles([null,null]);},[projectId]);
  return <ModuleShell title="Continuité" subtitle="Comparaison assistée · Validation humaine requise"><div className="grid gap-6 sm:grid-cols-2">{["Référence", "Plan à vérifier"].map((label,i) => <label key={label} className="space-y-3"><h2 className="font-semibold">{label}</h2><Input type="file" accept="image/*" aria-label={label} onChange={e => setFiles(p => p.map((f,j) => j === i ? e.target.files?.[0] ?? null : f))} /></label>)}</div><Button className="mt-6" disabled={!projectId || busy || files.some(f => !f)} onClick={async () => { setBusy(true); try { const images = await Promise.all(files.map(async f => { if(!f) throw new Error("Deux images requises."); if(f.size>8*1024*1024) throw new Error("8 Mo maximum par image."); return await new Promise<{type:string;dataBase64:string}>((resolve,reject) => { const r = new FileReader(); r.onload=()=>resolve({type:f.type,dataBase64:String(r.result).split(",")[1]??""}); r.onerror=reject; r.readAsDataURL(f); }); })); const r = await compare({data:{images,projectId}}); if(r.ok) setResult(r.text); else toast.error(r.error); } catch(e) { toast.error(e instanceof Error ? e.message : "Analyse impossible."); } finally { setBusy(false); } }}>{busy ? "Comparaison en cours…" : "Comparer les plans"}</Button>{result && <div className="mt-8"><MessageResponse>{result}</MessageResponse><Button className="mt-4" disabled={!projectId} onClick={async()=>{try{await add({data:{project_id:projectId,kind:"continuity",title:"Rapport de continuité",content:result}});toast.success("Rapport conservé.");}catch(e){toast.error(e instanceof Error?e.message:"Enregistrement impossible.");}}}>Conserver le rapport</Button></div>}</ModuleShell>;
}