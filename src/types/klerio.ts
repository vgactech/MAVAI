/**
 * MAVAI — re-export depuis mavai.ts (migration klerio → MAVAI)
 * Ce fichier est conservé pour compatibilité ascendante.
 * Préférer les imports depuis @/types/mavai.
 * DEBUG MODE ACTIVE
 * CERTIFIED_100=false | unique_human_proven=false
 */

export type {
  ChatMode,
  MessageRole,
  ChatMessage,
  MAVAIChatSession,
  KlerioChatSession,
  DocumentStatus,
  MAVAIDocument,
  KlerioDocument,
  MAVAIWorkspace,
  KlerioWorkspace,
  OutboxStatus,
  OutboxEntry,
  FileUploadResult,
} from "./mavai";

export { MAX_FILE_SIZE_BYTES, MAX_FILES_PER_SEND } from "./mavai";
