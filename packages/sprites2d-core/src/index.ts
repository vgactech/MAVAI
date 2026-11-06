/**
 * sprites2d-core — Moteur d'assemblage déterministe SPRITES 2D
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-core
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * PRINCIPE : ce moteur ne dépend d'aucune IA, d'aucun réseau, d'aucune API externe.
 * Les mêmes paramètres d'entrée produisent toujours la même sortie.
 * Si le résultat change, c'est un bug.
 */

import type {
  CharacterDNA,
  SpeciesId,
  CharacterClass,
  GraphicStyle,
  MorphologyDefinition,
  SkeletonFamily,
  ComponentReference,
  EquipmentSlots,
  DNAMutation,
  CharacterPalette,
  AnatomyZone,
  SpeciesDefinition,
  AnchorPointId,
  Vector2D,
} from "@sprites2d/schema";
import { randomUUID } from "./uuid.js";

// ─── Morphologies de référence par espèce ────────────────────────────────────

const SPECIES_MORPHOLOGY_DEFAULTS: Record<string, Partial<MorphologyDefinition>> = {
  OWL: {
    heightRatio: 1.0,
    corpulenceRatio: 0.9,
    armLengthRatio: 1.1,   // ailes légèrement plus longues
    legLengthRatio: 0.7,   // pattes courtes
    headSizeRatio: 1.2,    // grosse tête hibou
    hasWings: true,
    hasTail: false,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "AVIAN",
  },
  CAT: {
    heightRatio: 0.95,
    corpulenceRatio: 0.85,
    armLengthRatio: 0.9,
    legLengthRatio: 0.95,
    headSizeRatio: 1.1,
    hasWings: false,
    hasTail: true,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "HUMANOID",
  },
  WOLF: {
    heightRatio: 1.1,
    corpulenceRatio: 1.1,
    armLengthRatio: 1.0,
    legLengthRatio: 1.05,
    headSizeRatio: 1.1,
    hasWings: false,
    hasTail: true,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "HUMANOID",
  },
  FOX: {
    heightRatio: 0.9,
    corpulenceRatio: 0.8,
    armLengthRatio: 0.9,
    legLengthRatio: 0.95,
    headSizeRatio: 1.05,
    hasWings: false,
    hasTail: true,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "HUMANOID",
  },
  DRAGON: {
    heightRatio: 1.3,
    corpulenceRatio: 1.3,
    armLengthRatio: 1.2,
    legLengthRatio: 1.1,
    headSizeRatio: 1.2,
    hasWings: true,
    hasTail: true,
    hasHorns: true,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "HUMANOID",
  },
  RABBIT: {
    heightRatio: 0.85,
    corpulenceRatio: 0.8,
    armLengthRatio: 0.85,
    legLengthRatio: 1.0,
    headSizeRatio: 1.15,
    hasWings: false,
    hasTail: true,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "HUMANOID",
  },
  BEAR: {
    heightRatio: 1.2,
    corpulenceRatio: 1.4,
    armLengthRatio: 1.1,
    legLengthRatio: 1.0,
    headSizeRatio: 1.1,
    hasWings: false,
    hasTail: true,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "HUMANOID",
  },
  EAGLE: {
    heightRatio: 1.05,
    corpulenceRatio: 0.95,
    armLengthRatio: 1.2,  // ailes
    legLengthRatio: 0.75,
    headSizeRatio: 1.0,
    hasWings: true,
    hasTail: true,
    hasHorns: false,
    hasExtraLimbs: false,
    extraLimbCount: 0,
    skeletonFamily: "AVIAN",
  },
};

// ─── Points d'ancrage de base par famille squelettale ─────────────────────────

