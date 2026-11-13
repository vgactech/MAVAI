import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nodeKinds, canHaveChild, type NodeKind } from "./production-tree";

type Ctx = { supabase: any; userId: string };
async function ownProject(ctx: Ctx, projectId: string) {
  const { data, error } = await ctx.supabase.from("production_projects").select("id,title,target_duration_seconds").eq("id", projectId).eq("user_id", ctx.userId).single();
  if (error || !data) throw new Error("Projet inaccessible.");
  return data;
}
async function nextVersion(ctx: Ctx, nodeId: string) {
  const { data } = await ctx.supabase.from("production_node_versions").select("version").eq("node_id", nodeId).order("version", { ascending: false }).limit(1);
  return (data?.[0]?.version ?? 0) + 1;
}

export const getTree = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const project = await ownProject(context, data.projectId);
    const { data: nodes, error } = await context.supabase.from("production_nodes").select("*").eq("project_id", data.projectId).eq("user_id", context.userId).is("archived_at", null).order("position").order("created_at");
    if (error) throw new Error("Impossible de charger le découpage.");
    const ids = nodes.map((n) => n.id);
    const { data: versions, error: vErr } = ids.length ? await context.supabase.from("production_node_versions").select("*").in("node_id", ids).order("version", { ascending: false }) : { data: [], error: null };
    if (vErr) throw new Error("Impossible de charger les versions.");
    return { project, nodes, versions: versions ?? [] };
  });

export const createNode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid(), parentId: z.string().uuid().nullable(), kind: z.enum(nodeKinds), title: z.string().trim().min(1).max(200), content: z.string().max(50000).default(""), data: z.record(z.string(), z.any()).default({}) }).parse(d))
  .handler(async ({ context, data }) => {
    await ownProject(context, data.projectId);
    let parentKind: NodeKind | null = null;
    if (data.parentId) {
      const { data: parent, error } = await context.supabase.from("production_nodes").select("kind,project_id").eq("id", data.parentId).eq("user_id", context.userId).single();
      if (error || parent.project_id !== data.projectId) throw new Error("Élément parent introuvable.");
      parentKind = parent.kind as NodeKind;
    }
    if (!canHaveChild(parentKind, data.kind)) throw new Error("Cet élément ne peut pas être rangé ici.");
    const { count } = await context.supabase.from("production_nodes").select("id", { count: "exact", head: true }).eq("project_id", data.projectId).eq("user_id", context.userId).filter("parent_id", data.parentId ? "eq" : "is", data.parentId ?? null);
    const { data: node, error } = await context.supabase.from("production_nodes").insert({ project_id: data.projectId, user_id: context.userId, parent_id: data.parentId, kind: data.kind, position: count ?? 0 }).select("*").single();
    if (error) throw new Error("Élément non créé.");
    const { error: vErr } = await context.supabase.from("production_node_versions").insert({ node_id: node.id, user_id: context.userId, version: 1, title: data.title, content: data.content, data: data.data, note: "Création" });
    if (vErr) throw new Error("Version initiale non enregistrée.");
    return node;
  });

export const saveNodeVersion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ nodeId: z.string().uuid(), title: z.string().trim().min(1).max(200), content: z.string().max(50000), data: z.record(z.string(), z.any()).default({}), note: z.string().max(500).default("") }).parse(d))
  .handler(async ({ context, data }) => {
    const { error: own } = await context.supabase.from("production_nodes").select("id").eq("id", data.nodeId).eq("user_id", context.userId).single();
    if (own) throw new Error("Élément introuvable.");
    const version = await nextVersion(context, data.nodeId);
    const { data: row, error } = await context.supabase.from("production_node_versions").insert({ node_id: data.nodeId, user_id: context.userId, version, title: data.title, content: data.content, data: data.data, note: data.note || `Modification (v${version})` }).select("*").single();
    if (error) throw new Error("Version non enregistrée.");
    return row;
  });

export const restoreNodeVersion = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ versionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: old, error } = await context.supabase.from("production_node_versions").select("*").eq("id", data.versionId).eq("user_id", context.userId).single();
    if (error) throw new Error("Version introuvable.");
    const version = await nextVersion(context, old.node_id);
    const { error: e2 } = await context.supabase.from("production_node_versions").insert({ node_id: old.node_id, user_id: context.userId, version, title: old.title, content: old.content, data: old.data, note: `Retour à la v${old.version}` });
    if (e2) throw new Error("Retour arrière impossible.");
    return { ok: true };
  });

export const setNodeArchived = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ nodeId: z.string().uuid(), archived: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("production_nodes").update({ archived_at: data.archived ? new Date().toISOString() : null }).eq("id", data.nodeId).eq("user_id", context.userId);
    if (error) throw new Error("Action impossible.");
    return { ok: true };
  });

export const setTargetDuration = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId: z.string().uuid(), seconds: z.number().int().min(1).max(86400).nullable() }).parse(d))
  .handler(async ({ context, data }) => {
    await ownProject(context, data.projectId);
    const { error } = await context.supabase.from("production_projects").update({ target_duration_seconds: data.seconds }).eq("id", data.projectId).eq("user_id", context.userId);
    if (error) throw new Error("Durée non enregistrée.");
    return { ok: true };
  });
