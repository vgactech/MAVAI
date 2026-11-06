/**
 * sprites2d-core — Tests unitaires P0
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-core
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * Couvre :
 *   T01 createCharacterDNA — structure de base
 *   T02 createCharacterDNA — unicité des IDs (dnaId)
 *   T03 createCharacterDNA — espèces hybrides
 *   T04 createCharacterDNA — morphologie OWL → AVIAN + hasWings
 *   T05 mergeHybridMorphology — fusion deux SpeciesId
 *   T06 mergeHybridMorphology — espèce inconnue → fallback sans crash
 *   T07 mutateDNA — mutation palette (dot-notation)
 *   T08 mutateDNA — mutation morphologie heightRatio
 *   T09 mutateDNA — mutations multiples dans l'ordre
 *   T10 mutateDNA — mutations vides → copie identité (pas null)
 *   T11 serializeDNA / deserializeDNA — roundtrip complet
 *   T12 deserializeDNA — JSON invalide → null (pas d'exception)
 *   T13 createCharacterDNA — skeletonFamily CAT → HUMANOID
 *   T14 createCharacterDNA — skeletonFamily WOLF → HUMANOID
 *   T15 createCharacterDNA — version présente
 *   T16 invariants — certified=false, unique_human_proven=false toujours
 */

import { describe, it, expect } from "vitest";
import {
  createCharacterDNA,
  mutateDNA,
  serializeDNA,
  deserializeDNA,
  mergeHybridMorphology,
} from "./index.js";

// ─── T01–T04 createCharacterDNA ───────────────────────────────────────────────
describe("createCharacterDNA", () => {
  it("T01 — retourne un objet avec les champs obligatoires", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "MAGE" });
    expect(dna.dnaId).toBeTruthy();
    expect(dna.primarySpecies).toBe("OWL");
    expect(dna.characterClass).toBe("MAGE");
    expect(dna.morphology).toBeDefined();
    expect(dna.palette).toBeDefined();
    expect(dna.version).toBeGreaterThan(0);
    expect(dna.modificationHistory).toBeInstanceOf(Array);
  });

  it("T02 — chaque appel génère un dnaId unique", () => {
    const ids = new Set(
      Array.from({ length: 20 }, () =>
        createCharacterDNA({ primarySpecies: "OWL", characterClass: "ARCHER" }).dnaId
      )
    );
    expect(ids.size).toBe(20);
  });

  it("T03 — accepte une espèce secondaire", () => {
    const dna = createCharacterDNA({
      primarySpecies: "OWL",
      secondarySpecies: "DRAGON",
      characterClass: "MAGE",
    });
    expect(dna.secondarySpecies).toBe("DRAGON");
  });

  it("T04 — OWL a la morphologie AVIAN avec hasWings=true", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "KNIGHT" });
    expect(dna.morphology.skeletonFamily).toBe("AVIAN");
    expect(dna.morphology.hasWings).toBe(true);
  });

  it("T13 — CAT a la morphologie HUMANOID (félin debout)", () => {
    const dna = createCharacterDNA({ primarySpecies: "CAT", characterClass: "NINJA" });
    expect(dna.morphology.skeletonFamily).toBe("HUMANOID");
  });

  it("T14 — WOLF a la morphologie HUMANOID", () => {
    const dna = createCharacterDNA({ primarySpecies: "WOLF", characterClass: "WARRIOR" });
    expect(dna.morphology.skeletonFamily).toBe("HUMANOID");
  });

  it("T15 — version est un entier > 0", () => {
    const dna = createCharacterDNA({ primarySpecies: "BEAR", characterClass: "TANK" });
    expect(typeof dna.version).toBe("number");
    expect(dna.version).toBeGreaterThan(0);
  });

  it("T16 — invariants certified=false et unique_human_proven=false immuables", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "MAGE" });
    expect(dna.certified).toBe(false);
    expect(dna.unique_human_proven).toBe(false);
  });
});

