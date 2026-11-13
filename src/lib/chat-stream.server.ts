// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createClient } from "@supabase/supabase-js";
import { streamText, convertToModelMessages, createUIMessageStream, createUIMessageStreamResponse, toUIMessageStream, type ToolSet, type UIMessage } from "ai";
import { withLovableAiGatewayRunIdHeader } from "./gateway/provider.server";
import { createLovableAiGatewayRunIdFetch } from "./gateway/run-id.server";
import type { Database, Json } from "@/integrations/supabase/types";
import { conversationTitleFrom, DEFAULT_CONVERSATION_TITLE, modelContextParts, type ChatStep, type ChatStepId, type MavaiUIMessage } from "./chat-steps";
import { z } from "zod";
import { explainProviderError, getUserChatModel } from "./user-model.server";
import { ANSWER_INSTRUCTIONS } from './answer-policy';

const MODEL = "google/gemini-3-flash-preview";
const userMessageSchema = z.object({
  id: z.string().min(1).max(200),
  role: z.literal("user"),
  parts: z.array(z.union([
    z.object({ type: z.literal("text"), text: z.string().max(100000) }),
    z.object({ type: z.literal("file"), mediaType: z.enum(["image/png", "image/jpeg", "image/webp"]), url: z.string().max(14000000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/) }),
  ])).min(1),
});

