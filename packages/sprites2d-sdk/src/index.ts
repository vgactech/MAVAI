/**
 * sprites2d-sdk — API publique SPRITES 2D
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-sdk
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * Ce package est le SEUL point d'entrée que les projets externes (OWLY,
 * autres jeux, autres applications) doivent importer.
 *
 * RÈGLE ABSOLUE : un consommateur externe n'importe JAMAIS directement
 * depuis @sprites2d/core, @sprites2d/character ou @sprites2d/quality.
 * Il passe uniquement par ce SDK.
 *
 * RÈGLE ISOLATION : ce package n'importe JAMAIS depuis owly-web ni depuis
 * un code applicatif OWLY. La dépendance est à sens unique.
 *
 * Usage minimal :
 *   import { Sprites2D } from "@sprites2d/sdk";
 *   const sdk = new Sprites2D();
 *   const record = sdk.character.createFromPreset("owly-samurai");
 *   const report = sdk.quality.auditDNA(record.dna);
 */

import {
  createCharacterDNA,
  mutateDNA,
  serializeDNA,
  deserializeDNA,
  mergeHybridMorphology,
} from "@sprites2d/core";
import {
  OWLY_PRESETS,
  characterLibrary,
  createFromPreset,
  createCustomCharacter,
  getPresetByClass,
  listPresetIds,
} from "@sprites2d/character";
import {
  validateDNA,
  validateAnimation,
  validateEquipment,
  fullCharacterAudit,
} from "@sprites2d/quality";

import type {
  CharacterDNA,
  DNAMutation,
  CharacterClass,
  SpeciesId,
  GraphicStyle,
  CharacterPalette,
  AnimationDescriptor,
  EquipmentRule,
} from "@sprites2d/schema";
import type { CharacterRecord, PresetDefinition } from "@sprites2d/character";
import type { DetailedQualityReport } from "@sprites2d/quality";

// ─── API Character ─────────────────────────────────────────────────────────────

export interface CharacterAPI {
  /**
   * Creates a CharacterRecord from one of the 8 OWLY presets.
   * @param presetId  One of the IDs returned by listPresets()
   * @param options   Optional name, tags and mutations
   */
  createFromPreset(
    presetId: string,
    options?: { name?: string; tags?: string[]; mutations?: DNAMutation[] }
  ): CharacterRecord | null;

  /**
   * Creates a fully custom character from scratch.
   */
  createCustom(
    name: string,
    params: {
      primarySpecies: SpeciesId;
      secondarySpecies?: SpeciesId;
      characterClass: CharacterClass;
      style?: GraphicStyle;
      palette?: Partial<CharacterPalette>;
      tags?: string[];
    }
  ): CharacterRecord;

  /**
   * Returns the raw DNA without the record wrapper.
   */
  createDNA(params: {
    primarySpecies: SpeciesId;
    secondarySpecies?: SpeciesId;
    characterClass: CharacterClass;
    style?: GraphicStyle;
    palette?: Partial<CharacterPalette>;
  }): CharacterDNA;

  /**
   * Applies mutations to a DNA and returns the new DNA.
   * Returns null if any mutation is invalid.
   */
  applyMutations(dna: CharacterDNA, mutations: DNAMutation[]): CharacterDNA | null;

  /**
   * Returns the hybrid morphology when two species are combined.
   */
  getHybridMorphology(primary: SpeciesId, secondary: SpeciesId): ReturnType<typeof mergeHybridMorphology>;

  /**
   * Serializes a DNA to a JSON string for storage or transport.
   */
  serialize(dna: CharacterDNA): string;

  /**
   * Deserializes a DNA from a JSON string.
   */
  deserialize(raw: string): CharacterDNA | null;

  /**
   * Lists all available OWLY preset IDs.
   */
  listPresets(): string[];

  /**
   * Returns the full preset definition by ID.
   */
  getPreset(id: string): PresetDefinition | null;

  /**
   * Returns the preset matching a character class.
   */
  getPresetByClass(cls: CharacterClass): PresetDefinition | null;

  /**
   * Accesses the in-memory character library (add / get / list / update / remove).
   */
  readonly library: typeof characterLibrary;
}

// ─── API Quality ──────────────────────────────────────────────────────────────

export interface QualityAPI {
  /** Full DNA validation — returns a detailed report. */
  auditDNA(dna: CharacterDNA): DetailedQualityReport;

