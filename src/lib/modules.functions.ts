import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { renameConversationSchema } from './rename-record';

type Ok<T> = { ok: true } & T;
type Err = { ok: false; error: string };

async function aiErr(e: unknown): Promise<Err> {
  const { AiError } = await import("./mavai-ai.server");
  console.error("[mavai] module error", e);
  return { ok: false, error: e instanceof AiError ? e.message : "Erreur inattendue." };
}

/* ---------- Mémoire ---------- */

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d:unknown)=>z.object({projectId:z.string().uuid().optional(),all:z.boolean().optional(),archived:z.boolean().optional()}).parse(d??{}))
  .handler(async ({ context, data: scope }) => {
    // `all` lists every conversation of the owner (chat hub); otherwise one project or the unassigned ones.
    let query = context.supabase
      .from("conversations")
      .select("id,title,updated_at,project_id,archived_at")
      .eq("user_id",context.userId);
    query = scope.archived ? query.not("archived_at","is",null) : query.is("archived_at",null);
    if (!scope.all) query = query.filter("project_id",scope.projectId?"eq":"is",scope.projectId??null);
    const { data, error } = await query
      .order("updated_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(),projectId:z.string().uuid().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const {data:conversation,error:conversationError}=await context.supabase.from('conversations').select('project_id').eq('id',data.id).eq('user_id',context.userId).single();
    if(conversationError||!conversation||(data.projectId&&conversation.project_id!==data.projectId))throw new Error('Conversation inaccessible dans ce projet.');
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("id,role,content,created_at,metadata,client_message_id")
      .eq("conversation_id", data.id)
      .order("created_at");
    if (error) throw new Error(error.message);
    return rows as Array<{ id: string; client_message_id:string|null; role: "user" | "assistant"; content: string; created_at: string; metadata: {model?:string;tokens?:number;durationMs?:number;provider?:string;stopped?:boolean;parts?:import('@/integrations/supabase/types').Json[]} }>;
  });

export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").delete().eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Move a conversation to another owned project, or archive/unarchive it. */
export const renameConversation = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => renameConversationSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from('conversations').update({ title: data.title, updated_at: new Date().toISOString() }).eq('id', data.id).eq('user_id', context.userId).select('id,title').single();
    if (error || !row) throw new Error('Chat inaccessible ou renommage impossible.');
    return row;
  });

export const updateConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), projectId: z.string().uuid().optional(), archived: z.boolean().optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const patch: { project_id?: string; archived_at?: string | null } = {};
    if (data.projectId) patch.project_id = data.projectId;
    if (data.archived !== undefined) patch.archived_at = data.archived ? new Date().toISOString() : null;
    const { error } = await context.supabase.from("conversations").update(patch).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error(error.code === "42501" ? "Ce projet ne vous appartient pas." : error.message);
    return { ok: true };
  });

/** Full-memory links: the chat reads the complete history of other owned chats (any project). */
export const getLinkedConversations = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase.from("conversations").select("linked_conversation_ids").eq("id", data.id).eq("user_id", context.userId).single();
    if (error || !row) throw new Error("Chat inaccessible.");
    return row.linked_conversation_ids ?? [];
  });

export const setLinkedConversations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), linkedIds: z.array(z.string().uuid()).max(20) }).parse(d))
  .handler(async ({ context, data }) => {
    const ids = [...new Set(data.linkedIds.filter(x => x !== data.id))];
    if (ids.length) {
      const { data: owned, error } = await context.supabase.from("conversations").select("id").eq("user_id", context.userId).in("id", ids);
      if (error || (owned ?? []).length !== ids.length) throw new Error("Un des chats choisis ne vous appartient pas.");
    }
    const { error } = await context.supabase.from("conversations").update({ linked_conversation_ids: ids }).eq("id", data.id).eq("user_id", context.userId);
    if (error) throw new Error("Liaison impossible.");
    return { ok: true, count: ids.length };
  });

export const listMemories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d:unknown)=>z.object({projectId:z.string().uuid().optional()}).parse(d??{}))
  .handler(async ({ context, data: scope }) => {
    const { data, error } = await context.supabase
      .from("memories")
      .select("id,content,created_at")
      .eq("user_id",context.userId)
      .filter("project_id",scope.projectId?"eq":"is",scope.projectId??null)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const addMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ projectId:z.string().uuid(), content: z.string().trim().min(1).max(1000) }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("memories")
      .insert({ content: data.content, project_id:data.projectId, user_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase.from("memories").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------- Travaux (Signal Desk / Agents / Studio) ---------- */

export type WorkResult = { text?: string; image?: string; steps?: Array<{ agent: string; text: string }> };

const Kind = z.enum(["briefing", "agents", "image"]);

export const listWorks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ kind: Kind, projectId:z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("works")
      .select("id,prompt,result,created_at")
      .eq("kind", data.kind)
      .eq("project_id",data.projectId)
      .eq("user_id",context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return rows as unknown as Array<{ id: string; prompt: string; result: WorkResult; created_at: string }>;
  });

export const deleteWork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase.from("works").delete().eq("id", data.id);
    return { ok: true };
  });

