/**
 * SendKnob — hold + slide-left gesture button to send a message.
 * Swipe ≥ 80 px left triggers send. Click also triggers send.
 * Based on prototype V6 from KLERIO_BRONZE_BULLE_LIBRE.html
 * DEBUG MODE ACTIVE
 */

import { useRef, useState, useCallback } from "react";

interface SendKnobProps {
  onSend: () => void;
  disabled?: boolean;
}

const SLIDE_THRESHOLD = 80; // px

export function SendKnob({ onSend, disabled = false }: SendKnobProps) {
  const [dragging, setDragging] = useState(false);
  const [delta, setDelta] = useState(0);
  const startX = useRef(0);
  const triggered = useRef(false);

  const progress = Math.min(1, Math.max(0, -delta / SLIDE_THRESHOLD));

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      startX.current = e.clientX;
      triggered.current = false;
      setDelta(0);
    },
    [disabled],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      const d = e.clientX - startX.current;
      setDelta(Math.min(0, d)); // only track leftward movement

      if (d <= -SLIDE_THRESHOLD && !triggered.current) {
        triggered.current = true;
        onSend();
      }
    },
    [dragging, onSend],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    setDelta(0);
  }, []);

  const handleClick = useCallback(() => {
    if (!dragging && !disabled) {
      onSend();
    }
  }, [dragging, disabled, onSend]);

  const translateX = Math.max(-SLIDE_THRESHOLD, delta);
  const opacity = 1 - progress * 0.4;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      {/* Slide cue arrow */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          right: "calc(100% + 8px)",
          fontSize: 18,
          color: "#cd7f32",
          opacity: dragging ? 0.3 + progress * 0.7 : 0.5,
          pointerEvents: "none",
          transition: dragging ? "none" : "opacity 0.2s",
          userSelect: "none",
        }}
      >
        ←
      </span>

      <button
        type="button"
        aria-label="Envoyer : maintenez puis glissez vers la gauche, ou cliquez"
        disabled={disabled}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #e3aa66, #cd7f32)",
          boxShadow: "inset 0 1px 1px #ffe3b899, 0 3px 15px #1f100a55",
          border: "none",
          color: "#27150c",
          fontSize: 20,
          fontWeight: 700,
          cursor: disabled ? "not-allowed" : dragging ? "grabbing" : "grab",
          touchAction: "none",
          userSelect: "none",
          transform: `translateX(${translateX}px)`,
          opacity: disabled ? 0.4 : opacity,
          transition: dragging ? "none" : "transform 0.18s ease, opacity 0.18s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        ←
      </button>

      {/* Hint text */}
      {!dragging && (
        <span
          style={{
            position: "absolute",
            bottom: -20,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 11,
            color: "#e0c6aa",
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          Maintenez et glissez ←
        </span>
      )}
    </div>
  );
}
