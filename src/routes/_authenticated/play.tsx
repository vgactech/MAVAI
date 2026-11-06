/**
 * play.tsx — Sélecteur de classe MAVAI (page /play)
 * Cartes personnages hibou pixel art RPG avec effet 3D CSS.
 * Image source : public/owly-pixel-art.png — grille 4×2 (1536×1024px)
 * Chaque cellule : 384×512px
 * DEBUG MODE ACTIVE | CERTIFIED_100=false
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "Choisis ta classe — MAVAI" },
      { name: "description", content: "Choisis ton archétype de héros dans MAVAI." },
    ],
  }),
  component: PlayPage,
});

// ── Types ─────────────────────────────────────────────────────────────────────

interface ClassDef {
  id: string;
  name: string;
  kanji: string;
  subtitle: string;
  tags: string[];
  /** bg-position en % : col 0..3 → 0/33.33/66.66/100 ; row 0..1 → 0/100 */
  col: number;
  row: number;
  glowColor: string;
  borderColor: string;
  labelColor: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────

const CLASSES: ClassDef[] = [
  {
    id: "samurai",
    name: "SAMURAI",
    kanji: "侍",
    subtitle: "HONNEUR",
    tags: ["Force", "Discipline"],
    col: 0, row: 0,
    glowColor: "#ff4444",
    borderColor: "#ff6644",
    labelColor: "#ff8844",
  },
  {
    id: "cyberpunk",
    name: "CYBERPUNK",
    kanji: "サイバーパンク",
    subtitle: "TECH",
    tags: ["Cyber", "Vitesse"],
    col: 1, row: 0,
    glowColor: "#00eeff",
    borderColor: "#0088ff",
    labelColor: "#00ccff",
  },
  {
    id: "mage",
    name: "MAGE",
    kanji: "魔法使い",
    subtitle: "ÉNERGIE",
    tags: ["Magie", "Énergie"],
    col: 2, row: 0,
    glowColor: "#cc44ff",
    borderColor: "#9933ff",
    labelColor: "#dd77ff",
  },
  {
    id: "archer",
    name: "ARCHER",
    kanji: "弓使い",
    subtitle: "PRÉCISION",
    tags: ["Précision", "Agilité"],
    col: 3, row: 0,
    glowColor: "#44ff88",
    borderColor: "#228844",
    labelColor: "#66ffaa",
  },
  {
    id: "knight",
    name: "CHEVALIER",
    kanji: "騎士",
    subtitle: "DÉFENSE",
    tags: ["Lire", "Défense"],
    col: 0, row: 1,
    glowColor: "#4488ff",
    borderColor: "#2244cc",
    labelColor: "#66aaff",
  },
  {
    id: "pirate",
    name: "PIRATE",
    kanji: "海賊",
    subtitle: "ASSAUT",
    tags: ["Lire", "Assaut"],
    col: 1, row: 1,
    glowColor: "#ff8844",
    borderColor: "#cc4422",
    labelColor: "#ffaa66",
  },
  {
    id: "ninja",
    name: "NINJA",
    kanji: "忍者",
    subtitle: "FURTIF",
    tags: ["Rôle", "Furtif"],
    col: 2, row: 1,
    glowColor: "#9944ff",
    borderColor: "#6622cc",
    labelColor: "#bb77ff",
  },
  {
    id: "tank",
    name: "RÉSERVOIR",
    kanji: "戦車",
    subtitle: "RÉSISTANCE",
    tags: ["Rôle", "Résistance"],
    col: 3, row: 1,
    glowColor: "#44ff44",
    borderColor: "#228822",
    labelColor: "#88ff88",
  },
];

// ── Sprite helper ─────────────────────────────────────────────────────────────

/**
 * Retourne background-position en % pour une grille 4×2.
 * col 0..3 → 0 / 33.33 / 66.66 / 100
 * row 0..1 → 0 / 100
 */
function spritePos(col: number, row: number): string {
  const x = col === 0 ? 0 : col === 1 ? 33.33 : col === 2 ? 66.66 : 100;
  const y = row === 0 ? 0 : 100;
  return `${x}% ${y}%`;
}

// ── ClassCard ─────────────────────────────────────────────────────────────────