const BASE_ANCHOR_POINTS: Record<SkeletonFamily, Partial<Record<AnchorPointId, Vector2D>>> = {
  HUMANOID: {
    HEAD_TOP: { x: 0.5, y: 0.0 },
    NECK: { x: 0.5, y: 0.18 },
    SHOULDER_LEFT: { x: 0.25, y: 0.22 },
    SHOULDER_RIGHT: { x: 0.75, y: 0.22 },
    ELBOW_LEFT: { x: 0.2, y: 0.38 },
    ELBOW_RIGHT: { x: 0.8, y: 0.38 },
    WRIST_LEFT: { x: 0.15, y: 0.54 },
    WRIST_RIGHT: { x: 0.85, y: 0.54 },
    CHEST: { x: 0.5, y: 0.3 },
    WAIST: { x: 0.5, y: 0.5 },
    BELT: { x: 0.5, y: 0.52 },
    SPINE_TOP: { x: 0.5, y: 0.2 },
    SPINE_BOTTOM: { x: 0.5, y: 0.52 },
    HIP_LEFT: { x: 0.38, y: 0.54 },
    HIP_RIGHT: { x: 0.62, y: 0.54 },
    KNEE_LEFT: { x: 0.38, y: 0.72 },
    KNEE_RIGHT: { x: 0.62, y: 0.72 },
    ANKLE_LEFT: { x: 0.38, y: 0.9 },
    ANKLE_RIGHT: { x: 0.62, y: 0.9 },
    WEAPON_MAIN_HAND: { x: 0.85, y: 0.58 },
    WEAPON_OFF_HAND: { x: 0.15, y: 0.58 },
    EFFECT_ORIGIN: { x: 0.5, y: 0.3 },
    TAIL_ATTACH: { x: 0.5, y: 0.56 },
    WING_ATTACH_LEFT: { x: 0.3, y: 0.25 },
    WING_ATTACH_RIGHT: { x: 0.7, y: 0.25 },
    HORN_LEFT: { x: 0.38, y: 0.02 },
    HORN_RIGHT: { x: 0.62, y: 0.02 },
  },
  AVIAN: {
    HEAD_TOP: { x: 0.5, y: 0.0 },
    NECK: { x: 0.5, y: 0.2 },
    CHEST: { x: 0.5, y: 0.35 },
    WAIST: { x: 0.5, y: 0.55 },
    WING_ATTACH_LEFT: { x: 0.2, y: 0.28 },
    WING_ATTACH_RIGHT: { x: 0.8, y: 0.28 },
    WRIST_LEFT: { x: 0.08, y: 0.5 },
    WRIST_RIGHT: { x: 0.92, y: 0.5 },
    ANKLE_LEFT: { x: 0.38, y: 0.88 },
    ANKLE_RIGHT: { x: 0.62, y: 0.88 },
    WEAPON_MAIN_HAND: { x: 0.92, y: 0.52 },
    WEAPON_OFF_HAND: { x: 0.08, y: 0.52 },
    EFFECT_ORIGIN: { x: 0.5, y: 0.35 },
  },
  QUADRUPED: {
    HEAD_TOP: { x: 0.5, y: 0.0 },
    NECK: { x: 0.5, y: 0.15 },
    SPINE_TOP: { x: 0.5, y: 0.2 },
    SPINE_BOTTOM: { x: 0.5, y: 0.5 },
    TAIL_ATTACH: { x: 0.9, y: 0.4 },
    WRIST_LEFT: { x: 0.15, y: 0.7 },
    WRIST_RIGHT: { x: 0.4, y: 0.7 },
    ANKLE_LEFT: { x: 0.6, y: 0.85 },
    ANKLE_RIGHT: { x: 0.85, y: 0.85 },
    EFFECT_ORIGIN: { x: 0.5, y: 0.2 },
  },
  SERPENTINE: {
    HEAD_TOP: { x: 0.5, y: 0.0 },
    NECK: { x: 0.5, y: 0.1 },
    SPINE_TOP: { x: 0.5, y: 0.2 },
    SPINE_BOTTOM: { x: 0.5, y: 0.8 },
    EFFECT_ORIGIN: { x: 0.5, y: 0.2 },
  },
  ARACHNID: {
    HEAD_TOP: { x: 0.5, y: 0.0 },
    CHEST: { x: 0.5, y: 0.3 },
    WAIST: { x: 0.5, y: 0.5 },
    EFFECT_ORIGIN: { x: 0.5, y: 0.3 },
  },
  HYBRID: {
    HEAD_TOP: { x: 0.5, y: 0.0 },
    NECK: { x: 0.5, y: 0.18 },
    CHEST: { x: 0.5, y: 0.3 },
    WAIST: { x: 0.5, y: 0.5 },
    EFFECT_ORIGIN: { x: 0.5, y: 0.3 },
  },
};

// ─── DNA Factory ──────────────────────────────────────────────────────────────

export interface CreateCharacterOptions {
  primarySpecies: SpeciesId;
  secondarySpecies?: SpeciesId;
  hybridRatio?: number;
  characterClass: CharacterClass;
  style?: GraphicStyle;
  name?: string;
}

/**
 * Crée un CharacterDNA valide à partir des options fournies.
 * DÉTERMINISTE : les mêmes options produisent toujours la même structure
 * (seul le dnaId et createdAt varient car UUID et timestamp).
 */
