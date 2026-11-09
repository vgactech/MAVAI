// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const itemKinds = ["character", "scene", "shot", "asset", "decision", "audio", "frame", "continuity", "storyboard"] as const;
export const listProjects = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("production_projects").select("*").eq("user_id", context.userId).order("updated_at", { ascending: false });
  if (error) throw new Error("Impossible de charger les projets.");
  return data;
});
export const createProject = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string().trim().min(1).max(160), description: z.string().max(4000).default("") }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("production_projects").insert({ ...data, user_id: context.userId }).select("*").single();
    if (error) throw new Error("Impossible de créer le projet.");
    console.debug("[production] project created");
    return row;
  });
export const getProject = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: project, error } = await context.supabase.from("production_projects").select("*").eq("id", data.id).eq("user_id", context.userId).single();
    if (error) throw new Error("Projet introuvable.");
    const { data: items, error: itemError } = await context.supabase.from("production_items").select("*").eq("project_id", data.id).eq("user_id", context.userId).order("created_at", { ascending: false });
    if (itemError) throw new Error("Impossible de charger les ressources.");
    return { project, items };
  });
export const addProjectItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ project_id: z.string().uuid(), kind: z.enum(itemKinds), title: z.string().trim().min(1).max(160), content: z.string().max(100000).default(""), validated: z.boolean().default(false), data: z.record(z.string(), z.any()).default({}) }).parse(d))
  .handler(async ({ context, data }) => {
    const {error:ownerError}=await context.supabase.from('production_projects').select('id').eq('id',data.project_id).eq('user_id',context.userId).single();
    if(ownerError)throw new Error('Projet inaccessible.');
    const { data: row, error } = await context.supabase.from("production_items").insert({ ...data, user_id: context.userId }).select("*").single();
    if (error) throw new Error("Impossible d’enregistrer cette ressource.");
    return row;
  });
export const validateDecision = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), validated: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("production_items").update({ validated: data.validated }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error("Validation non enregistrée.");
    return { ok: true };
  });
export const saveCharacter = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator(async (d: unknown) => { const { characterSchema } = await import("./character-record"); return z.object({ projectId: z.string().uuid(), previousId: z.string().uuid().optional(), character: characterSchema }).parse(d); })
  .handler(async ({context,data}) => {
    const {error:ownerError}=await context.supabase.from('production_projects').select('id').eq('id',data.projectId).eq('user_id',context.userId).single();
    if(ownerError)throw new Error('Projet inaccessible.');
    let version = 1;
    if(data.previousId) { const {data:previous,error} = await context.supabase.from("production_items").select("version,project_id,kind").eq("id",data.previousId).eq("user_id",context.userId).single(); if(error || previous.project_id !== data.projectId || previous.kind !== "character") throw new Error("Version introuvable."); version = previous.version + 1; }
    const {characterPrompt} = await import("./character-record");
    const {data:row,error} = await context.supabase.from("production_items").insert({project_id:data.projectId,user_id:context.userId,kind:"character",title:data.character.name,content:characterPrompt(data.character),data:{...data.character,previousId:data.previousId??null},version}).select("*").single();
    if(error) throw new Error("Personnage non enregistré."); return row;
  });
export const draftProduction = createServerFn({method:"POST"}).middleware([requireSupabaseAuth])
 .inputValidator((d:unknown)=>z.object({projectId:z.string().uuid(),brief:z.string().trim().min(3).max(8000),kind:z.enum(["scene","storyboard","shot"])}).parse(d))
 .handler(async({context,data})=>{
  const {data:project,error}=await context.supabase.from("production_projects").select("title,description").eq("id",data.projectId).eq("user_id",context.userId).single();if(error)throw new Error("Production introuvable.");
  const {data:items}=await context.supabase.from("production_items").select("kind,title,content,validated").eq("project_id",data.projectId).eq("user_id",context.userId).limit(50);
  const {complete}=await import("./mavai-ai.server");
  const content=await complete("Tu es MAVAI, assistant de préproduction. Produis une proposition française exploitable, non validée, sans prétendre avoir rendu une vidéo. Respecte les personnages et décisions validées. Pour un storyboard, donne les panneaux numérotés avec cadrage, action, durée et son. Pour un découpage, donne les plans et raccords. Pour une scène, écris le scénario avec dialogues.",JSON.stringify({project,items,brief:data.brief,livrable:data.kind}));
  const {data:row,error:save}=await context.supabase.from("production_items").insert({project_id:data.projectId,user_id:context.userId,kind:data.kind,title:data.brief.slice(0,160),content,validated:false}).select("*").single();if(save)throw new Error("Proposition non enregistrée.");return row;
 });