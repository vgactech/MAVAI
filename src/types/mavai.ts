/**
 * MAVAI — core domain types
 * Fork de klerio — adapté pour MAVAI (Mémoire Artificielle Visuelle & IA)
 * Frontend: vgactech/MAVAI (ce dépôt)
 * Backend: vgactech/MAVAI (Python FastAPI + ARTcB blockchain)
 * DEBUG MODE ACTIVE
 * CERTIFIED_100=false | unique_human_proven=false
 */

// ─── Chat mode ────────────────────────────────────────────────────────────────

/** The three conversation modes accessible via ModeKnob */
export type ChatMode = "chat" | "memory" | "voice";

// ─── Messages ────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  /** ISO-8601 — monotone guaranteed by DurableOutbox */
  createdAt: string;
  mode: ChatMode;
  /** Optional TTS audio blob URL (voice mode) */
  audioUrl?: string;
}

// ─── Session ─────────────────────────────────────────────────────────────────

export interface MAVAIChatSession {
  sessionId: string;
  userId: string;
  workspaceId: string;
  messages: ChatMessage[];
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use MAVAIChatSession */
export type KlerioChatSession = MAVAIChatSession;

// ─── Memory / documents ──────────────────────────────────────────────────────

export type DocumentStatus = "pending" | "processing" | "ready" | "error";

export interface MAVAIDocument {
  docId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** SHA-256 of original file — used for dedup */
  sha256: string;
  status: DocumentStatus;
  /** "À vérifier" always for OCR output (not certified) */
  ocrText?: string;
  uploadedAt: string;
}

/** @deprecated Use MAVAIDocument */
export type KlerioDocument = MAVAIDocument;

// ─── Workspace (GitHub-as-DB identity) ───────────────────────────────────────

export interface MAVAIWorkspace {
  /** Stable ID — used as GitHub repo suffix `mavai-memory-<workspaceId>` */
  workspaceId: string;
  ownerId: string;
  githubRepo?: string;
  createdAt: string;
}

/** @deprecated Use MAVAIWorkspace */
export type KlerioWorkspace = MAVAIWorkspace;

// ─── Outbox (durable message queue) ──────────────────────────────────────────

export type OutboxStatus = "pending" | "sent" | "failed";

export interface OutboxEntry {
  id: string;
  payload: ChatMessage;
  status: OutboxStatus;
  attempts: number;
  lastAttemptAt?: string;
  createdAt: string;
}

// ─── File upload ──────────────────────────────────────────────────────────────

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB hard limit
export const MAX_FILES_PER_SEND = 10;

export type FileUploadResult =
  | { ok: true; document: MAVAIDocument }
  | { ok: false; error: "TOO_LARGE" | "TOO_MANY" | "UNSUPPORTED_TYPE" | "UNKNOWN" };
