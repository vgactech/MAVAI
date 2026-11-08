/**
 * Nitro server handler: POST /api/messages
 * Handles chat message submission via MAVAI backend.
 *
 * This file is picked up automatically by Nitro (TanStack Start build system)
 * and creates an HTTP endpoint at /api/messages.
 *
 * In Nitro, files under server/api/ become API routes automatically.
 * The filename 'messages.post.ts' restricts this handler to POST only.
 *
 * CERTIFIED_100=false | unique_human_proven=false | Mode DEBUG actif
 */

import { defineEventHandler, readMultipartFormData, readBody, createError } from "h3";
import { sendMessageHandler } from "~/server-functions/messages";

export default defineEventHandler(async (event) => {
  // Only POST is supported
  if (event.method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method Not Allowed" });
  }

  console.debug("[DEBUG][server/api/messages] POST received");

  const contentType = event.headers.get?.("content-type") ??
    (event.node?.req?.headers?.["content-type"] ?? "");

  let raw: unknown;

  try {
    if (contentType.includes("multipart/form-data")) {
      // Multipart form data — parse file uploads
      const parts = await readMultipartFormData(event);
      const fields: Record<string, string> = {};
      const files: Array<{
        name: string;
        type: string;
        dataBase64: string;
        sizeBytes: number;
      }> = [];

      if (parts) {
        for (const part of parts) {
          if (!part.name) continue;
          if (part.filename !== undefined) {
            // It's a file
            if (part.data && part.data.length > 0) {
              files.push({
                name: part.filename || part.name,
                type: part.type || "application/octet-stream",
                dataBase64: part.data.toString("base64"),
                sizeBytes: part.data.length,
              });
            }
          } else {
            // It's a text field
            fields[part.name] = part.data.toString("utf-8");
          }
        }
      }

      raw = {
        text: fields["text"] ?? "",
        mode: fields["mode"] ?? "chat",
        sessionId: fields["sessionId"] ?? "unknown",
        userId: fields["userId"] ?? "anonymous",
        userMessageId: fields["userMessageId"] ?? "msg-0",
        files,
      };
    } else {
      // JSON body
      raw = await readBody(event);
    }

    const result = await sendMessageHandler(raw);

    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[DEBUG][server/api/messages] error:", err);

    const isValidationError =
      err instanceof Error &&
      (err.message.includes("Secret manquant") ||
        err.message.includes("ZodError") ||
        err.name === "ZodError");

    throw createError({
      statusCode: isValidationError ? 400 : 500,
      statusMessage: message,
      data: { error: message },
    });
  }
});
