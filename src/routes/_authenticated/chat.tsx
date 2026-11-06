/**
 * /chat route — protected main interface of MAVAI.
 * Displays ChatFeed + ChatComposer + Mascot.
 * Sends messages via the /api/messages server function (MAVAI backend or ARTcB relay).
 * DEBUG MODE ACTIVE
 * CERTIFIED_100=false | unique_human_proven=false
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback, useId } from "react";
import { ChatFeed } from "@/components/chat/ChatFeed";
import { ChatComposer, type ComposerSubmitPayload } from "@/components/chat/ChatComposer";
import { Mascot } from "@/components/chat/Mascot";
import { outbox } from "@/lib/outbox";
import type { ChatMessage, ChatMode } from "@/types/mavai";

// Route registered after routeTree is generated — no-op type cast until regen
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = (createFileRoute as any)("/_authenticated/chat")({
  head: () => ({
    meta: [
      { title: "Chat — MAVAI" },
      { name: "description", content: "Votre assistant personnel MAVAI." },
    ],
  }),
  component: ChatRoute,
});

function nanoid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function ChatRoute() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { user } = (Route as any).useRouteContext() as {
    user: { id: string; email?: string; name?: string };
  };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<ChatMode>("chat");
  const [loading, setLoading] = useState(false);
  const [mascotTalking, setMascotTalking] = useState(false);
  const sessionId = useId();

  const handleSubmit = useCallback(
    async (payload: ComposerSubmitPayload) => {
      if (loading) return;

      // 1. Create user message
      const userMsg: ChatMessage = {
        id: nanoid(),
        role: "user",
        content:
          payload.text ||
          (payload.files.length > 0 ? `[${payload.files.length} fichier(s) joint(s)]` : ""),
        createdAt: new Date().toISOString(),
        mode: payload.mode,
      };

      // 2. Enqueue in durable outbox (survives page refresh)
      outbox.enqueue(userMsg);

      // 3. Optimistic update
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setMascotTalking(true);

      try {
        // 4. Prepare form data for file uploads
        const formData = new FormData();
        formData.append("text", payload.text);
        formData.append("mode", payload.mode);
        formData.append("sessionId", sessionId);
        formData.append("userId", user.id);
        formData.append("userMessageId", userMsg.id);
        payload.files.forEach((f) => formData.append("files", f));

        // 5. POST to server function
        const res = await fetch("/api/messages", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Erreur serveur ${res.status}: ${await res.text()}`);
        }

        const data = (await res.json()) as { reply: string; audioUrl?: string };

        // 6. Build assistant message
        const assistantMsg: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: data.reply,
          createdAt: new Date().toISOString(),
          mode: payload.mode,
          ...(data.audioUrl !== undefined ? { audioUrl: data.audioUrl } : {}),
        };

        // 7. Mark outbox entry as sent, append assistant message
        outbox.markSent(userMsg.id);
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : "Erreur inconnue";
        console.error("[DEBUG][chat] handleSubmit error:", err);

        // Append error message in feed
        const errMsg: ChatMessage = {
          id: nanoid(),
          role: "assistant",
          content: `⚠️ ${errorText}. Votre message est conservé dans la file d'envoi.`,
          createdAt: new Date().toISOString(),
          mode: payload.mode,
        };
        setMessages((prev) => [...prev, errMsg]);
        outbox.markFailed(userMsg.id);
      } finally {
        setLoading(false);
        setMascotTalking(false);
      }
    },
    [loading, sessionId, user.id],
  );

  return (
    <div
      aria-label="Interface de chat MAVAI"
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "oklch(0.38 0.075 49)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "10px 16px",
          background: "oklch(0.32 0.075 49)",
          borderBottom: "1px solid oklch(0.45 0.075 49)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <a
          href="/dashboard"
          aria-label="Retour au tableau de bord"
          style={{ color: "#cd7f32", textDecoration: "none", fontSize: 20 }}
        >
          ←
        </a>
        <span style={{ color: "#fff3df", fontWeight: 600, fontSize: 17 }}>MAVAI Chat</span>
        {mode !== "chat" && (
          <span
            style={{
              fontSize: 12,
              color: "#e0c6aa",
              background: "oklch(0.28 0.075 49)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {mode === "voice" ? "🎙️ Vocal" : "📁 Documents"}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#e0c6aa", opacity: 0.6 }}>
          {user.email ?? user.name ?? ""}
        </span>
      </header>

      {/* Feed — grows to fill available space */}
      <ChatFeed messages={messages} loading={loading} />

      {/* Composer — pinned at bottom */}
      <ChatComposer mode={mode} onModeChange={setMode} onSubmit={handleSubmit} disabled={loading} />

      {/* Floating mascot */}
      <Mascot
        talking={mascotTalking}
        pose={loading ? "curious" : "classic"}
        statusLabel={loading ? "MAVAI réfléchit…" : "MAVAI est prêt"}
      />
    </div>
  );
}