const Prompt = z.object({ projectId:z.string().uuid(), prompt: z.string().trim().min(2).max(4000) });

const BRIEF_SYSTEM =
  "Tu es le Signal Desk de MAVAI, un rédacteur en chef qui prépare des briefings éditoriaux en français. " +
  "Structure en markdown : ## Résumé (3 phrases), ## Sujets émergents (5 puces avec pourquoi c'est important), " +
  "## Angles vidéo (4 idées de vidéos avec titre accrocheur et format), ## Sources à consulter (types de sources et recherches précises à faire), " +
  "## Sources (liens réels trouvés via la recherche). Utilise obligatoirement la recherche Google en direct pour des informations récentes et datées.";

export const runBriefing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Prompt.parse(d))
  .handler(async ({ context, data }): Promise<Ok<{ id: string; text: string }> | Err> => {
    try {
      const {error:projectError}=await context.supabase.from("production_projects").select("id").eq("id",data.projectId).eq("user_id",context.userId).single(); if(projectError) throw new Error("Projet inaccessible.");
      const { searchComplete } = await import("./mavai-ai.server");
      const text = await searchComplete(BRIEF_SYSTEM, `Sujet du briefing : ${data.prompt}`);
      const { data: row, error } = await context.supabase
        .from("works")
        .insert({ kind: "briefing", prompt: data.prompt, result: { text }, project_id:data.projectId, user_id: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: row.id, text };
    } catch (e) {
      return aiErr(e);
    }
  });

const AGENTS = [
  {
    name: "Planificateur",
    system:
      "Tu es l'agent Planificateur de MAVAI. Découpe la mission en 3 à 6 étapes numérotées, claires et actionnables. Sois bref.",
  },
  {
    name: "Chercheur",
    system:
      "Tu es l'agent Chercheur de MAVAI. À partir de la mission et du plan, rassemble les faits, données, arguments et exemples utiles. Marque « À vérifier » ce qui est incertain.",
  },
  {
    name: "Rédacteur",
    system:
      "Tu es l'agent Rédacteur de MAVAI. Produis le livrable final complet en markdown, en français, à partir du plan et des recherches.",
  },
  {
    name: "Vérificateur",
    system:
      "Tu es l'agent Vérificateur de MAVAI. Relis le livrable : liste les erreurs, incohérences ou points faibles, puis donne une note de confiance sur 10 et les corrections à apporter. Sois concis.",
  },
] as const;

export const runAgents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Prompt.parse(d))
  .handler(
    async ({ context, data }): Promise<Ok<{ id: string; steps: Array<{ agent: string; text: string }> }> | Err> => {
      try {
        const {error:projectError}=await context.supabase.from("production_projects").select("id").eq("id",data.projectId).eq("user_id",context.userId).single(); if(projectError) throw new Error("Projet inaccessible.");
        const { complete } = await import("./mavai-ai.server");
        const steps: Array<{ agent: string; text: string }> = [];
        for (const a of AGENTS) {
          const ctx =
            `Mission : ${data.prompt}\n\n` +
            steps.map((s) => `### Travail de l'agent ${s.agent}\n${s.text}`).join("\n\n");
          const { searchComplete } = await import("./mavai-ai.server");
          const text =
            a.name === "Chercheur"
              ? await searchComplete(a.system + " Utilise la recherche Google en direct et cite les liens.", ctx)
              : await complete(a.system, ctx);
          steps.push({ agent: a.name, text });
        }
        const { data: row, error } = await context.supabase
          .from("works")
          .insert({ kind: "agents", prompt: data.prompt, result: { steps }, project_id:data.projectId, user_id: context.userId })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        return { ok: true, id: row.id, steps };
      } catch (e) {
        return aiErr(e);
      }
    },
  );

export const runStudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Prompt.parse(d))
  .handler(async ({ context, data }): Promise<Ok<{ id: string; image: string }> | Err> => {
    try {
      const {error:projectError}=await context.supabase.from("production_projects").select("id").eq("id",data.projectId).eq("user_id",context.userId).single(); if(projectError) throw new Error("Projet inaccessible.");
      const { generateImage } = await import("./mavai-ai.server");
      const image = await generateImage(data.prompt);
      const { data: row, error } = await context.supabase
        .from("works")
        .insert({ kind: "image", prompt: data.prompt, result: { image }, project_id:data.projectId, user_id: context.userId })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return { ok: true, id: row.id, image };
    } catch (e) {
      return aiErr(e);
    }
  });
