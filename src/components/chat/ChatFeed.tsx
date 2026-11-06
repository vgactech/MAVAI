/**
 * ChatFeed — scrollable list of messages in the chat view.
 * Renders user + assistant bubbles with timestamps and mode labels.
 * DEBUG MODE ACTIVE
 */

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/klerio";

interface ChatFeedProps {
  messages: ChatMessage[];
  /** Whether the assistant is currently generating a response */
  loading?: boolean;
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

const MODE_EMOJI: Record<string, string> = {
  chat: "💬",
  memory: "📁",
  voice: "🎙️",
};

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <li
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 4,
        maxWidth: "100%",
      }}
    >
      {/* Bubble */}
      <div
        style={{
          maxWidth: "72%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isUser
            ? "linear-gradient(135deg, oklch(0.65 0.12 58), oklch(0.55 0.10 52))"
            : "oklch(0.30 0.06 49)",
          color: isUser ? "#27150c" : "#fff3df",
          fontSize: 15,
          lineHeight: 1.55,
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          boxShadow: isUser
            ? "0 2px 8px oklch(0.65 0.12 58 / 0.3)"
            : "0 2px 8px oklch(0.10 0.05 40 / 0.4)",
        }}
      >
        {msg.content}

        {/* Voice audio player */}
        {msg.audioUrl && (
          <audio
            controls
            src={msg.audioUrl}
            style={{ display: "block", marginTop: 8, width: "100%", maxWidth: 280 }}
            aria-label="Message vocal"
          />
        )}
      </div>

      {/* Meta row: time + mode */}
      <div
        style={{
          display: "flex",
          gap: 6,
          alignItems: "center",
          fontSize: 11,
          color: "#e0c6aa",
          opacity: 0.7,
          paddingLeft: isUser ? 0 : 4,
          paddingRight: isUser ? 4 : 0,
        }}
      >
        <span aria-label={`Mode: ${msg.mode}`}>{MODE_EMOJI[msg.mode] ?? "💬"}</span>
        <time dateTime={msg.createdAt}>{formatTime(msg.createdAt)}</time>
      </div>
    </li>
  );
}

/** Animated "thinking" dots while assistant generates */
function TypingIndicator() {
  return (
    <li aria-live="polite" aria-label="MAVAI réfléchit…">
      <div
        style={{
          display: "inline-flex",
          gap: 5,
          padding: "12px 16px",
          background: "oklch(0.30 0.06 49)",
          borderRadius: "18px 18px 18px 4px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#cd7f32",
              display: "inline-block",
              animation: `owly-bounce 1.2s ${i * 0.2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes owly-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </li>
  );
}

export function ChatFeed({ messages, loading = false }: ChatFeedProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  if (messages.length === 0 && !loading) {
    return (
      <div
        aria-label="Aucun message"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "#e0c6aa",
          opacity: 0.5,
          fontSize: 15,
          padding: 32,
          textAlign: "center",
        }}
      >
        <span style={{ fontSize: 40 }}>🐧</span>
        <p style={{ margin: 0 }}>
          Commencez une conversation avec MAVAI.
          <br />
          Utilisez le curseur pour changer de mode.
        </p>
      </div>
    );
  }

  return (
    <ul
      aria-label="Messages de la conversation"
      aria-live="polite"
      style={{
        flex: 1,
        listStyle: "none",
        margin: 0,
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        overflowY: "auto",
        scrollbarWidth: "thin",
        scrollbarColor: "oklch(0.45 0.075 49) transparent",
      }}
    >
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} />
      ))}
      {loading && <TypingIndicator />}
      <div ref={bottomRef} aria-hidden="true" />
    </ul>
  );
}
