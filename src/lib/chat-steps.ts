import type { UIMessage } from 'ai';

/** One visible stage of how MAVAI prepares an answer. Persisted with the answer, never erased. */
export type ChatStepStatus = 'running' | 'done' | 'skipped' | 'error';
export type ChatStep = { label: string; detail?: string | undefined; status: ChatStepStatus };
export type MavaiDataParts = { step: ChatStep };
export type MavaiUIMessage = UIMessage<unknown, MavaiDataParts>;

/** Stable ids: rewriting a step with the same id updates it in place instead of adding a line. */
export const CHAT_STEP_IDS = ['context', "linked", 'memory', 'artcb', 'provider', 'generation'] as const;
export type ChatStepId = (typeof CHAT_STEP_IDS)[number];

type AnyPart = { type: string; [key: string]: unknown };

/** Only text and attached images are model context; reasoning and progress steps are display-only. */
export function modelContextParts<P extends AnyPart>(parts: readonly P[]): P[] {
  return parts.filter(p => p.type === 'text' || p.type === 'file');
}

export type ConversationRow = { id: string; title: string; updated_at: string; project_id: string | null; archived_at?: string | null };

/** Groups conversations by project id (null = without project), keeping most recent first. */
export function groupConversationsByProject<C extends ConversationRow>(rows: readonly C[]): Map<string | null, C[]> {
  const sorted = [...rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const groups = new Map<string | null, C[]>();
  for (const row of sorted) {
    const list = groups.get(row.project_id) ?? [];
    list.push(row);
    groups.set(row.project_id, list);
  }
  return groups;
}

export const DEFAULT_CONVERSATION_TITLE = 'Nouvelle conversation';
/** Readable conversation name from the first message: whitespace collapsed, at most 60 characters. */
export function conversationTitleFrom(text: string): string | null {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  return clean.length <= 60 ? clean : `${clean.slice(0, 59).trimEnd()}…`;
}
