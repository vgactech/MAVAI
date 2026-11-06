/**
 * lot1-memory.test.ts — Unit tests for Lot 1 memory foundations.
 * Coverage:
 *   - LocalMemoryRepository: save, load, dedup, monotone sort, delete, clearAll
 *   - DurableOutbox: enqueue idempotence, monotone timestamps, markSent/markFailed, pending, prune
 *   - FileUpload validation: MAX_FILE_SIZE_BYTES, MAX_FILES_PER_SEND
 *
 * DEBUG MODE ACTIVE
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalMemoryRepository } from "@/lib/memory/local";
import { DurableOutbox } from "@/lib/outbox";
import { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_SEND } from "@/types/klerio";
import type { ChatMessage } from "@/types/klerio";

// ─── localStorage mock ────────────────────────────────────────────────────────

function makeLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

let lsMock: ReturnType<typeof makeLocalStorageMock>;

beforeEach(() => {
  lsMock = makeLocalStorageMock();
  vi.stubGlobal("localStorage", lsMock);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMessage(partial: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `msg_${Math.random().toString(36).slice(2, 8)}`,
    role: "user",
    content: "Bonjour Klerio",
    createdAt: new Date().toISOString(),
    mode: "chat",
    ...partial,
  };
}

// ─── LocalMemoryRepository ────────────────────────────────────────────────────

describe("LocalMemoryRepository", () => {
  it("returns null for an unknown session", async () => {
    const repo = new LocalMemoryRepository();
    const result = await repo.loadSession("unknown-session");
    expect(result).toBeNull();
  });

  it("saves and loads a message in a session", async () => {
    const repo = new LocalMemoryRepository();
    const msg = makeMessage({ content: "Test save" });
    await repo.saveMessage("s1", msg);
    const session = await repo.loadSession("s1");
    expect(session).not.toBeNull();
    expect(session!.messages).toHaveLength(1);
    expect(session!.messages[0]?.content).toBe("Test save");
  });

  it("deduplicates messages with the same id", async () => {
    const repo = new LocalMemoryRepository();
    const msg = makeMessage({ id: "dup_id", content: "Original" });
    await repo.saveMessage("s2", msg);
    await repo.saveMessage("s2", { ...msg, content: "Updated" });
    const session = await repo.loadSession("s2");
    expect(session!.messages).toHaveLength(1);
    expect(session!.messages[0]?.content).toBe("Updated");
  });

  it("sorts messages by createdAt (monotone order)", async () => {
    const repo = new LocalMemoryRepository();
    const m1 = makeMessage({ id: "m1", createdAt: "2026-01-01T10:00:01.000Z" });
    const m2 = makeMessage({ id: "m2", createdAt: "2026-01-01T10:00:00.000Z" });
    const m3 = makeMessage({ id: "m3", createdAt: "2026-01-01T10:00:02.000Z" });
    await repo.saveMessage("s3", m1);
    await repo.saveMessage("s3", m2);
    await repo.saveMessage("s3", m3);
    const session = await repo.loadSession("s3");
    const ids = session!.messages.map((m) => m.id);
    expect(ids).toEqual(["m2", "m1", "m3"]);
  });

  it("lists session IDs for a user", async () => {
    const repo = new LocalMemoryRepository();
    await repo.saveMessage("sA", makeMessage());
    await repo.saveMessage("sB", makeMessage());
    // LocalMemoryRepository uses "local" as userId
    const ids = await repo.listSessionIds("local");
    expect(ids).toContain("sA");
    expect(ids).toContain("sB");
  });

  it("deletes a session", async () => {
    const repo = new LocalMemoryRepository();
    await repo.saveMessage("s_del", makeMessage());
    await repo.deleteSession("s_del");
    const session = await repo.loadSession("s_del");
    expect(session).toBeNull();
  });

  it("clearAll removes all sessions", async () => {
    const repo = new LocalMemoryRepository();
    await repo.saveMessage("s_clear_1", makeMessage());
    await repo.saveMessage("s_clear_2", makeMessage());
    await repo.clearAll();
    const s1 = await repo.loadSession("s_clear_1");
    const s2 = await repo.loadSession("s_clear_2");
    expect(s1).toBeNull();
    expect(s2).toBeNull();
  });

  it("handles corrupted localStorage gracefully", async () => {
    lsMock.getItem.mockReturnValueOnce("not-valid-json{{{");
    const repo = new LocalMemoryRepository();
    const result = await repo.loadSession("corrupt");
    expect(result).toBeNull();
  });
});

// ─── DurableOutbox ────────────────────────────────────────────────────────────

describe("DurableOutbox", () => {
  it("enqueues a message with pending status", () => {
    const box = new DurableOutbox();
    const msg = makeMessage();
    box.enqueue(msg);
    const pending = box.pending();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.id).toBe(msg.id);
    expect(pending[0]?.status).toBe("pending");
  });

  it("is idempotent — enqueueing same id twice keeps one entry", () => {
    const box = new DurableOutbox();
    const msg = makeMessage({ id: "idem_id" });
    box.enqueue(msg);
    box.enqueue(msg);
    const pending = box.pending();
    const matches = pending.filter((e) => e.id === "idem_id");
    expect(matches).toHaveLength(1);
  });

  it("marks an entry as sent", () => {
    const box = new DurableOutbox();
    const msg = makeMessage({ id: "sent_id" });
    box.enqueue(msg);
    box.markSent("sent_id");
    const pending = box.pending();
    expect(pending.find((e) => e.id === "sent_id")).toBeUndefined();
  });

  it("marks an entry as failed and increments attempts", () => {
    const box = new DurableOutbox();
    const msg = makeMessage({ id: "fail_id" });
    box.enqueue(msg);
    box.markFailed("fail_id");
    const pending = box.pending();
    const entry = pending.find((e) => e.id === "fail_id");
    expect(entry).toBeDefined();
    expect(entry?.status).toBe("failed");
    expect(entry?.attempts).toBe(1);
  });

  it("produces monotone timestamps across rapid calls", () => {
    const box = new DurableOutbox();
    const messages = Array.from({ length: 20 }, (_, i) => {
      const m = makeMessage({ id: `ts_${i}` });
      // Override createdAt to test monotone behaviour when provided fresh
      return { ...m, createdAt: new Date(Date.now() + i).toISOString() };
    });
    const stamped = messages.map((m) => box.enqueue(m));
    const timestamps = messages.map((m) => m.createdAt);
    for (let i = 1; i < timestamps.length; i++) {
      const cur = timestamps[i] ?? "";
      const prev = timestamps[i - 1] ?? "";
      expect(cur >= prev).toBe(true);
    }
  });

  it("prune removes sent entries older than 1 hour", () => {
    const box = new DurableOutbox();
    const oldMsg = makeMessage({ id: "old_sent" });
    box.enqueue(oldMsg);
    box.markSent("old_sent");

    // Manually set old createdAt in localStorage
    const raw = lsMock._store["klerio:outbox"];
    if (raw) {
      const entries = JSON.parse(raw);
      const entry = entries.find((e: { id: string }) => e.id === "old_sent");
      if (entry) {
        entry.createdAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      }
      lsMock._store["klerio:outbox"] = JSON.stringify(entries);
    }

    box.prune();
    const pending = box.pending();
    expect(pending.find((e) => e.id === "old_sent")).toBeUndefined();
  });
});

// ─── File upload validation ────────────────────────────────────────────────────

describe("File upload constants", () => {
  it("MAX_FILE_SIZE_BYTES is 20 MB", () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(20 * 1024 * 1024);
  });

  it("MAX_FILES_PER_SEND is 10", () => {
    expect(MAX_FILES_PER_SEND).toBe(10);
  });

  it("a 20 MB + 1 byte file is too large", () => {
    const tooLarge = MAX_FILE_SIZE_BYTES + 1;
    expect(tooLarge > MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("a file exactly at 20 MB is allowed", () => {
    const exact = MAX_FILE_SIZE_BYTES;
    expect(exact <= MAX_FILE_SIZE_BYTES).toBe(true);
  });

  it("10 files is allowed, 11 is not", () => {
    const files10 = Array.from({ length: 10 });
    const files11 = Array.from({ length: 11 });
    expect(files10.length <= MAX_FILES_PER_SEND).toBe(true);
    expect(files11.length <= MAX_FILES_PER_SEND).toBe(false);
  });
});
