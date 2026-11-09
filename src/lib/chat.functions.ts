import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SendSchema = z.object({
  text: z.string().max(20000),
  voice: z.boolean(),
  conversationId: z.string().uuid().nullable(),
  images: z
    .array(z.object({ type: z.string(), dataBase64: z.string().max(14_000_000) }))
    .max(5),
});

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SendSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { askMavai, speak, AiError } = await import("./mavai-ai.server");
    const { callARTcB } = await import("./artcb.server");
    const sb = context.supabase;
    try {
      let conversationId = data.conversationId;
      if (!conversationId) {
        const title = (data.text || "Analyse d'image").slice(0, 60);
        const { data: c, error } = await sb
          .from("conversations")
          .insert({ title, user_id: context.userId })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        conversationId = c.id;
      }
      const [{ data: past }, { data: mems }] = await Promise.all([
        sb
          .from("messages")
          .select("role,content")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: false }),
        sb.from("memories").select("content").eq('user_id', context.userId).limit(50),
      ]);
      const history = (past ?? [])
        .reverse()
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

      // Send only the current text to ARTcB; keep saved memory/images on the existing AI path.
      const artcb = data.images.length === 0 && data.text.trim()
        ? await callARTcB(data.text, context.userId, conversationId)
        : null;
      const reply = artcb?.reply ?? await askMavai({
        history,
        text: data.text,
        images: data.images,
        voice: data.voice,
        memory: (mems ?? []).map((m) => m.content),
      });
      const { error: saveError } = await sb.from("messages").insert([
        { conversation_id: conversationId, user_id: context.userId, role: "user", content: data.text || "Analyse ces images." },
        { conversation_id: conversationId, user_id: context.userId, role: "assistant", content: reply },
      ]);
      if (saveError) throw new Error("Messages non enregistrés.");
      const { error: updateError } = await sb.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
      if (updateError) throw new Error("Historique non actualisé.");
      const audioUrl = data.voice ? await speak(reply) : undefined;
      return { ok: true as const, reply, audioUrl: audioUrl ?? null, conversationId,
        provider: artcb?.reply ? "artcb" as const : "lovable-ai" as const,
        artcb: artcb ? { encoded: artcb.encoded, stored: artcb.stored } : null };
    } catch (e) {
      console.error("[mavai] chat error", e);
      const msg = e instanceof AiError ? e.message : "Erreur inattendue.";
      return { ok: false as const, error: msg };
    }
  });

/** Client fallback for a deliberately stopped streaming answer. */
export const saveStoppedAnswer = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid(), id: z.string().max(200), content: z.string().max(100000) }).parse(d))
  .handler(async ({data, context}) => {
    if (!data.content) return;
    const sb = context.supabase;
    const {data: owner} = await sb.from('conversations').select('id').eq('id', data.conversationId).eq('user_id', context.userId).single();
    if (!owner) throw new Error('Conversation introuvable.');
    const {data: existing} = await sb.from('messages').select('id').eq('conversation_id', data.conversationId).eq('client_message_id', data.id).maybeSingle();
    if (existing) return;
    const {error} = await sb.from('messages').insert({conversation_id: data.conversationId, user_id:context.userId, role:'assistant', content:data.content, client_message_id:data.id, metadata:{stopped:true,parts:[{type:'text',text:data.content}]}});
    if (error) throw new Error('Réponse interrompue non enregistrée.');
  });

const TranscribeSchema = z.object({
  audioBase64: z.string().max(14_000_000),
  mime: z.string(),
});

export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TranscribeSchema.parse(d))
  .handler(async ({ data }) => {
    const { transcribe, AiError } = await import("./mavai-ai.server");
    try {
      return { ok: true as const, text: await transcribe(data.audioBase64, data.mime) };
    } catch (e) {
      return { ok: false as const, error: e instanceof AiError ? e.message : "Erreur audio." };
    }
  });
