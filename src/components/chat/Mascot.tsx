/**
 * Mascot — floating companion hibou (Owly).
 * Draggable orb with animated levitation and talking state.
 * Based on prototype V6 from KLERIO_BRONZE_BULLE_LIBRE.html
 * DEBUG MODE ACTIVE
 */

import { useRef, useState, useCallback, useEffect } from "react";

export type MascotPose = "classic" | "joy" | "curious" | "cool" | "sleep" | "comfort";

interface MascotProps {
  /** Whether the companion mouth animation is active */
  talking?: boolean;
  pose?: MascotPose;
  /** Status label shown on screen-reader only in free mode */
  statusLabel?: string;
  className?: string;
}

// Sprite-sheet positions — owly-pixel-art.png (grille 4×2)
// Ligne 0: SAMURAI | CYBERPUNK | MAGE | ARCHER
// Ligne 1: KNIGHT  | PIRATE    | NINJA| TANK
// background-position: col*33.33% row*100%
const POSE_POSITIONS: Record<MascotPose, string> = {
  classic:  "0% 0%",      // SAMURAI (neutre)
  joy:      "33.33% 0%",  // CYBERPUNK (cool/tech)
  curious:  "66.66% 0%",  // MAGE (réfléchi)
  cool:     "100% 0%",    // ARCHER (précis)
  sleep:    "33.33% 100%",// PIRATE (détendu)
  comfort:  "66.66% 100%",// NINJA (furtif)
};

/**
 * Floating draggable mascot orb.
 * Renders as a fixed-position element over the UI.
 */
export function Mascot({
  talking = false,
  pose = "classic",
  statusLabel = "Owly — compagnon hibou",
  className = "",
}: MascotProps) {
  const orbRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: window.innerWidth - 120, y: 18 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(true);
      dragOffset.current = {
        dx: e.clientX - pos.x,
        dy: e.clientY - pos.y,
      };
    },
    [pos],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(window.innerWidth - 96, e.clientX - dragOffset.current.dx));
      const y = Math.max(0, Math.min(window.innerHeight - 96, e.clientY - dragOffset.current.dy));
      setPos({ x, y });
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Keyboard move (arrow keys)
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = 16;
    setPos((prev) => {
      switch (e.key) {
        case "ArrowLeft":
          return { ...prev, x: Math.max(0, prev.x - step) };
        case "ArrowRight":
          return { ...prev, x: Math.min(window.innerWidth - 96, prev.x + step) };
        case "ArrowUp":
          return { ...prev, y: Math.max(0, prev.y - step) };
        case "ArrowDown":
          return { ...prev, y: Math.min(window.innerHeight - 96, prev.y + step) };
        default:
          return prev;
      }
    });
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
      e.preventDefault();
    }
  }, []);

  // Levitate animation only when not dragging (CSS class-based)
  const backgroundPosition = POSE_POSITIONS[pose];

  return (
    <div
      style={{ position: "fixed", top: pos.y, left: pos.x, zIndex: 40, width: 96 }}
      aria-label="Owly — compagnon hibou"
    >
      <button
        ref={orbRef}
        aria-label="Mascotte déplaçable. Glissez pour la positionner. Flèches pour déplacer au clavier."
        aria-pressed={talking}
        className={[
          "mascot-orb",
          talking ? "mascot-talking" : "",
          dragging ? "mascot-dragging" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          position: "relative",
          width: 96,
          height: 96,
          borderRadius: "50%",
          border: "1px solid #edc493aa",
          background: "radial-gradient(circle at 35% 20%, #bd8b56, #5c371e 75%)",
          boxShadow: dragging
            ? "0 16px 30px #24130999, 0 0 36px #e2a76866"
            : "inset 0 1px 4px #ffe1b75c, 0 10px 24px #25140988, 0 0 32px #cd7f324d",
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none",
          touchAction: "none",
          overflow: "visible",
          padding: 0,
          animation: dragging ? "none" : "owly-levitate 4s ease-in-out infinite",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onKeyDown={onKeyDown}
      >
        {/* Head sprite */}
        <span
          aria-hidden="true"
          style={{
            display: "block",
            position: "absolute",
            inset: 4,
            borderRadius: "50%",
            backgroundImage: "var(--mascot-sheet)",
            backgroundSize: "400% 200%",
            backgroundPosition,
            backgroundRepeat: "no-repeat",
            overflow: "hidden",
          }}
        />

        {/* Talking mouth */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "54%",
            top: "67%",
            width: "10%",
            height: "7%",
            borderRadius: "45% 45% 60% 60%",
            background: "#29100b",
            border: "1px solid #e6a143",
            transform: "translate(-50%, -50%) scaleY(0.12)",
            opacity: talking ? 1 : 0,
            transformOrigin: "center",
            pointerEvents: "none",
            animation: talking ? "owly-talk 0.38s ease-in-out infinite alternate" : "none",
          }}
        />
      </button>

      {/* Visually hidden status label for screen readers */}
      <span
        role="status"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          margin: -1,
          padding: 0,
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {statusLabel}
      </span>

      {/* Global keyframe styles injected once */}
      <style>{`
        @keyframes owly-levitate {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes owly-talk {
          0% { transform: translate(-50%, -50%) scaleY(0.2); }
          45% { transform: translate(-50%, -50%) scaleY(1); }
          100% { transform: translate(-50%, -50%) scaleY(0.45); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mascot-orb { animation: none !important; }
          .mascot-talking span[aria-hidden] { animation: none !important; opacity: 1 !important; transform: translate(-50%, -50%) scaleY(0.5) !important; }
        }
      `}</style>
    </div>
  );
}

/**
 * Small inline mascot avatar (used in chat bubbles and header).
 * Non-draggable, fixed size.
 */
export function MascotAvatar({
  pose = "classic",
  size = 54,
}: {
  pose?: MascotPose;
  size?: number;
}) {
  const backgroundPosition = POSE_POSITIONS[pose];
  return (
    <span
      role="img"
      aria-label="Owly — hibou mascotte"
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundImage: "var(--mascot-sheet)",
        backgroundSize: "400% 200%",
        backgroundPosition,
        backgroundRepeat: "no-repeat",
        flexShrink: 0,
      }}
    />
  );
}

// Add mascot sprite-sheet CSS variable to :root if not already set
// owly-pixel-art.png = image hibou pixel art RPG (8 personnages)
if (typeof document !== "undefined") {
  const root = document.documentElement;
  if (!root.style.getPropertyValue("--mascot-sheet")) {
    root.style.setProperty("--mascot-sheet", 'url("/owly-pixel-art.png")');
  }
}
