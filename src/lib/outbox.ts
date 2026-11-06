/**
 * DurableOutbox — persists messages locally before sending to server.
 * Guarantees at-least-once delivery and monotone timestamps.
 * DEBUG MODE ACTIVE
 */

import type { ChatMessage, OutboxEntry, OutboxStatus } from "@/types/klerio";

const OUTBOX_KEY = "klerio:outbox";

function readEntries(): OutboxEntry[] {
  if (typeof localStorage === "undefined") return [];
  const raw = localStorage.getItem(OUTBOX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OutboxEntry[];
  } catch {
    return [];
  }
}

function writeEntries(entries: OutboxEntry[]): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(OUTBOX_KEY, JSON.stringify(entries));
}

/** Monotone timestamp — never goes backward even if system clock is adjusted */
let _lastTs = "";
function monotonicIso(): string {
  const now = new Date().toISOString();
  if (now > _lastTs) {
    _lastTs = now;
  } else {
    // Increment last timestamp by 1ms to guarantee monotone order
    const d = new Date(_lastTs);
    d.setMilliseconds(d.getMilliseconds() + 1);
    _lastTs = d.toISOString();
  }
  return _lastTs;
}

export class DurableOutbox {
  /**
   * Enqueue a message. Assigns a monotone timestamp, stores to localStorage.
   * Returns the stamped message.
   */
  enqueue(message: Omit<ChatMessage, "createdAt"> & { createdAt?: string }): ChatMessage {
    const stamped: ChatMessage = {
      ...message,
      createdAt: message.createdAt ?? monotonicIso(),
    } as ChatMessage;

    const entry: OutboxEntry = {
      id: stamped.id,
      payload: stamped,
      status: "pending" as OutboxStatus,
      attempts: 0,
      createdAt: monotonicIso(),
    };

    const entries = readEntries();
    // Idempotent — skip duplicate ids
    if (!entries.find((e) => e.id === entry.id)) {
      entries.push(entry);
      writeEntries(entries);
    }

    return stamped;
  }

  /** Mark an entry as sent */
  markSent(id: string): void {
    const entries = readEntries();
    const e = entries.find((x) => x.id === id);
    if (e) {
      e.status = "sent";
      e.lastAttemptAt = monotonicIso();
      writeEntries(entries);
    }
  }

  /** Mark an entry as failed */
  markFailed(id: string): void {
    const entries = readEntries();
    const e = entries.find((x) => x.id === id);
    if (e) {
      e.status = "failed";
      e.attempts += 1;
      e.lastAttemptAt = monotonicIso();
      writeEntries(entries);
    }
  }

  /** Get all pending entries (for retry) */
  pending(): OutboxEntry[] {
    return readEntries().filter((e) => e.status === "pending" || e.status === "failed");
  }

  /** Drain sent entries older than 1 hour */
  prune(): void {
    const cutoff = Date.now() - 60 * 60 * 1000;
    const entries = readEntries().filter((e) => {
      if (e.status !== "sent") return true;
      return new Date(e.createdAt).getTime() > cutoff;
    });
    writeEntries(entries);
  }
}

export const outbox = new DurableOutbox();
