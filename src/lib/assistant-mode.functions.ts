import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const assistantModes = ["audiovisual", "dr_manathan"] as const;
export type AssistantMode = (typeof assistantModes)[number];

export const getConversationMode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row } = await context.supabase.from("conversations").select("assistant_mode").eq("id", data.conversationId).eq("user_id", context.userId).maybeSingle();
    return { mode: (row?.assistant_mode ?? "audiovisual") as AssistantMode };
  });

export const setConversationMode = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversationId: z.string().uuid(), mode: z.enum(assistantModes) }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversations").update({ assistant_mode: data.mode }).eq("id", data.conversationId).eq("user_id", context.userId);
    if (error) throw new Error("Mode non enregistré.");
    return { mode: data.mode };
  });

export const logCommandEvent = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    conversationId: z.string().uuid().nullable(), command: z.string().max(40), source: z.enum(["text", "voice"]),
    status: z.enum(["recognized", "acknowledged", "executing", "succeeded", "failed", "canceled"]), correlationId: z.string().uuid(),
  }).parse(d))
  .handler(async ({ context, data }) => {
    await context.supabase.from("command_events").insert({ user_id: context.userId, conversation_id: data.conversationId, command: data.command, source: data.source, status: data.status, correlation_id: data.correlationId });
    return { ok: true };
  });