export function createCharacterDNA(options: CreateCharacterOptions): CharacterDNA {
  const {
    primarySpecies,
    secondarySpecies,
    hybridRatio = 1.0,
    characterClass,
    style = "PIXEL_ART",
    name,
  } = options;

  const baseMorphology = SPECIES_MORPHOLOGY_DEFAULTS[primarySpecies] ?? {};
  const skeletonFamily: SkeletonFamily =
    (baseMorphology.skeletonFamily as SkeletonFamily) ?? "HUMANOID";

  const anchorPoints = BASE_ANCHOR_POINTS[skeletonFamily] ?? {};

  // Fusion hybride : interpolation linéaire des ratios morphologiques
  let morphology: MorphologyDefinition = {
    heightRatio: baseMorphology.heightRatio ?? 1.0,
    corpulenceRatio: baseMorphology.corpulenceRatio ?? 1.0,
    armLengthRatio: baseMorphology.armLengthRatio ?? 1.0,
    legLengthRatio: baseMorphology.legLengthRatio ?? 1.0,
    headSizeRatio: baseMorphology.headSizeRatio ?? 1.0,
    anchorPoints,
    hasWings: baseMorphology.hasWings ?? false,
    hasTail: baseMorphology.hasTail ?? false,
    hasHorns: baseMorphology.hasHorns ?? false,
    hasExtraLimbs: baseMorphology.hasExtraLimbs ?? false,
    extraLimbCount: baseMorphology.extraLimbCount ?? 0,
    skeletonFamily,
  };

  if (secondarySpecies && hybridRatio < 1.0) {
    morphology = mergeHybridMorphology(
      morphology,
      SPECIES_MORPHOLOGY_DEFAULTS[secondarySpecies] ?? {},
      hybridRatio
    );
  }

  const now = new Date().toISOString();

  const dna: CharacterDNA = {
    dnaId: randomUUID(),
    createdAt: now,
    version: 1,
    modificationHistory: [],
    primarySpecies,
    secondarySpecies,
    hybridRatio: secondarySpecies ? hybridRatio : undefined,
    morphology,
    palette: {
      colors: {},
      lockedAt: now,
    },
    style,
    name,
    characterClass,
    components: [],
    equipment: { slots: {} },
    certified: false,
    unique_human_proven: false,
  };

  return dna;
}

/**
 * Calcule la morphologie hybride par interpolation linéaire.
 * hybridRatio = 1.0 → 100% espèce primaire
 * hybridRatio = 0.5 → 50%/50%
 * hybridRatio = 0.0 → 100% espèce secondaire
 *
 * Surcharge publique : accepte deux SpeciesId pour convenance.
 */
export function mergeHybridMorphology(
  primary: SpeciesId | MorphologyDefinition,
  secondary: SpeciesId | Partial<MorphologyDefinition>,
  ratio = 0.5
): MorphologyDefinition {
  const resolveMorphology = (s: SpeciesId | MorphologyDefinition | Partial<MorphologyDefinition>): Partial<MorphologyDefinition> => {
    if (typeof s === "string") {
      return SPECIES_MORPHOLOGY_DEFAULTS[s] ?? {};
    }
    return s as Partial<MorphologyDefinition>;
  };

  const pMorph = resolveMorphology(primary) as MorphologyDefinition;
  const sMorph = resolveMorphology(secondary);

  const lerp = (a: number, b: number | undefined, r: number): number =>
    a * r + (b ?? a) * (1 - r);

  const skeletonFamily: SkeletonFamily = pMorph.skeletonFamily ?? "HUMANOID";

  return {
    heightRatio: lerp(pMorph.heightRatio ?? 1.0, sMorph.heightRatio, ratio),
    corpulenceRatio: lerp(pMorph.corpulenceRatio ?? 1.0, sMorph.corpulenceRatio, ratio),
    armLengthRatio: lerp(pMorph.armLengthRatio ?? 1.0, sMorph.armLengthRatio, ratio),
    legLengthRatio: lerp(pMorph.legLengthRatio ?? 1.0, sMorph.legLengthRatio, ratio),
    headSizeRatio: lerp(pMorph.headSizeRatio ?? 1.0, sMorph.headSizeRatio, ratio),
    anchorPoints: pMorph.anchorPoints ?? {},
    // Appendices : héritage si présent dans l'une ou l'autre espèce
    hasWings: (pMorph.hasWings ?? false) || (sMorph.hasWings ?? false),
    hasTail: (pMorph.hasTail ?? false) || (sMorph.hasTail ?? false),
    hasHorns: (pMorph.hasHorns ?? false) || (sMorph.hasHorns ?? false),
    hasExtraLimbs: (pMorph.hasExtraLimbs ?? false) || (sMorph.hasExtraLimbs ?? false),
    extraLimbCount: Math.max(pMorph.extraLimbCount ?? 0, sMorph.extraLimbCount ?? 0),
    skeletonFamily: (sMorph.skeletonFamily === "HYBRID" || pMorph.skeletonFamily !== sMorph.skeletonFamily)
      ? "HYBRID"
      : skeletonFamily,
  };
}

