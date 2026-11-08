/**
 * Server Function: sendMessage
 * TanStack Start createServerFn — executes server-side only.
 *
 * This replaces the previous fetch("/api/messages") pattern.
 * createServerFn is the correct API for TanStack Start v1.x with
 * Cloudflare Workers (Nitro cloudflare-module preset).
 *
 * Called from chat.tsx: await sendMessageFn({ data: payload })
 * Returns: { reply, audioUrl?, ocrNote? }
 *
 * CERTIFIED_100=false | unique_human_proven=false | Mode DEBUG actif
 */

import { createServerFn } from "@tanstack/react-start";
import { sendMessageHandler, SendMessageSchema } from "./messages";
import type { MessageResponse } from "./messages";

/**
 * sendMessageFn — TanStack Start server function.
 * Validates input via Zod (SendMessageSchema), delegates to sendMessageHandler.
 */
export const sendMessageFn = createServerFn()
  .validator((data: unknown) => SendMessageSchema.parse(data))
  .handler(async ({ data }): Promise<MessageResponse> => {
    console.debug("[DEBUG][sendMessageFn] invoked", {
      mode: data.mode,
      sessionId: data.sessionId,
      userId: data.userId,
      fileCount: data.files.length,
    });
    return sendMessageHandler(data);
  });
