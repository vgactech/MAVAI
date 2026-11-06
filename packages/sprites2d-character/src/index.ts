/**
 * sprites2d-character — Gestionnaire DNA et presets OWLY
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-character
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * Responsabilités :
 *   - Créer, lire, modifier, sauvegarder un CharacterDNA
 *   - Fournir les 8 presets OWLY (Samurai, Cyberpunk, Mage, Archer, Knight, Pirate, Ninja, Tank)
 *   - Gérer la bibliothèque de personnages d'une session
 *   - Valider les mutations avant application (contraintes anatomiques)
 *
 * RÈGLE : ce package n'importe JAMAIS depuis owly-web.
 *         La dépendance va dans un seul sens : owly-web → sprites2d-character.
 */

import {
  createCharacterDNA,
  mutateDNA,
  serializeDNA,
  deserializeDNA,
} from "@sprites2d/core";
import type {
  CharacterDNA,
  DNAMutation,
  CharacterClass,
  SpeciesId,
  GraphicStyle,
  CharacterPalette,
} from "@sprites2d/schema";

// ─── Types publics ─────────────────────────────────────────────────────────────

export interface CharacterRecord {
  readonly dna: CharacterDNA;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string;
  readonly name: string;
  readonly tags: string[];
}

export interface PresetDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly primarySpecies: SpeciesId;
  readonly secondarySpecies: SpeciesId | null;
  readonly characterClass: CharacterClass;
  readonly style: GraphicStyle;
  readonly palette: Partial<CharacterPalette>;
}

// ─── Bibliothèque de personnages (in-memory, remplaceable par un store) ────────

class CharacterLibrary {
  private _records: Map<string, CharacterRecord> = new Map();

  add(record: CharacterRecord): void {
    this._records.set(record.dna.id, record);
  }

  get(id: string): CharacterRecord | null {
    return this._records.get(id) ?? null;
  }

  list(): CharacterRecord[] {
    return Array.from(this._records.values());
  }

  update(id: string, mutations: DNAMutation[]): CharacterRecord | null {
    const existing = this._records.get(id);
    if (!existing) return null;
    const newDNA = mutateDNA(existing.dna, mutations);
    if (!newDNA) return null;
    const updated: CharacterRecord = {
      ...existing,
      dna: newDNA,
      updatedAt: new Date().toISOString(),
    };
    this._records.set(id, updated);
    return updated;
  }

  remove(id: string): boolean {
    return this._records.delete(id);
  }

  serialize(): string {
    const records = this.list().map((r) => ({
      ...r,
      dna: serializeDNA(r.dna),
    }));
    return JSON.stringify(records, null, 2);
  }

  static deserialize(raw: string): CharacterLibrary {
    const lib = new CharacterLibrary();
    const records: Array<Omit<CharacterRecord, "dna"> & { dna: string }> = JSON.parse(raw);
    for (const r of records) {
      const dna = deserializeDNA(r.dna);
      if (dna) {
        lib.add({ ...r, dna });
      }
    }
    return lib;
  }
}

export const characterLibrary = new CharacterLibrary();

// ─── Presets OWLY (8 personnages de base) ─────────────────────────────────────