function ClassCard({
  cls,
  selected,
  onClick,
}: {
  cls: ClassDef;
  selected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = ((e.clientX - cx) / (rect.width / 2)) * 14; // max ±14°
    const dy = ((e.clientY - cy) / (rect.height / 2)) * -14;
    setTilt({ x: dy, y: dx });
  }

  function handleMouseLeave() {
    setHovered(false);
    setTilt({ x: 0, y: 0 });
  }

  const bgPos = spritePos(cls.col, cls.row);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      aria-label={`Choisir la classe ${cls.name}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      style={{
        perspective: "600px",
        cursor: "pointer",
        outline: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          paddingBottom: "133%", // ratio 3:4 (384:512)
          borderRadius: 16,
          border: `2px solid ${selected ? cls.glowColor : hovered ? cls.borderColor : "#2a2a3a"}`,
          background: "#0a0a14",
          boxShadow: selected
            ? `0 0 0 3px ${cls.glowColor}55, 0 0 40px ${cls.glowColor}66, inset 0 0 20px ${cls.glowColor}22`
            : hovered
            ? `0 0 20px ${cls.glowColor}44, 0 8px 32px #00000088`
            : "0 4px 16px #00000066",
          transform: hovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.04)`
            : selected
            ? "scale(1.03)"
            : "scale(1)",
          transition: hovered
            ? "transform 0.08s linear, box-shadow 0.15s ease, border-color 0.15s ease"
            : "transform 0.35s ease, box-shadow 0.3s ease, border-color 0.3s ease",
          willChange: "transform",
          overflow: "hidden",
        }}
      >
        {/* Sprite personnage */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "url('/owly-pixel-art.png')",
            backgroundSize: "400% 200%",
            backgroundPosition: bgPos,
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}
        />

        {/* Reflet holographique au hover */}
        {hovered && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(135deg, ${cls.glowColor}22 0%, transparent 50%, ${cls.glowColor}11 100%)`,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Sélectionné : brillance */}
        {selected && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `radial-gradient(ellipse at 50% 20%, ${cls.glowColor}33 0%, transparent 70%)`,
              animation: "owly-pulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Label bas de carte */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "8px 10px 10px",
            background: "linear-gradient(to top, #000000ee 0%, #00000088 70%, transparent 100%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "3px 10px",
              border: `1px solid ${cls.labelColor}`,
              borderRadius: 6,
              background: "#00000099",
              backdropFilter: "blur(2px)",
            }}
          >
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 2,
                color: cls.labelColor,
                lineHeight: 1.2,
              }}
            >
              {cls.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "#aaaacc",
                letterSpacing: 1,
              }}
            >
              {cls.kanji}
            </div>
          </div>
        </div>
      </div>

      {/* Sous-titre et tags sous la carte */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1,
            color: selected ? cls.labelColor : "#7777aa",
            fontFamily: "'Courier New', monospace",
          }}
        >
          {cls.tags.join(" · ")}
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

function PlayPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [heroName, setHeroName] = useState("");

  const selectedClass = CLASSES.find((c) => c.id === selectedId) ?? null;

  function handleStart() {
    if (!selectedId) return;
    // Navigation vers le chat avec la classe choisie
    navigate({ to: "/chat" as "/" });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0a0a14 60%)",
        color: "#e0e0ff",
        fontFamily: "system-ui, sans-serif",
        padding: "40px 20px 60px",
      }}
    >
      {/* Titre */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 16px",
            border: "1px solid #4444aa",
            borderRadius: 4,
            fontSize: 11,
            letterSpacing: 3,
            color: "#8888cc",
            marginBottom: 12,
            fontFamily: "'Courier New', monospace",
          }}
        >
          ✦ CHOISIS TA CLASSE ✦
        </div>
        <p style={{ color: "#6666aa", fontSize: 14, margin: 0 }}>
          Ton archétype définit ton style de jeu et tes affinités cognitives.
        </p>
      </div>

      {/* Champ nom du héros */}
      <div style={{ maxWidth: 480, margin: "0 auto 32px" }}>
        <label
          style={{
            display: "block",
            fontSize: 11,
            letterSpacing: 2,
            color: "#8888cc",
            marginBottom: 8,
            fontFamily: "'Courier New', monospace",
          }}
        >
          NOM DU HÉROS
        </label>
        <input
          type="text"
          placeholder="Comment s'appelle ton héros ?"
          value={heroName}
          onChange={(e) => setHeroName(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#0f0f1f",
            border: `1px solid ${selectedClass ? selectedClass.borderColor : "#3333aa"}`,
            borderRadius: 8,
            color: "#e0e0ff",
            fontSize: 15,
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.3s",
          }}
        />
      </div>

      {/* Grille des classes */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto 40px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {CLASSES.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              selected={selectedId === cls.id}
              onClick={() => setSelectedId(cls.id)}
            />
          ))}
        </div>
      </div>

      {/* Bouton commencer */}
      <div style={{ textAlign: "center" }}>
        <button
          onClick={handleStart}
          disabled={!selectedId}
          style={{
            padding: "14px 48px",
            background: selectedClass
              ? `linear-gradient(135deg, ${selectedClass.glowColor}44, ${selectedClass.glowColor}22)`
              : "#1a1a2e",
            border: `1px solid ${selectedClass ? selectedClass.glowColor : "#3333aa"}`,
            borderRadius: 8,
            color: selectedClass ? selectedClass.labelColor : "#4444aa",
            fontSize: 14,
            letterSpacing: 2,
            fontFamily: "'Courier New', monospace",
            cursor: selectedId ? "pointer" : "not-allowed",
            transition: "all 0.3s ease",
            opacity: selectedId ? 1 : 0.5,
          }}
        >
          ✦ COMMENCER LA QUÊTE
        </button>
      </div>

      {/* Styles globaux */}
      <style>{`
        @keyframes owly-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        input::placeholder {
          color: #4444aa;
        }
        [role="button"]:focus-visible {
          outline: 2px solid #8888ff;
          outline-offset: 4px;
          border-radius: 16px;
        }
      `}</style>
    </main>
  );
}