  /** Animation validation. */
  auditAnimation(anim: AnimationDescriptor): DetailedQualityReport;

  /** Equipment validation against a character DNA. */
  auditEquipment(equipment: EquipmentRule, dna: CharacterDNA): DetailedQualityReport;

  /** Runs all applicable validations for a character and returns a summary. */
  fullAudit(dna: CharacterDNA): ReturnType<typeof fullCharacterAudit>;
}

// ─── Classe SDK principale ─────────────────────────────────────────────────────

/**
 * Sprites2D — Point d'entrée principal du moteur SPRITES 2D.
 *
 * Utilisez cette classe pour accéder à toutes les fonctionnalités du SDK
 * depuis votre application (OWLY ou tout autre projet).
 *
 * @example
 *   import { Sprites2D } from "@sprites2d/sdk";
 *   const sdk = new Sprites2D({ debug: true });
 *   const record = sdk.character.createFromPreset("owly-samurai");
 *   if (record) {
 *     const report = sdk.quality.auditDNA(record.dna);
 *     console.log(report.passed, report.scores);
 *   }
 */
export class Sprites2D {
  private readonly _debug: boolean;
  readonly version = "0.1.0";

  readonly character: CharacterAPI;
  readonly quality: QualityAPI;

  constructor(options?: { debug?: boolean }) {
    this._debug = options?.debug ?? false;
    this._log("Sprites2D SDK initialized", { version: this.version });

    this.character = {
      createFromPreset: (presetId, opts) => {
        this._log("character.createFromPreset", { presetId });
        return createFromPreset(presetId, opts);
      },
      createCustom: (name, params) => {
        this._log("character.createCustom", { name, species: params.primarySpecies });
        return createCustomCharacter(name, params);
      },
      createDNA: (params) => {
        this._log("character.createDNA", { species: params.primarySpecies });
        return createCharacterDNA(params);
      },
      applyMutations: (dna, mutations) => {
        this._log("character.applyMutations", { id: dna.id, count: mutations.length });
        return mutateDNA(dna, mutations);
      },
      getHybridMorphology: (primary, secondary) => {
        this._log("character.getHybridMorphology", { primary, secondary });
        return mergeHybridMorphology(primary, secondary);
      },
      serialize: (dna) => serializeDNA(dna),
      deserialize: (raw) => deserializeDNA(raw),
      listPresets: () => listPresetIds(),
      getPreset: (id) => OWLY_PRESETS.find((p) => p.id === id) ?? null,
      getPresetByClass: (cls) => getPresetByClass(cls),
      library: characterLibrary,
    };

    this.quality = {
      auditDNA: (dna) => {
        this._log("quality.auditDNA", { id: dna.id });
        const r = validateDNA(dna);
        if (this._debug && !r.passed) {
          console.warn(`[Sprites2D] DNA ${dna.id} audit FAILED — ${r.errors} error(s), ${r.warnings} warning(s)`);
        }
        return r;
      },
      auditAnimation: (anim) => {
        this._log("quality.auditAnimation", { id: anim.id ?? "?" });
        return validateAnimation(anim);
      },
      auditEquipment: (equipment, dna) => {
        this._log("quality.auditEquipment", { slot: equipment.slot, dnaId: dna.id });
        return validateEquipment(equipment, dna);
      },
      fullAudit: (dna) => {
        this._log("quality.fullAudit", { id: dna.id });
        return fullCharacterAudit(dna);
      },
    };
  }

  private _log(action: string, data?: Record<string, unknown>): void {
    if (this._debug) {
      console.debug(`[Sprites2D:DEBUG] ${action}`, data ?? "");
    }
  }
}

// ─── Exports de types publics ─────────────────────────────────────────────────

// Types du schéma
export type {
  CharacterDNA,
  DNAMutation,
  CharacterClass,
  SpeciesId,
  GraphicStyle,
  CharacterPalette,
  AnimationDescriptor,
  EquipmentRule,
  SkeletonFamily,
  MorphologyDefinition,
  QualityReport,
} from "@sprites2d/schema";

// Types des modules internes exposés publiquement
export type { CharacterRecord, PresetDefinition } from "@sprites2d/character";
export type { DetailedQualityReport, DetailedCheck } from "@sprites2d/quality";

// Constantes publiques
export { OWLY_PRESETS } from "@sprites2d/character";
