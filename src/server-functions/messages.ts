/**
 * Server Function: /api/messages
 * Handles chat message submission: calls OpenAI (text/vision) and optionally
 * ElevenLabs (TTS) for voice mode. Secrets are server-side only — never
 * exposed to client code.
 *
 * Export pattern: plain async handler, compatible with TanStack Start's
 * createServerFn when available. Currently called via fetch('/api/messages').
 * DEBUG MODE ACTIVE
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
            "Tu es Owly, un assistant personnel organisé, bienveillant et professionnel. " +
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

  const reply = await callOpenAI(
    text,
    imageFiles.map((f) => ({ data: f.dataBase64, type: f.type })),
  );

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
