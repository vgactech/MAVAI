/**
 * Server Function: /api/sessions
 * Validates and creates MAVAI user sessions via Lovable cloud auth.
 * Secrets (Lovable token) are read server-side only — never exposed to client.
 * DEBUG MODE ACTIVE
 *
 * NOTE: exported as a plain async handler compatible with TanStack Start's
 * `createServerFn` pattern. Import and register in app/routes/api.sessions.ts
 * when TanStack Start server functions are enabled.
 */

import { z } from "zod";

// ─── Schemas ────────────────────────────────────────────────────────────────

export const CreateSessionSchema = z.object({
  lovableToken: z.string().min(10, "Token Lovable requis"),
  userId: z.string().min(1, "User ID requis"),
  email: z.string().email().optional(),
  name: z.string().optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;

export interface SessionResponse {
  sessionId: string;
  userId: string;
  workspaceId: string;
  createdAt: string;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * createSessionHandler — validates a Lovable token server-side and returns a
 * MAVAI session object. No token is ever sent back to the client.
 *
 * DEBUG: logs session creation without exposing the token.
 */
export async function createSessionHandler(raw: unknown): Promise<SessionResponse> {
  const data = CreateSessionSchema.parse(raw);
  const { lovableToken, userId } = data;

  // Server-side: verify the Lovable token format (minimal).
  // Replace with real Lovable SDK call in production.
  if (!lovableToken.startsWith("lv_") && !lovableToken.startsWith("sess_")) {
    console.error("[DEBUG][sessions] Invalid token format for user:", userId);
    throw new Error("Token Lovable invalide");
  }

  const workspaceId = `ws_${userId.slice(0, 12)}`;
  const sessionId = `mavai_sess_${Date.now().toString(36)}`;
  const createdAt = new Date().toISOString();

  console.debug("[DEBUG][sessions] Session created for user:", userId, "workspace:", workspaceId);

  return { sessionId, userId, workspaceId, createdAt };
}

/**
 * getSessionMetaHandler — stub for session metadata lookup.
 * Returns null until a real session store is implemented.
 */
export async function getSessionMetaHandler(): Promise<null> {
  console.debug("[DEBUG][sessions] getSessionMetaHandler called");
  return null;
}