export async function handleChatStream(request: Request) {
  const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_PUBLISHABLE_KEY"]; const aiKey = process.env["LOVABLE_API_KEY"];
  const authorization = request.headers.get("Authorization");
  if (!url || !key || !aiKey) return Response.json({ error: "Configuration manquante." }, { status: 500 });
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Connexion requise." }, { status: 401 });
  const sb = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: authorization }, fetch: (input, init) => { const h = new Headers(init?.headers); h.set("apikey", key); return fetch(input, { ...init, headers: h }); } } });
  const { data: claims, error: authError } = await sb.auth.getClaims(authorization.slice(7)); const userId = claims?.claims.sub;
  if (authError || !userId) return Response.json({ error: "Session expirée." }, { status: 401 });
  // History is always read back from the database; only the newest user turn is accepted from the browser.
  const body = z.object({ conversationId: z.string().uuid(), messages: z.array(z.unknown()).min(1) }).safeParse(await request.json().catch(() => null));
  const latestParsed = body.success ? userMessageSchema.safeParse(body.data.messages.at(-1)) : null;
  if (!body.success || !latestParsed?.success) return Response.json({ error: "Message invalide." }, { status: 400 });
  const { conversationId } = body.data; const latest = latestParsed.data as MavaiUIMessage;
  const { data: conversation } = await sb.from("conversations").select("id,project_id,title").eq("id", conversationId).eq("user_id", userId).single();
  if (!conversation) return Response.json({ error: "Conversation introuvable." }, { status: 404 });
  const text = latest.parts.filter(p => p.type === "text").map(p => p.text).join("\n");
  const { data: existing } = await sb.from("messages").select("id").eq("conversation_id", conversationId).eq("client_message_id", latest.id).maybeSingle();
  const { error: saveUser } = existing ? { error: null } : await sb.from("messages").insert({ conversation_id: conversationId, user_id: userId, role: "user", content: text, client_message_id: latest.id, metadata: { parts: latest.parts as unknown as Json } });
  if (saveUser) return Response.json({ error: "Message non enregistré." }, { status: 500 });
  const title = conversation.title === DEFAULT_CONVERSATION_TITLE ? conversationTitleFrom(text) : null;
  if (title) { const { error: titleError } = await sb.from("conversations").update({ title }).eq("id", conversationId).eq("user_id", userId); if (titleError) console.warn("[chat] title not updated", titleError.code); }
  // Only authorized, persisted turns are context. Pending human captions never leak into the active request.
  const { data: past, error: historyError } = await sb.from("messages").select("id,role,content,metadata,client_message_id").eq("conversation_id", conversationId).eq("user_id", userId).order("created_at");
  if (historyError) return Response.json({ error: "Historique indisponible." }, { status: 500 });
  const contextMessages: UIMessage[] = (past ?? []).map(m => {
    const stored = typeof m.metadata === "object" && m.metadata !== null && !Array.isArray(m.metadata) && Array.isArray(m.metadata["parts"]) ? m.metadata["parts"] as unknown as UIMessage["parts"] : null;
    const parts = stored ? modelContextParts(stored) : [];
    return { id: m.client_message_id ?? m.id, role: m.role as "user" | "assistant", parts: parts.length ? parts : [{ type: "text", text: m.content }] };
  });

  const provider = createLovableAiGatewayRunIdFetch();
  const assistantId = crypto.randomUUID();
  const started = Date.now();
  let memoryCount = 0; let artcbStored = false; let systemPrompt = "";
  const stream = createUIMessageStream<MavaiUIMessage>({
    originalMessages: [latest],
    generateId: () => assistantId,
    execute: async ({ writer }) => {
      const step = (id: ChatStepId, data: ChatStep) => writer.write({ type: "data-step", id, data });
      writer.write({ type: "start", messageId: assistantId, messageMetadata: { provider: "Lovable AI", startedAt: new Date(started).toISOString(), stage: "preparation" } });
      step("context", { label: "Message enregistré", detail: `${contextMessages.length} message${contextMessages.length > 1 ? "s" : ""} de la conversation relus`, status: "done" });
      step("memory", { label: "Lecture de la mémoire du projet…", status: "running" });
      const { data: memory, error: memoryError } = await sb.from("memories").select("content").eq("user_id", userId).filter("project_id", conversation.project_id ? "eq" : "is", conversation.project_id ?? null).limit(50);
      memoryCount = memory?.length ?? 0;
      step("memory", memoryError ? { label: "Mémoire indisponible", detail: "Réponse préparée sans la mémoire du projet", status: "error" } : { label: "Mémoire du projet consultée", detail: memoryCount ? `${memoryCount} élément${memoryCount > 1 ? "s" : ""} retenu${memoryCount > 1 ? "s" : ""}` : "Aucun élément enregistré pour ce projet", status: "done" });
      step("artcb", { label: "Consultation d’ARTcB…", status: "running" });
      const { callARTcB } = await import("./artcb.server");
      const artcb = await callARTcB(text, userId, conversationId, request.signal);
      artcbStored = artcb?.stored ?? false;
      step("artcb", artcb ? { label: artcbStored ? "Raisonnement enregistré dans ARTcB" : "ARTcB a répondu", detail: artcb.encoded ? "Accusé d’encodage reçu" : undefined, status: "done" } : { label: "ARTcB non joignable", detail: "MAVAI répond sans ARTcB", status: "skipped" });
      if (request.signal.aborted) return;
      const system = systemPrompt = `Tu es MAVAI, assistant de production audiovisuelle. Date UTC: ${new Date().toISOString()}. Recherche sur Google toute actualité et cite des liens sans prétendre qu’ils sont vérifiés. Mémoire utilisateur: ${(memory ?? []).map(m => m.content).join("\n")}. Préserve le contrôle artistique humain. Tu ne peux pas inspecter ni modifier ton code source, déployer, gérer les secrets ou contacter des services sans outil explicite. Tu peux analyser les images jointes, répondre, rechercher et préparer des propositions. Ne prétends jamais avoir exécuté une action sans résultat d’outil. Les modèles, tokens et mémoires doivent être ceux réellement communiqués, jamais inventés. ${ANSWER_INSTRUCTIONS} En production, chaque élément (plan, prise, image, personnage, décor, voix, réplique, musique, bruitage, sous-titre, couleur, effet, version) reste séparé et versionné avant et après assemblage : l’assemblage ne fait que référencer les éléments, pour que toute correction se fasse au détail près sans perte.`;
      const modelMessages = await convertToModelMessages(contextMessages);
      const { createOpenAICompatible } = await import("@ai-sdk/openai-compatible");
      // Streams one model; parts are buffered until the first real output so a provider that fails up-front can be replaced silently.
      async function run(model: Parameters<typeof streamText>[0]["model"], extra: { maxRetries?: number; providerOptions?: { lovable: { reasoningEffort: "medium" } } } = {}) {
        const res = streamText({ model, maxRetries: 1, abortSignal: request.signal, system, messages: modelMessages, ...extra });
        let failed = false; let reasoned = false; let emitted = false; let errorText = ""; const buffer: unknown[] = [];
        const reader = toUIMessageStream<ToolSet, MavaiUIMessage>({
          stream: res.stream, sendStart: false, sendFinish: false, sendReasoning: true,
          messageMetadata: ({ part }) => part.type === "finish-step" ? { model: part.response.modelId } : undefined,
          onError: error => { failed = true; errorText = error instanceof Error ? error.message : String(error); return errorText || "Le service IA a interrompu la réponse."; },
        }).getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value.type === "reasoning-start") reasoned = true;
          if (value.type === "error") { failed = true; errorText ||= value.errorText; if (!emitted) break; }
          if (!emitted && (value.type === "text-delta" || value.type === "reasoning-delta")) { emitted = true; for (const b of buffer) writer.write(b as never); }
          if (emitted) writer.write(value); else buffer.push(value);
        }
        if (!emitted && !failed) for (const b of buffer) writer.write(b as never);
        return { result: res, failed, reasoned, emitted, errorText };
      }
      const own = await getUserChatModel(userId).catch(() => null);
      let providerName = "Lovable AI";
      let outcome: Awaited<ReturnType<typeof run>> | null = null;
      if (own) {
        step("generation", { label: `Rédaction avec votre compte ${own.name}…`, detail: own.model, status: "running" });
        const ownProvider = createOpenAICompatible({ name: own.provider, baseURL: own.baseURL, apiKey: own.apiKey });
        outcome = await run(ownProvider.chatModel(own.model));
        if (outcome.emitted) providerName = own.name;
        else if (outcome.failed) { step("provider", { label: "Votre compte externe n'a pas pu répondre", detail: explainProviderError(own.name, outcome.errorText), status: "error" }); outcome = null; }
      }
      if (!outcome && !request.signal.aborted) {
        step("generation", { label: "Recherche web et rédaction de la réponse…", detail: "Lovable AI", status: "running" });
        // Inject built-in search after SDK serialization; preserve run correlation and cancellation.
        const searchProvider = createOpenAICompatible({ name: "lovable", baseURL: "https://ai.gateway.lovable.dev/v1", headers: { "Lovable-API-Key": aiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" }, fetch: async (input, init) => { const requestBody = JSON.parse(String(init?.body)); requestBody.tools = [{ type: "google_search" }]; return provider.fetch(input, { ...init, body: JSON.stringify(requestBody) }); } });
        outcome = await run(searchProvider.chatModel(MODEL), { maxRetries: 2, providerOptions: { lovable: { reasoningEffort: "medium" } } });
      }
      if (!outcome) return;
      const { result, reasoned } = outcome; let failed = outcome.failed;
      if (failed && !outcome.emitted) writer.write({ type: "error", errorText: outcome.errorText || "Le service IA a interrompu la réponse." });
      if (request.signal.aborted) return;
      let usage: number | null = null; let modelId: string | null = MODEL;
      try { usage = (await result.totalUsage).totalTokens ?? null; modelId = (await result.response).modelId ?? MODEL; } catch { failed = true; }
      step("generation", failed ? { label: "Génération interrompue", detail: "Le service IA n’a pas terminé la réponse", status: "error" } : { label: "Réponse rédigée", detail: [modelId, usage !== null ? `${usage} tokens` : null, `${((Date.now() - started) / 1000).toFixed(1)} s`, reasoned ? null : "réponse directe, sans réflexion détaillée du modèle"].filter(Boolean).join(" · "), status: "done" });
      writer.write({ type: "finish", finishReason: failed ? "error" : "stop", messageMetadata: { provider: providerName, model: modelId, tokens: usage, memoryCount, artcbStored, durationMs: Date.now() - started, stage: "completed" } });
    },
    onError: error => error instanceof Error ? error.message : "Le service IA a interrompu la réponse.",
    onEnd: async ({ responseMessage, isAborted }) => {
      if (isAborted || request.signal.aborted) return;
      try {
        const answer = responseMessage.parts.filter(p => p.type === "text").map(p => p.text).join("");
        if (!answer) throw new Error("Aucune réponse générée.");
        const meta = (responseMessage.metadata ?? {}) as Record<string, unknown>;
        const metadata = { provider: "Lovable AI", model: (meta["model"] as string | undefined) ?? MODEL, tokens: (meta["tokens"] as number | null | undefined) ?? null, memoryCount, artcbStored, durationMs: Date.now() - started, parts: responseMessage.parts as unknown as Json };
        const { error } = await sb.from("messages").insert({ conversation_id: conversationId, user_id: userId, role: "assistant", content: answer, client_message_id: responseMessage.id, metadata });
        if (error) throw new Error(`Réponse non enregistrée (${error.code}).`);
        const { error: update } = await sb.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", userId);
        if (update) throw new Error("Historique non actualisé.");
        console.debug("[chat] stream persisted");
        const { syncTurnToGitHub } = await import("./github-memory.server");
        await syncTurnToGitHub({ ownerId: userId, projectId: conversation.project_id, conversationId, conversationTitle: title ?? conversation.title, userMessageId: latest.id, userText: text, userParts: latest.parts, assistantMessageId: responseMessage.id, answer, assistantParts: responseMessage.parts, model: metadata.model, tokens: metadata.tokens, memoryCount, artcbStored, systemPrompt, startedAt: new Date(started), durationMs: metadata.durationMs, status: "completed" });
      } catch (error) { console.error("[chat] finish failure", error instanceof Error ? error.message : "unknown"); }
    },
  });
  const response = createUIMessageStreamResponse({ stream });
  return withLovableAiGatewayRunIdHeader(response, provider, { "Cache-Control": "no-store" }, { waitForUpstreamHeaders: false });
}
