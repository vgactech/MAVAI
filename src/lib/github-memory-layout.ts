// KLERIO-style memory layout (one private repo per owner). Pure and browser-safe so it can be tested.
export const MEMORY_SCHEMA_VERSION = "1.0";
export const MEMORY_REPO_PREFIX = "mavai-memoire-";

export function memoryRepoName(userId: string) {
  return MEMORY_REPO_PREFIX + userId.replace(/-/g, "").slice(0, 12);
}

export type TurnInput = {
  ownerId: string; ownerMarker: string; projectId: string | null; conversationId: string; conversationTitle: string;
  userMessageId: string; userText: string; userParts: unknown[];
  assistantMessageId: string; answer: string; assistantParts: unknown[];
  model: string; tokens: number | null; memoryCount: number; artcbStored: boolean;
  systemPrompt: string; startedAt: Date; durationMs: number; status: "completed" | "failed";
};

const pad = (n: number) => String(n).padStart(2, "0");
const json = (v: unknown) => JSON.stringify(v, null, 2) + "\n";

type Part = { type?: string; text?: string; data?: unknown; id?: string };

export function rootManifest(ownerId: string, ownerMarker: string, login: string) {
  return { schema_version: MEMORY_SCHEMA_VERSION, app: "MAVAI", owner_id: ownerId, owner_marker: ownerMarker, github_login: login, layout: "klerio-v1" };
}

/** Files written for one chat turn: conversation manifest, both messages, the AI run, tasks and events. */
export function turnFiles(t: TurnInput): Record<string, string> {
  const d = t.startedAt; const y = d.getUTCFullYear(); const m = pad(d.getUTCMonth() + 1); const day = pad(d.getUTCDate());
  const conv = `conversations/${y}/${m}/${t.conversationId}`;
  const runId = t.assistantMessageId;
  const parts = t.assistantParts as Part[];
  const reasoning = parts.filter(p => p.type === "reasoning").map(p => p.text ?? "");
  const steps = parts.filter(p => p.type === "data-step").map(p => ({ id: p.id, ...(p.data as object) }));
  const base = { schema_version: MEMORY_SCHEMA_VERSION, owner_id: t.ownerId, owner_marker: t.ownerMarker, project_id: t.projectId, session_id: t.conversationId };
  const finished = new Date(d.getTime() + t.durationMs).toISOString();
  const event = (phase: string, event_type: string, at: string, extra: object = {}) => ({ ...base, event_id: `${runId}-${phase}`, run_id: runId, actor: phase === "before" ? "user" : "mavai_agent", event_type, phase, occurred_at: at, command: "send_message", correlation_id: runId, ...extra });
  return {
    [`${conv}/manifest.json`]: json({ ...base, title: t.conversationTitle, updated_at: finished }),
    [`${conv}/messages/${t.userMessageId}.json`]: json({ ...base, message_id: t.userMessageId, role: "user", content: t.userText, parts: t.userParts, created_at: d.toISOString() }),
    [`${conv}/messages/${t.assistantMessageId}.json`]: json({ ...base, message_id: t.assistantMessageId, role: "assistant", content: t.answer, reasoning, steps, created_at: finished }),
    [`ai-runs/${y}/${m}/${day}/${runId}/request.json`]: json({ ...base, run_id: runId, model_version: t.model, system_prompt: t.systemPrompt, user_message_id: t.userMessageId, input: t.userText, memory_items: t.memoryCount }),
    [`ai-runs/${y}/${m}/${day}/${runId}/result.json`]: json({ ...base, run_id: runId, model_version: t.model, status: t.status, output: t.answer, reasoning, tokens: t.tokens, duration_ms: t.durationMs, artcb_stored: t.artcbStored, capture_unavailable: reasoning.length ? [] : ["provider_reasoning_private"] }),
    [`tasks/${runId}/manifest.json`]: json({ ...base, task_id: runId, command: "send_message", status: t.status, steps }),
    [`events/${y}/${m}/${day}/${runId}-before.json`]: json(event("before", "message.sent", d.toISOString())),
    [`events/${y}/${m}/${day}/${runId}-after.json`]: json(event(t.status === "completed" ? "after" : "failed", t.status === "completed" ? "answer.completed" : "answer.failed", finished, { duration_ms: t.durationMs, model_version: t.model })),
  };
}