// ─── T05–T06 mergeHybridMorphology ────────────────────────────────────────────
describe("mergeHybridMorphology", () => {
  it("T05 — fusion OWL + DRAGON conserve hasWings (les deux ont des ailes)", () => {
    const morph = mergeHybridMorphology("OWL", "DRAGON");
    expect(morph).toBeDefined();
    expect(morph.hasWings).toBe(true);
    expect(typeof morph.heightRatio).toBe("number");
  });

  it("T06 — espèce totalement inconnue → retourne morphologie de fallback sans crash", () => {
    const morph = mergeHybridMorphology("OWL", "TOTALLY_UNKNOWN_XYZ");
    expect(morph).toBeDefined();
    expect(typeof morph.heightRatio).toBe("number");
    // OWL étant la primaire, ses ailes doivent être conservées
    expect(morph.hasWings).toBe(true);
  });
});

// ─── T07–T10 mutateDNA ────────────────────────────────────────────────────────
describe("mutateDNA", () => {
  it("T07 — mutation palette.primaryColor via dot-notation", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "MAGE" });
    const mutated = mutateDNA(dna, [
      { field: "palette.primaryColor", value: "#FF0000" },
    ]);
    expect(mutated).not.toBeNull();
    expect((mutated!.palette as Record<string, unknown>).primaryColor).toBe("#FF0000");
    // L'original n'est pas modifié (immutabilité)
    expect((dna.palette as Record<string, unknown>).primaryColor).not.toBe("#FF0000");
  });

  it("T08 — mutation morphology.heightRatio", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "MAGE" });
    const mutated = mutateDNA(dna, [
      { field: "morphology.heightRatio", value: 1.5 },
    ]);
    expect(mutated).not.toBeNull();
    expect(mutated!.morphology.heightRatio).toBe(1.5);
    // Immutabilité : l'original reste inchangé
    expect(dna.morphology.heightRatio).not.toBe(1.5);
  });

  it("T09 — mutations multiples appliquées dans l'ordre, version incrémentée", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "ARCHER" });
    const originalVersion = dna.version;
    const mutated = mutateDNA(dna, [
      { field: "morphology.heightRatio", value: 0.8 },
      { field: "morphology.corpulenceRatio", value: 1.3 },
    ]);
    expect(mutated).not.toBeNull();
    expect(mutated!.morphology.heightRatio).toBe(0.8);
    expect(mutated!.morphology.corpulenceRatio).toBe(1.3);
    expect(mutated!.version).toBeGreaterThan(originalVersion);
  });

  it("T10 — mutations vides retournent une copie du DNA (pas null, pas l'original)", () => {
    const dna = createCharacterDNA({ primarySpecies: "OWL", characterClass: "KNIGHT" });
    const mutated = mutateDNA(dna, []);
    expect(mutated).not.toBeNull();
    expect(mutated!.dnaId).toBe(dna.dnaId);
    // Doit être une copie, pas la même référence
    expect(mutated).not.toBe(dna);
  });
});

// ─── T11–T12 serializeDNA / deserializeDNA ────────────────────────────────────
describe("serializeDNA / deserializeDNA", () => {
  it("T11 — roundtrip serialize → deserialize conserve tous les champs clés", () => {
    const dna = createCharacterDNA({
      primarySpecies: "FOX",
      secondarySpecies: "EAGLE",
      characterClass: "ARCHER",
    });
    const json = serializeDNA(dna);
    expect(typeof json).toBe("string");
    const restored = deserializeDNA(json);
    expect(restored).not.toBeNull();
    expect(restored!.dnaId).toBe(dna.dnaId);
    expect(restored!.primarySpecies).toBe("FOX");
    expect(restored!.secondarySpecies).toBe("EAGLE");
    expect(restored!.characterClass).toBe("ARCHER");
    // Invariants toujours forcés à false même après désérialisation
    expect(restored!.certified).toBe(false);
    expect(restored!.unique_human_proven).toBe(false);
  });

  it("T12 — JSON invalide retourne null sans lever d'exception", () => {
    expect(() => {
      const result = deserializeDNA("NOT_VALID_JSON{{{");
      expect(result).toBeNull();
    }).not.toThrow();
  });
});