export const OWLY_PRESETS: PresetDefinition[] = [
  {
    id: "owly-samurai",
    displayName: "OWLY Samurai",
    description: "Un hibou samouraï honorable, maître du katana et des arts martiaux anciens.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "SAMURAI",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#2C1810",
      secondaryColor: "#8B4513",
      accentColor: "#FFD700",
      skinColor: "#C8A882",
      hairColor: "#1C1C1C",
      eyeColor: "#FF4500",
    },
  },
  {
    id: "owly-cyberpunk",
    displayName: "OWLY Cyberpunk",
    description: "Un hibou cybernétique des mégalopoles néon, mi-chair mi-machine.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "CYBERPUNK",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#0D0D1A",
      secondaryColor: "#7700FF",
      accentColor: "#00FFCC",
      skinColor: "#B8A090",
      hairColor: "#00FFCC",
      eyeColor: "#FF00FF",
    },
  },
  {
    id: "owly-mage",
    displayName: "OWLY Mage",
    description: "Un hibou versé dans les arts magiques, gardien des arcanes oubliés.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "MAGE",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#1A0A3C",
      secondaryColor: "#6A0DAD",
      accentColor: "#E8D5FF",
      skinColor: "#D4C5B0",
      hairColor: "#4B0082",
      eyeColor: "#9932CC",
    },
  },
  {
    id: "owly-archer",
    displayName: "OWLY Archer",
    description: "Un hibou archer vif et précis, voyageur des forêts et des plaines.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "ARCHER",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#2D5A27",
      secondaryColor: "#8B6914",
      accentColor: "#90EE90",
      skinColor: "#D2A679",
      hairColor: "#5C3317",
      eyeColor: "#228B22",
    },
  },
  {
    id: "owly-knight",
    displayName: "OWLY Knight",
    description: "Un hibou chevalier couvert d'acier, défenseur des royaumes et des innocents.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "KNIGHT",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#708090",
      secondaryColor: "#B8860B",
      accentColor: "#FFFFFF",
      skinColor: "#D4B896",
      hairColor: "#8B7355",
      eyeColor: "#4682B4",
    },
  },
  {
    id: "owly-pirate",
    displayName: "OWLY Pirate",
    description: "Un hibou pirate des sept mers, chasseur de trésors et maître des tempêtes.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "PIRATE",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#1C1008",
      secondaryColor: "#8B0000",
      accentColor: "#FFD700",
      skinColor: "#C4956A",
      hairColor: "#2F1B0E",
      eyeColor: "#FF8C00",
    },
  },
  {
    id: "owly-ninja",
    displayName: "OWLY Ninja",
    description: "Un hibou ninja invisible, maître de l'ombre et de la discrétion.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "NINJA",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#0A0A0A",
      secondaryColor: "#1A1A2E",
      accentColor: "#E94560",
      skinColor: "#B8956A",
      hairColor: "#0A0A0A",
      eyeColor: "#E94560",
    },
  },
  {
    id: "owly-tank",
    displayName: "OWLY Tank",
    description: "Un hibou colosse blindé de partout, rempart vivant pour ses alliés.",
    primarySpecies: "OWL",
    secondarySpecies: null,
    characterClass: "TANK",
    style: "PIXEL_ART",
    palette: {
      primaryColor: "#3D3D3D",
      secondaryColor: "#8B4513",
      accentColor: "#DC143C",
      skinColor: "#C4A882",
      hairColor: "#5C4033",
      eyeColor: "#DC143C",
    },
  },
];

// ─── Fonctions de création de personnages ─────────────────────────────────────

/**
 * Creates a CharacterRecord from an OWLY preset.
 * The returned record is NOT automatically added to the library.
 * Call `characterLibrary.add(record)` to persist it.
 */
export function createFromPreset(
  presetId: string,
  overrides?: Partial<{
    name: string;
    tags: string[];
    mutations: DNAMutation[];
  }>
): CharacterRecord | null {
  const preset = OWLY_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    console.debug(`[sprites2d-character] Preset not found: ${presetId}`);
    return null;
  }

  let dna = createCharacterDNA({
    primarySpecies: preset.primarySpecies,
    secondarySpecies: preset.secondarySpecies ?? undefined,
    characterClass: preset.characterClass,
    style: preset.style,
    palette: preset.palette,
  });

  if (overrides?.mutations && overrides.mutations.length > 0) {
    const mutated = mutateDNA(dna, overrides.mutations);
    if (mutated) dna = mutated;
  }

  const now = new Date().toISOString();
  return {
    dna,
    createdAt: now,
    updatedAt: now,
    name: overrides?.name ?? preset.displayName,
    tags: overrides?.tags ?? [preset.characterClass, preset.primarySpecies],
  };
}

/**
 * Creates a fully custom CharacterRecord from scratch.
 */
export function createCustomCharacter(
  name: string,
  params: {
    primarySpecies: SpeciesId;
    secondarySpecies?: SpeciesId;
    characterClass: CharacterClass;
    style?: GraphicStyle;
    palette?: Partial<CharacterPalette>;
    tags?: string[];
  }
): CharacterRecord {
  const dna = createCharacterDNA({
    primarySpecies: params.primarySpecies,
    secondarySpecies: params.secondarySpecies,
    characterClass: params.characterClass,
    style: params.style ?? "PIXEL_ART",
    palette: params.palette,
  });
  const now = new Date().toISOString();
  return {
    dna,
    createdAt: now,
    updatedAt: now,
    name,
    tags: params.tags ?? [params.characterClass, params.primarySpecies],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the preset definition matching an OWly character class. */
export function getPresetByClass(characterClass: CharacterClass): PresetDefinition | null {
  return OWLY_PRESETS.find((p) => p.characterClass === characterClass) ?? null;
}

/** Lists all preset IDs. */
export function listPresetIds(): string[] {
  return OWLY_PRESETS.map((p) => p.id);
}

// Re-export core functions needed by consumers
export { createCharacterDNA, mutateDNA, serializeDNA, deserializeDNA } from "@sprites2d/core";
export type { CharacterDNA, DNAMutation, CharacterClass, SpeciesId } from "@sprites2d/schema";
