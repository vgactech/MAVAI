import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronRight, History, Plus, Archive, RotateCcw, Save } from "lucide-react";
import { ModuleShell } from "@/components/ModuleShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { projectSearch } from "@/lib/project-scope";
import { listProjects } from "@/lib/production.functions";
import { getTree, createNode, saveNodeVersion, restoreNodeVersion, setNodeArchived, setTargetDuration } from "@/lib/production-tree.functions";
import { kindLabels, childKinds, bibleKinds, layerTypes, durationPresets, toSeconds, formatDuration, type NodeKind } from "@/lib/production-tree";

export const Route = createFileRoute("/_authenticated/decoupage")({
  validateSearch: projectSearch,
  head: () => ({ meta: [{ title: "Découpage et bible — MAVAI" }, { name: "description", content: "Séquences, scènes, plans, prises et couches séparés et versionnés." }, { property: "og:title", content: "Découpage et bible — MAVAI" }, { property: "og:description", content: "Chaque élément de production reste séparé, avec tout son historique." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Decoupage,
});

type Node = { id: string; parent_id: string | null; kind: string };
type Version = { id: string; node_id: string; version: number; title: string; content: string; data: any; note: string; created_at: string };

function Decoupage() {
  const { project } = Route.useSearch();
  const list = useServerFn(listProjects);
  const { data: projects = [] } = useQuery({ queryKey: ["production-projects"], queryFn: () => list() });
  if (!project) return <ModuleShell title="Découpage" subtitle="Choisissez un projet"><div className="grid gap-2">{projects.length ? projects.map((p) => <Button key={p.id} asChild variant="outline" className="justify-start"><Link to="/decoupage" search={{ project: p.id }}>{p.title}</Link></Button>) : <p className="text-muted-foreground">Aucun projet en cours.</p>}</div></ModuleShell>;
  return <Tree projectId={project} />;
}

function Tree({ projectId }: { projectId: string }) {
  const get = useServerFn(getTree), qc = useQueryClient(), key = ["production-tree", projectId];
  const { data, error } = useQuery({ queryKey: key, queryFn: () => get({ data: { projectId } }) });
  const [selected, setSelected] = useState<string | null>(null);
  const latest = useMemo(() => { const m = new Map<string, Version>(); for (const v of (data?.versions ?? []) as Version[]) if (!m.has(v.node_id)) m.set(v.node_id, v); return m; }, [data]);
  const children = (pid: string | null) => ((data?.nodes ?? []) as Node[]).filter((n) => n.parent_id === pid);
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const roots = children(null);
  return <ModuleShell projectId={projectId} title={`Découpage — ${data?.project.title ?? ""}`} subtitle="Tout reste séparé · Chaque modification crée une nouvelle version">
    {error && <p role="alert" className="text-destructive">{error.message}</p>}
    {data && <DurationPicker projectId={projectId} current={data.project.target_duration_seconds} onSaved={refresh} />}
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="space-y-6">
        <section><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Histoire</h2><AddButton projectId={projectId} parentId={null} kind="sequence" onDone={refresh} /></div>
          {roots.filter((n) => n.kind === "sequence").map((n) => <Branch key={n.id} node={n} depth={0} {...{ children, latest, selected, setSelected, projectId, refresh }} />)}
          {!roots.some((n) => n.kind === "sequence") && <p className="text-sm text-muted-foreground">Aucune séquence pour l'instant.</p>}</section>
        <section><h2 className="mb-2 font-semibold">Bible du projet</h2><div className="mb-2 flex flex-wrap gap-2">{bibleKinds.map((k) => <AddButton key={k} projectId={projectId} parentId={null} kind={k} onDone={refresh} />)}</div>
          {roots.filter((n) => bibleKinds.includes(n.kind as NodeKind)).map((n) => <Branch key={n.id} node={n} depth={0} {...{ children, latest, selected, setSelected, projectId, refresh }} />)}</section>
      </div>
      {selected && latest.get(selected) ? <Editor key={selected + latest.get(selected)!.version} nodeId={selected} kind={((data?.nodes ?? []) as Node[]).find((n) => n.id === selected)?.kind as NodeKind} versions={((data?.versions ?? []) as Version[]).filter((v) => v.node_id === selected)} onChange={refresh} onArchived={() => { setSelected(null); refresh(); }} /> : <p className="text-sm text-muted-foreground">Choisissez un élément pour le modifier et voir son historique.</p>}
    </div>
  </ModuleShell>;
}

function Branch({ node, depth, children, latest, selected, setSelected, projectId, refresh }: any) {
  const v: Version | undefined = latest.get(node.id), kids: Node[] = children(node.id);
  return <div style={{ marginLeft: depth * 14 }}>
    <div className={`flex items-center gap-1 rounded-md px-2 py-1 ${selected === node.id ? "bg-accent" : "hover:bg-muted"}`}>
      <ChevronRight className="size-3 text-muted-foreground" />
      <button className="min-w-0 flex-1 truncate text-left text-sm" onClick={() => setSelected(node.id)}><span className="text-muted-foreground">{kindLabels[node.kind as NodeKind]} · </span>{v?.title}{node.kind === "layer" && v?.data?.layerType ? ` (${v.data.layerType})` : ""}<span className="ml-1 text-xs text-muted-foreground">v{v?.version}</span></button>
      {childKinds[node.kind as NodeKind].map((k) => <AddButton key={k} small projectId={projectId} parentId={node.id} kind={k} onDone={refresh} />)}
    </div>
    {kids.map((c) => <Branch key={c.id} node={c} depth={depth + 1} {...{ children, latest, selected, setSelected, projectId, refresh }} />)}
  </div>;
}

function AddButton({ projectId, parentId, kind, onDone, small }: { projectId: string; parentId: string | null; kind: NodeKind; onDone: () => void; small?: boolean }) {
  const create = useServerFn(createNode); const [busy, setBusy] = useState(false);
  return <Button size="sm" variant={small ? "ghost" : "outline"} className={small ? "h-7 px-2 text-xs" : ""} disabled={busy} title={`Ajouter : ${kindLabels[kind]}`} onClick={async () => {
    const title = window.prompt(`Nom ${kind === "layer" ? "de la couche" : "de l'élément"} (${kindLabels[kind]})`); if (!title?.trim()) return;
    setBusy(true); try { await create({ data: { projectId, parentId, kind, title, content: "", data: kind === "layer" ? { layerType: layerTypes[0] } : {} } }); onDone(); } catch (e) { toast.error(e instanceof Error ? e.message : "Création impossible."); } finally { setBusy(false); }
  }}><Plus className="size-3" />{kindLabels[kind]}</Button>;
}

function Editor({ nodeId, kind, versions, onChange, onArchived }: { nodeId: string; kind: NodeKind; versions: Version[]; onChange: () => void; onArchived: () => void }) {
  const save = useServerFn(saveNodeVersion), restore = useServerFn(restoreNodeVersion), archive = useServerFn(setNodeArchived);
  const cur = versions[0]!; const [title, setTitle] = useState(cur.title), [content, setContent] = useState(cur.content), [layerType, setLayerType] = useState<string>(cur.data?.layerType ?? layerTypes[0]), [note, setNote] = useState(""), [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); try { await fn(); toast.success(ok); onChange(); } catch (e) { toast.error(e instanceof Error ? e.message : "Action impossible."); } finally { setBusy(false); } };
  return <section className="space-y-3 rounded-lg border border-border p-4">
    <h2 className="font-semibold">{kindLabels[kind]} · version {cur.version}</h2>
    <Input aria-label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
    {kind === "layer" && <select aria-label="Type de couche" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={layerType} onChange={(e) => setLayerType(e.target.value)}>{layerTypes.map((t) => <option key={t}>{t}</option>)}</select>}
    <Textarea aria-label="Contenu" rows={8} placeholder="Description, dialogue, cadrage, réglages, référence…" value={content} onChange={(e) => setContent(e.target.value)} />
    <Input aria-label="Raison de la modification" placeholder="Pourquoi cette modification ? (facultatif)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
    <div className="flex flex-wrap gap-2">
      <Button disabled={busy || !title.trim()} onClick={() => run(() => save({ data: { nodeId, title, content, note, data: { ...cur.data, ...(kind === "layer" ? { layerType } : {}) } } }), "Nouvelle version enregistrée.")}><Save className="size-4" />Enregistrer une nouvelle version</Button>
      <Button variant="outline" disabled={busy} onClick={async () => { if (!window.confirm("Ranger cet élément (et ce qu'il contient) ? Rien n'est effacé.")) return; try { await archive({ data: { nodeId, archived: true } }); onArchived(); } catch (e) { toast.error(e instanceof Error ? e.message : "Action impossible."); } }}><Archive className="size-4" />Ranger</Button>
    </div>
    <h3 className="flex items-center gap-2 pt-2 text-sm font-semibold"><History className="size-4" />Historique complet</h3>
    <ol className="space-y-2">{versions.map((v) => <li key={v.id} className="rounded-md border border-border p-2 text-sm"><div className="flex items-center justify-between gap-2"><span><b>v{v.version}</b> · {v.note} · {new Date(v.created_at).toLocaleString("fr-FR")}</span>{v.version !== cur.version && <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => restore({ data: { versionId: v.id } }), `Retour à la v${v.version} (nouvelle version créée).`)}><RotateCcw className="size-3" />Revenir</Button>}</div><p className="mt-1 truncate text-muted-foreground">{v.title}{v.content ? ` — ${v.content}` : ""}</p></li>)}</ol>
  </section>;
}

function DurationPicker({ projectId, current, onSaved }: { projectId: string; current: number | null; onSaved: () => void }) {
  const set = useServerFn(setTargetDuration); const [m, setM] = useState(""), [s, setS] = useState("");
  const apply = async (seconds: number | null) => { try { await set({ data: { projectId, seconds } }); toast.success("Durée enregistrée."); onSaved(); } catch (e) { toast.error(e instanceof Error ? e.message : "Durée non enregistrée."); } };
  return <section className="rounded-lg border border-border p-4"><h2 className="font-semibold">Durée de la vidéo : {formatDuration(current)}</h2>
    <div className="mt-3 flex flex-wrap items-center gap-2">{durationPresets.map((p) => <Button key={p.seconds} size="sm" variant={current === p.seconds ? "default" : "outline"} onClick={() => apply(p.seconds)}>{p.label}</Button>)}
      <span className="text-sm text-muted-foreground">ou</span>
      <Input aria-label="Minutes" type="number" min={0} className="w-20" placeholder="min" value={m} onChange={(e) => setM(e.target.value)} />
      <Input aria-label="Secondes" type="number" min={0} max={59} className="w-20" placeholder="s" value={s} onChange={(e) => setS(e.target.value)} />
      <Button size="sm" variant="outline" onClick={() => { const t = toSeconds(Number(m || 0), Number(s || 0)); if (!t) { toast.error("Durée entre 1 seconde et 24 heures."); return; } void apply(t); }}>Valider ma durée</Button></div></section>;
}
