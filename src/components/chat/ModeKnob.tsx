/**
 * ModeKnob — draggable 3-position mode selector.
 * Positions: vocal (left) | text (centre) | documents (right)
 * Based on prototype V6 from KLERIO_BRONZE_BULLE_LIBRE.html
 * DEBUG MODE ACTIVE
 */

import { useRef, useState, useCallback } from "react";
import type { ChatMode } from "@/types/klerio";

const MODE_LABELS: Record<ChatMode, string> = {
  voice: "Vocal",
  chat: "Texte",
  memory: "Documents",
};

// Map knob index (0=voice, 1=chat, 2=memory) to ChatMode
const INDEX_TO_MODE: ChatMode[] = ["voice", "chat", "memory"];
const MODE_TO_INDEX: Record<ChatMode, number> = { voice: 0, chat: 1, memory: 2 };

interface ModeKnobProps {
  mode: ChatMode;
  onChange: (mode: ChatMode) => void;
}

export function ModeKnob({ mode, onChange }: ModeKnobProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartIndex = useRef(MODE_TO_INDEX[mode]);

  const currentIndex = MODE_TO_INDEX[mode];

  // ── Knob position (% within track) ───────────────────────────────────────
  const knobLeft = currentIndex === 0 ? "8%" : currentIndex === 1 ? "50%" : "92%";

  // ── Pointer drag ─────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      dragStartX.current = e.clientX;
      dragStartIndex.current = currentIndex;
    },
    [currentIndex],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      const track = trackRef.current;
      if (!track) return;
      const trackWidth = track.clientWidth;
      const delta = e.clientX - dragStartX.current;
      const threshold = trackWidth * 0.22;

      let newIndex = dragStartIndex.current;
      if (delta < -threshold) newIndex = Math.max(0, dragStartIndex.current - 1);
      if (delta > threshold) newIndex = Math.min(2, dragStartIndex.current + 1);

      const newMode = INDEX_TO_MODE[newIndex] ?? "chat";
      if (newMode !== mode) onChange(newMode);
    },
    [dragging, mode, onChange],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // ── Keyboard ─────────────────────────────────────────────────────────────
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "ArrowLeft") {
        const next = Math.max(0, currentIndex - 1);
        onChange(INDEX_TO_MODE[next] ?? "voice");
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        const next = Math.min(2, currentIndex + 1);
        onChange(INDEX_TO_MODE[next] ?? "memory");
        e.preventDefault();
      }
    },
    [currentIndex, onChange],
  );

  return (
    <div
      role="group"
      aria-label="Choisir le mode"
      style={{ position: "relative", display: "flex", alignItems: "center", height: 44 }}
    >
      {/* Track */}
      <div
        ref={trackRef}
        style={{
          position: "relative",
          width: "100%",
          height: 44,
          borderRadius: 22,
          background: "#35201599",
          border: "1px solid #bd956f80",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          userSelect: "none",
        }}
      >
        {/* Left label */}
        <button
          type="button"
          data-mode-index="0"
          aria-pressed={currentIndex === 0}
          onClick={() => onChange("voice")}
          style={{
            background: "transparent",
            border: "none",
            color: currentIndex === 0 ? "#cd7f32" : "#e0c6aa",
            fontSize: 13,
            cursor: "pointer",
            padding: "0 4px",
            fontWeight: currentIndex === 0 ? 700 : 400,
          }}
        >
          Vocal
        </button>

        {/* Right label */}
        <button
          type="button"
          data-mode-index="2"
          aria-pressed={currentIndex === 2}
          onClick={() => onChange("memory")}
          style={{
            background: "transparent",
            border: "none",
            color: currentIndex === 2 ? "#cd7f32" : "#e0c6aa",
            fontSize: 13,
            cursor: "pointer",
            padding: "0 4px",
            fontWeight: currentIndex === 2 ? 700 : 400,
          }}
        >
          Documents
        </button>

        {/* Draggable knob */}
        <button
          type="button"
          aria-label={`Mode ${MODE_LABELS[mode]}. Maintenez et glissez : vocal à gauche, documents à droite. Flèches au clavier.`}
          aria-valuetext={MODE_LABELS[mode]}
          aria-valuenow={currentIndex}
          aria-valuemin={0}
          aria-valuemax={2}
          role="slider"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
          style={{
            position: "absolute",
            left: knobLeft,
            transform: "translateX(-50%)",
            height: 36,
            padding: "0 16px",
            borderRadius: 18,
            background: "linear-gradient(145deg, #e3aa66, #cd7f32)",
            boxShadow: "inset 0 1px 1px #ffe3b899, 0 3px 15px #1f100a55",
            border: "none",
            color: "#27150c",
            fontWeight: 700,
            fontSize: 14,
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "none",
            userSelect: "none",
            transition: dragging ? "none" : "left 0.18s ease",
            zIndex: 2,
            whiteSpace: "nowrap",
          }}
        >
          {MODE_LABELS[mode]} ↔
        </button>
      </div>

      <p
        style={{
          position: "absolute",
          bottom: -20,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 11,
          color: "#e0c6aa",
          pointerEvents: "none",
        }}
      >
        C'est le bouton qui bouge · relâchez au centre pour revenir au texte
      </p>
    </div>
  );
}
