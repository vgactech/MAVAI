// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Plus, Sparkles, Download } from "lucide-react";
import { toast } from "sonner";
import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getProject, addProjectItem, validateDecision, draftProduction, itemKinds } from "@/lib/production.functions";
const labels = { character: "Personnages", scene: "Scènes", shot: "Plans", asset: "Ressources", decision: "Décisions", audio: "Audio", frame: "Images", continuity: "Continuité", storyboard: "Storyboard" };
export const Route = createFileRoute("/_authenticated/projects_/$projectId")({
  head: () => ({ meta: [{ title: "Projet audiovisuel — MAVAI" }, { name: "description", content: "Scènes, plans, références et décisions de votre production." }, { property: "og:title", content: "Projet audiovisuel — MAVAI" }, { property: "og:description", content: "Ressources et décisions artistiques privées." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }), component: Project,
});
function Project() {
  const { projectId } = Route.useParams(); const get = useServerFn(getProject); const add = useServerFn(addProjectItem); const validate = useServerFn(validateDecision); const draft = useServerFn(draftProduction); const qc = useQueryClient();
  const key = ["production-project", projectId]; const { data, error } = useQuery({ queryKey: key, queryFn: () => get({ data: { id: projectId } }) });
  const [kind, setKind] = useState<typeof itemKinds[number]>("scene"); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [busy, setBusy] = useState(false);
  return <ModuleShell projectId={projectId} title={data?.project.title ?? "Production"} subtitle="Scènes · Plans · Références · Décisions">
    <div className="mb-6 flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/chat" search={{project:projectId}}>Chat du projet</Link></Button><Button asChild variant="outline"><Link to="/character-studio" search={{project:projectId}}>Personnages</Link></Button><Button asChild variant="outline"><Link to="/audio-studio" search={{project:projectId}}>Audio Studio</Link></Button><Button asChild variant="outline"><Link to="/frame-control" search={{project:projectId}}>Frame Control</Link></Button><Button asChild variant="outline"><Link to="/continuity" search={{project:projectId}}>Continuité</Link></Button><Button variant="outline" disabled={!data} onClick={()=>{const u=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));const a=document.createElement("a");a.href=u;a.download="mavai-production.json";a.click();URL.revokeObjectURL(u);}}><Download/>Exporter le projet</Button></div>
    {error && <p role="alert" className="text-destructive">{error.message}</p>}
    <div className="flex gap-2 overflow-x-auto border-b border-border pb-3">{itemKinds.map(k => <Button key={k} size="sm" variant={kind === k ? "default" : "ghost"} onClick={() => setKind(k)}>{labels[k]}</Button>)}</div>
    <form className="mt-6 space-y-3" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await add({ data: { project_id: projectId, kind, title, content } }); setTitle(""); setContent(""); await qc.invalidateQueries({ queryKey: key }); } catch(e) { toast.error(e instanceof Error ? e.message : "Enregistrement impossible."); } finally { setBusy(false); } }}>
      <Input aria-label="Titre de la ressource" placeholder="Titre" value={title} onChange={e => setTitle(e.target.value)} maxLength={160} required />
      <Textarea aria-label="Contenu de la ressource" placeholder="Description, référence ou décision artistique" value={content} onChange={e => setContent(e.target.value)} />
      <Button disabled={busy || !title.trim()}><Plus className="size-4" />Ajouter</Button>
      {(kind==="scene"||kind==="shot"||kind==="storyboard")&&<Button type="button" variant="outline" disabled={busy||!title.trim()} onClick={async()=>{setBusy(true);try{await draft({data:{projectId,kind,brief:`${title}\n${content}`}});await qc.invalidateQueries({queryKey:key});}catch(e){toast.error(e instanceof Error?e.message:"Création impossible.");}finally{setBusy(false);}}}><Sparkles/>{busy?"Préparation…":"Proposer avec MAVAI"}</Button>}
    </form>
    <div className="mt-8 divide-y divide-border">{data?.items.filter(i => i.kind === kind).map(i => <article key={i.id} className="py-5"><div className="flex items-start justify-between gap-3"><h2 className="break-words font-semibold">{i.title}</h2>{kind === "decision" && <Button size="sm" variant={i.validated ? "default" : "outline"} onClick={async () => { try { await validate({ data: { id: i.id, validated: !i.validated } }); await qc.invalidateQueries({ queryKey: key }); } catch { toast.error("Validation impossible."); } }}><Check className="size-4" />{i.validated ? "Validée" : "Valider"}</Button>}</div><p className="mt-2 whitespace-pre-wrap break-words text-sm">{i.content}</p><p className="mt-2 text-xs text-muted-foreground">Version {i.version} · {new Date(i.created_at).toLocaleString("fr-FR")}</p></article>)}</div>
  </ModuleShell>;
}