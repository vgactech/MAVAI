// Server-only: MAVAI AI calls (Lovable AI for text, ElevenLabs for voice in/out).
import { audioExtension, speechChunks } from './voice-text';
const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const SYSTEM =
  "Tu es MAVAI (Mémoire Artificielle Visuelle & IA), l'intelligence centrale de l'écosystème ARTcB. " +
  "Tu es précis, chaleureux et professionnel. Tu réponds dans la langue de l'utilisateur (français par défaut). " +
  "Réponses complètes, claires et structurées ; en mode vocal, conserve tous les détails utiles avec une formulation naturelle. " +
  "Quand un contenu extrait d'un document est incertain, indique « À vérifier ».";

export type HistoryItem = { role: "user" | "assistant"; content: string };
export type ImageInput = { type: string; dataBase64: string };

export class AiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function askMavai(opts: {
  history: HistoryItem[];
  text: string;
  images: ImageInput[];
  voice: boolean;
  memory?: string[];
}): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError(500, "Configuration IA manquante.");

  type Part = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
  const userContent: Part[] = [{ type: "text", text: opts.text || "Analyse ces fichiers." }];
  for (const img of opts.images) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${img.type};base64,${img.dataBase64}` },
    });
  }

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      tools: [{ type: "google_search" }],
      messages: [
        {
          role: "system",
          content:
            SYSTEM +
            ` Date du jour : ${new Date().toLocaleDateString("fr-FR", { dateStyle: "full" })}. ` +
            "Tu as accès à la recherche Google en direct : utilise-la pour toute question d'actualité, de prix, de date ou de fait récent, et cite tes sources (nom du site + lien)." +
            (opts.voice ? " L'utilisateur est en mode vocal." : "") +
            (opts.memory?.length
              ? "\n\nMémoire de l'utilisateur (faits à prendre en compte) :\n- " + opts.memory.join("\n- ")
              : ""),
        },
        ...opts.history,
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[mavai] AI error", res.status, body.slice(0, 300));
    if (res.status === 429) throw new AiError(429, "Trop de demandes, réessayez dans un instant.");
    if (res.status === 402) throw new AiError(402, "Crédits IA épuisés. Rechargez-les dans Paramètres → Plans & crédits.");
    throw new AiError(res.status, "Le service IA n'a pas répondu.");
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() || "(Pas de réponse)";
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Text → speech. Returns a data URI or undefined when voice is unavailable. */
export async function speak(text: string, signal?: AbortSignal): Promise<string> {
  const buffers: Uint8Array[] = [];
  for (const chunk of speechChunks(text)) buffers.push(new Uint8Array(await synthesizeSpeech(chunk, signal)));
  const bytes = new Uint8Array(buffers.reduce((n, b) => n + b.length, 0));
  let offset = 0; for (const b of buffers) { bytes.set(b, offset); offset += b.length; }
  return `data:audio/mpeg;base64,${toBase64(bytes.buffer)}`;
}

export async function synthesizeSpeech(text: string, signal?: AbortSignal): Promise<ArrayBuffer> {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) throw new AiError(500, "Lecture vocale non configurée.");
  const voiceId = process.env["ELEVENLABS_VOICE_ID"] ?? "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
    method: "POST",
    signal: signal ?? null,
    headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) {
    throw await voiceProviderError(res, 'Lecture vocale');
  }
  return res.arrayBuffer();
}

async function voiceProviderError(res: Response, service: string): Promise<AiError> {
  const body = await res.json().catch(() => null) as { detail?: { message?: string } | string; message?: string } | null;
  const supplied = typeof body?.detail === 'string' ? body.detail : body?.detail?.message ?? body?.message;
  const safe = supplied?.replace(/(?:sk-|dp\.|sb_|Bearer\s+)[A-Za-z0-9._-]+/gi, '[masqué]').replace(/https?:\/\/\S+/g, '[service]').slice(0, 300);
  const reason = ({400:'Format audio ou texte invalide.',401:'Connexion ElevenLabs invalide.',402:'Solde ElevenLabs insuffisant.',403:'Accès ElevenLabs refusé.',429:'Limite ElevenLabs atteinte.'} as Record<number,string>)[res.status] ?? 'Service ElevenLabs indisponible.';
  console.warn('[mavai] voice provider status', res.status);
  return new AiError(res.status, `${service} [${res.status}] : ${safe || reason}`);
}

/** Speech → text with ElevenLabs Scribe. */
export async function transcribe(audioBase64: string, mime: string, signal?: AbortSignal): Promise<string> {
  const key = process.env["ELEVENLABS_API_KEY"];
  if (!key) throw new AiError(500, "Reconnaissance vocale non configurée.");
  const form = new FormData();
  form.append("model_id", "scribe_v1");
  const ext = audioExtension(mime);
  form.append("file", new Blob([fromBase64(audioBase64)], { type: mime }), `voice.${ext}`);
  const res = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    signal: signal ?? null,
    headers: { "xi-api-key": key },
    body: form,
  });
  if (!res.ok) {
    throw await voiceProviderError(res, 'Transcription');
  }
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

function gatewayError(status: number): AiError {
  if (status === 429) return new AiError(429, "Trop de demandes, réessayez dans un instant.");
  if (status === 402) return new AiError(402, "Crédits IA épuisés. Rechargez-les dans Paramètres → Plans & crédits.");
  return new AiError(status, "Le service IA n'a pas répondu.");
}

/** One-shot completion with a custom role prompt (Responses API, streamed). */
export async function complete(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError(500, "Configuration IA manquante.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: [{ role: "user", content: user }],
      stream: true,
      store: false,
      reasoning: { effort: "low" },
    }),
  });
  if (!res.ok || !res.body) {
    console.error("[mavai] AI error", res.status, (await res.text()).slice(0, 300));
    throw gatewayError(res.status);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload) as { type?: string; delta?: string };
        if (ev.type === "response.output_text.delta" && ev.delta) out += ev.delta;
      } catch {
        /* ignore partial */
      }
    }
  }
  return out.trim();
}

/** Text → image. Returns a data URI. */
export async function generateImage(prompt: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError(500, "Configuration IA manquante.");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-image-2.5-sunburst",
      prompt,
      size: "1024x1024",
      output_format: "jpeg",
      quality: "medium",
    }),
  });
  if (!res.ok) {
    console.error("[mavai] image error", res.status, (await res.text()).slice(0, 300));
    throw gatewayError(res.status);
  }
  const json = (await res.json()) as { data?: Array<{ b64_json?: string }> };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new AiError(500, "Aucune image générée. Reformulez la demande.");
  const mime = b64.startsWith("iVBOR") ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${b64}`;
}

/** Completion grounded with live Google Search (used by Signal Desk). */
export async function searchComplete(system: string, user: string): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError(500, "Configuration IA manquante.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODEL,
      tools: [{ type: "google_search" }],
      messages: [
        {
          role: "system",
          content: `${system} Date du jour : ${new Date().toLocaleDateString("fr-FR", { dateStyle: "full" })}.`,
        },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    console.error("[mavai] search error", res.status, (await res.text()).slice(0, 300));
    throw gatewayError(res.status);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() || "";
}
