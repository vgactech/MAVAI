/**
 * LocalMemoryRepository — localStorage-backed implementation.
 * Lot 2 will replace with GitHubMemoryRepository.
 * DEBUG MODE ACTIVE
 */

import type { ChatMessage, KlerioChatSession, ChatMode } from "@/types/klerio";
import type { MemoryRepository } from "./repository";

const PREFIX = "klerio:session:";
const INDEX_KEY = "klerio:sessions:index";

function sessionKey(sessionId: string): string {
  return `${PREFIX}${sessionId}`;
}

function readIndex(): Record<string, string[]> {
  if (typeof localStorage === "undefined") return {};
  const raw = localStorage.getItem(INDEX_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeIndex(index: Record<string, string[]>): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export class LocalMemoryRepository implements MemoryRepository {
  async loadSession(sessionId: string): Promise<KlerioChatSession | null> {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(sessionKey(sessionId));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as KlerioChatSession;
    } catch {
      return null;
    }
  }

  async saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
    if (typeof localStorage === "undefined") return;

    const existing = await this.loadSession(sessionId);
    const now = new Date().toISOString();

    const session: KlerioChatSession = existing ?? {
      sessionId,
      userId: "local",
      workspaceId: "local",
      messages: [],
      mode: message.mode as ChatMode,
      createdAt: now,
      updatedAt: now,
    };

    // Deduplicate by id
    const idx = session.messages.findIndex((m) => m.id === message.id);
    if (idx >= 0) {
      session.messages[idx] = message;
    } else {
      session.messages.push(message);
    }

    // Ensure monotone ordering by createdAt
    session.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    session.updatedAt = now;

    localStorage.setItem(sessionKey(sessionId), JSON.stringify(session));

    // Update index
    const index = readIndex();
    const userId = "local";
    if (!index[userId]) index[userId] = [];
    if (!index[userId].includes(sessionId)) {
      index[userId].push(sessionId);
      writeIndex(index);
    }
  }

  async listSessionIds(userId: string): Promise<string[]> {
    const index = readIndex();
    return index[userId] ?? [];
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(sessionKey(sessionId));

    const index = readIndex();
    for (const uid of Object.keys(index)) {
      const sessions = index[uid];
      if (sessions) {
        index[uid] = sessions.filter((id) => id !== sessionId);
      }
    }
    writeIndex(index);
  }

  async clearAll(): Promise<void> {
    if (typeof localStorage === "undefined") return;
    // Collect keys from the index to avoid relying on Object.keys(localStorage)
    // (which may not work in all environments / mocks).
    const index = readIndex();
    for (const sessionIds of Object.values(index)) {
      for (const sid of sessionIds ?? []) {
        localStorage.removeItem(sessionKey(sid));
      }
    }
    localStorage.removeItem(INDEX_KEY);
  }
}

/** Singleton for app-wide use */
export const localMemory = new LocalMemoryRepository();
