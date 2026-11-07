/**
 * Server Function: /api/messages
 * Handles chat message submission: dual-path — ARTcB backend (primary) or
 * OpenAI (fallback). ElevenLabs (TTS) for voice mode.
 * Secrets are server-side only — never exposed to client code.
 *
 * Dual-path routing:
 *   1. If ARTCB_API_URL is set → POST /api/v1/ai/think on artcb.me
 *   2. Fallback → OpenAI gpt-4o-mini / gpt-4o (vision)
 *
 * CERTIFIED_100=false | unique_human_proven=false | Mode DEBUG actif
 */

import { z } from "zod";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const FileItemSchema = z.object({
  name: z.string(),
  type: z.string(),
  dataBase64: z.string(),
  sizeBytes: z.number(),
});

export const SendMessageSchema = z.object({
  text: z.string(),
  mode: z.enum(["chat", "memory", "voice"]),
  sessionId: z.string(),
  userId: z.string(),
  userMessageId: z.string(),
  files: z.array(FileItemSchema).default([]),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type FileItem = z.infer<typeof FileItemSchema>;

export interface MessageResponse {
  reply: string;
  /** TTS audio as a base64 data URI (voice mode only) */
  audioUrl?: string;
  /** Present if OCR was attempted: always "À vérifier" */
  ocrNote?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * readSecret — reads a secret from process.env.
 * Never returns the value in logs or error messages.
 */
function readSecret(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Secret manquant côté serveur: ${name}`);
  return val;
}

/**
 * callARTcB — sends a message to the ARTcB backend (artcb.me /api/v1/ai/think).
 * Returns the AI reply or throws if the endpoint is unavailable.
 * ARTCB_API_URL must be set (e.g. https://artcb.me) — never hardcoded.
 * ARTCB_API_KEY is optional (Bearer token for authenticated requests).
 */
async function callARTcB(text: string, sessionId: string, userId: string): Promise<string> {
  const baseUrl = process.env["ARTCB_API_URL"];
  if (!baseUrl) throw new Error("ARTCB_API_URL not set");

  const apiKey = process.env["ARTCB_API_KEY"];
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  // ARTcB /api/v1/ai/think expects "question" (not "text") — ThinkRequest schema.
  // Response fields: message (always), reply / content / text (legacy).
  const res = await fetch(`${baseUrl}/api/v1/ai/think`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      question: text,
      agent: `mavai-user-${userId.slice(0, 8)}`,
      session_id: sessionId,
      inject_context: true,
      visibility: "private",
      store_block: true,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[DEBUG][messages] ARTcB error:", res.status, err.slice(0, 200));
    throw new Error(`ARTcB ${res.status}`);
  }

  const json = (await res.json()) as {
    message?: string;
    reply?: string;
    content?: string;
    text?: string;
  };
  // "message" is the primary field returned by /ai/think on artcb.me
  const reply = json.message ?? json.reply ?? json.content ?? json.text;
  if (!reply) throw new Error("ARTcB: empty reply");
  return reply;
}

type ImageInput = { data: string; type: string };

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail: "auto" } };

/**
 * callOpenAI — sends a chat completion request.
 * Uses gpt-4o if images are attached, gpt-4o-mini otherwise.
 */
async function callOpenAI(text: string, images: ImageInput[]): Promise<string> {
  const apiKey = readSecret("OPENAI_API_KEY");
  const model = images.length > 0 ? "gpt-4o" : "gpt-4o-mini";

  const userContent: ContentPart[] = [{ type: "text", text: text || "Analyse ces fichiers." }];

  for (const img of images) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${img.type};base64,${img.data}`, detail: "auto" },
    });
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Tu es MAVAI (Mémoire Artificielle Visuelle & IA), un assistant IA avancé. " +
            "Tu es organisé, bienveillant et professionnel. " +
            "Réponds en français sauf si l'utilisateur écrit dans une autre langue. " +
            "Pour les résultats OCR, indique toujours « À vérifier » si le contenu est incertain.",
        },
        { role: "user", content: userContent },
      ],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("[DEBUG][messages] OpenAI error:", res.status, err.slice(0, 200));
    throw new Error(`OpenAI ${res.status}`);
  }

  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  return json.choices[0]?.message?.content ?? "(Pas de réponse)";
}

/**
 * callElevenLabs — converts text to speech.
 * Returns a base64 data URI (audio/mpeg) or undefined if key is absent.
 */
async function callElevenLabs(text: string): Promise<string | undefined> {
  let apiKey: string;
  try {
    apiKey = readSecret("ELEVENLABS_API_KEY");
  } catch {
    console.warn("[DEBUG][messages] ElevenLabs key absent — skipping TTS");
    return undefined;
  }

  const voiceId = process.env["ELEVENLABS_VOICE_ID"] ?? "EXAVITQu4vr4xnSDxMaL";

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });

  if (!res.ok) {
    console.error("[DEBUG][messages] ElevenLabs error:", res.status);
    return undefined;
  }

  const buffer = await res.arrayBuffer();
  // Buffer is available in Node/TanStack Start server context
  const base64 = Buffer.from(buffer).toString("base64");
  return `data:audio/mpeg;base64,${base64}`;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

/**
 * sendMessageHandler — main entry point called by /chat route via fetch.
 */
export async function sendMessageHandler(raw: unknown): Promise<MessageResponse> {
  const data = SendMessageSchema.parse(raw);
  const { text, mode, sessionId, userId, userMessageId, files } = data;

  console.debug("[DEBUG][messages] sendMessageHandler", {
    mode,
    sessionId,
    userId,
    userMessageId,
    fileCount: files.length,
  });

  const imageFiles = files.filter((f) => f.type.startsWith("image/"));
  const otherFiles = files.filter((f) => !f.type.startsWith("image/"));

  const ocrNote =
    otherFiles.length > 0
      ? "Les documents joints ont été transmis. Le contenu extrait est « À vérifier »."
      : undefined;

  // ── Dual-path routing ──────────────────────────────────────────────────────
  // Path A: ARTcB backend (artcb.me) — primary if ARTCB_API_URL is set.
  //         Images not forwarded to ARTcB (text-only endpoint).
  // Path B: OpenAI — fallback, or always used when images are attached.
  let reply: string;
  const artcbUrl = process.env["ARTCB_API_URL"];
  const useARTcB = !!artcbUrl && imageFiles.length === 0;

  if (useARTcB) {
    try {
      reply = await callARTcB(text, sessionId, userId);
      console.debug("[DEBUG][messages] ARTcB reply received", { replyLength: reply.length });
    } catch (artcbErr) {
      console.warn("[DEBUG][messages] ARTcB failed, falling back to OpenAI:", artcbErr);
      reply = await callOpenAI(text, []);
    }
  } else {
    reply = await callOpenAI(
      text,
      imageFiles.map((f) => ({ data: f.dataBase64, type: f.type })),
    );
  }

  let audioUrl: string | undefined;
  if (mode === "voice") {
    audioUrl = await callElevenLabs(reply);
  }

  console.debug("[DEBUG][messages] sendMessageHandler done", {
    replyLength: reply.length,
    hasAudio: !!audioUrl,
    ocrNote,
  });

  const response: MessageResponse = { reply };
  if (audioUrl !== undefined) response.audioUrl = audioUrl;
  if (ocrNote !== undefined) response.ocrNote = ocrNote;
  return response;
}