// ─── Mutation contrôlée du DNA ────────────────────────────────────────────────

export type MutationAuthor = "USER" | "SYSTEM" | "AI_SUGGESTION";

/** Batch mutation entry — field uses dot-notation for nested paths (e.g. "palette.primaryColor") */
export interface BatchMutation {
  field: string;
  value: unknown;
  author?: MutationAuthor;
}

/**
 * Applies one or more mutations to a DNA and returns the updated copy.
 * The original DNA is never modified (immutability).
 * Returns null only if mutations array is provided but ALL entries are structurally invalid.
 * Returns a copy of the original DNA if mutations array is empty.
 *
 * Supports dot-notation for nested fields: "palette.primaryColor", "morphology.heightRatio".
 */
export function mutateDNA(
  dna: CharacterDNA,
  mutations: BatchMutation[]
): CharacterDNA | null {
  if (mutations.length === 0) {
    // Empty mutations = identity, return copy
    return { ...dna };
  }

  let result: CharacterDNA = { ...dna };

  for (const mut of mutations) {
    const { field, value, author = "USER" } = mut;
    const now = new Date().toISOString();
    const parts = field.split(".");

    if (parts.length === 1) {
      // Top-level field
      const key = parts[0] as keyof CharacterDNA;
      const mutation: DNAMutation = {
        timestamp: now,
        field,
        previousValue: result[key],
        newValue: value,
        author,
      };
      result = {
        ...result,
        [key]: value,
        version: result.version + 1,
        modificationHistory: [...result.modificationHistory, mutation],
      };
    } else if (parts.length === 2) {
      // One-level nested field (e.g. "palette.primaryColor")
      const [parent, child] = parts;
      const parentKey = parent as keyof CharacterDNA;
      const parentObj = result[parentKey];
      if (parentObj && typeof parentObj === "object" && !Array.isArray(parentObj)) {
        const mutation: DNAMutation = {
          timestamp: now,
          field,
          previousValue: (parentObj as Record<string, unknown>)[child],
          newValue: value,
          author,
        };
        result = {
          ...result,
          [parentKey]: { ...(parentObj as object), [child]: value },
          version: result.version + 1,
          modificationHistory: [...result.modificationHistory, mutation],
        };
      }
    }
    // Deeper nesting not supported in this version — silently skipped
  }

  return result;
}

// ─── Serialisation ────────────────────────────────────────────────────────────

/**
 * Sérialise un CharacterDNA en JSON stable.
 * Stable = même DNA → même JSON (clés triées).
 */
export function serializeDNA(dna: CharacterDNA): string {
  return JSON.stringify(dna, Object.keys(dna).sort() as never);
}

/**
 * Désérialise un JSON en CharacterDNA avec validation basique.
 * Retourne null si le JSON est invalide ou si les champs obligatoires sont absents.
 * Ne lève jamais d'exception (fail-closed silencieux avec log DEBUG).
 */
export function deserializeDNA(json: string): CharacterDNA | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (e) {
    console.debug(`[sprites2d-core] deserializeDNA: JSON invalide — ${String(e)}`);
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    console.debug("[sprites2d-core] deserializeDNA: l'objet est null, non-objet ou tableau");
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  // Vérifications des champs obligatoires
  const required: (keyof CharacterDNA)[] = [
    "dnaId", "createdAt", "version", "primarySpecies",
    "characterClass", "style", "morphology", "palette",
    "components", "equipment",
  ];

  for (const field of required) {
    if (!(field in obj)) {
      console.debug(`[sprites2d-core] deserializeDNA: champ obligatoire manquant — ${String(field)}`);
      return null;
    }
  }

  // Les invariants sont toujours forcés à false — jamais overridables par désérialisation
  return {
    ...(obj as CharacterDNA),
    certified: false,
    unique_human_proven: false,
  };
}

// ─── Export ───────────────────────────────────────────────────────────────────

export { SPECIES_MORPHOLOGY_DEFAULTS, BASE_ANCHOR_POINTS };
