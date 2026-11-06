/**
 * uuid.ts — UUID helper for sprites2d-core
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-core
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * Fournit un randomUUID() compatible Node.js, browser et Deno.
 * Aucune dépendance externe.
 */

/**
 * Generates a RFC 4122 v4 UUID string.
 * Uses the native crypto.randomUUID() when available,
 * otherwise falls back to a pure-JS implementation.
 */
export function randomUUID(): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof (globalThis as { crypto?: { randomUUID?: () => string } }).crypto?.randomUUID === "function"
  ) {
    return (globalThis as { crypto: { randomUUID: () => string } }).crypto.randomUUID();
  }
  // Pure-JS fallback (RFC 4122 v4)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
