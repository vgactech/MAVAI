/**
 * @sprites2d/schema — Core type definitions for SPRITES 2D
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-schema
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * RÈGLE ABSOLUE : ce package ne dépend d'AUCUN autre package SPRITES 2D
 * ni d'OWLY. Il est la fondation commune importée par tous les autres.
 */

// ─── Identifiants ─────────────────────────────────────────────────────────────

export type SpeciesId =
  | "OWL"
  | "CAT"
  | "WOLF"
  | "FOX"
  | "DRAGON"
  | "RABBIT"
  | "BEAR"
  | "EAGLE"
  | string; // Extensible par le projet

export type CharacterClass =
  | "SAMURAI"
  | "CYBERPUNK"
  | "MAGE"
  | "ARCHER"
  | "KNIGHT"
  | "PIRATE"
  | "NINJA"
  | "TANK"
  | "WARRIOR"
  | "ASSASSIN"
  | "PALADIN"
  | "DRUID"
  | "SUMMONER"
  | "ENGINEER"
  | "PRIEST"
  | "NECROMANCER"
  | "BARD"
  | "BERSERKER"
  | string;

export type GraphicStyle = "PIXEL_ART" | "CARTOON" | "ANIME" | "ISOMETRIC" | "CHIBI";

export type SkeletonFamily =
  | "HUMANOID"
  | "QUADRUPED"
  | "AVIAN"
  | "SERPENTINE"
  | "ARACHNID"
  | "HYBRID";

export type AnimationType =
  // Déplacement
  | "IDLE"
  | "WALK"
  | "RUN"
  | "SPRINT"
  // Sauts
  | "JUMP_PREP"
  | "JUMP"
  | "FALL"
  | "LAND"
  // Combat
  | "ATTACK_LIGHT"
  | "ATTACK_HEAVY"
  | "ATTACK_COMBO"
  // Défense
  | "BLOCK"
  | "PARRY"
  | "DODGE"
  // Magie
  | "CAST_SUMMON"
  | "CAST_CHANNEL"
  | "CAST_LAUNCH"
  // Dégâts
  | "HIT"
  | "KNOCKBACK"
  | "BURN"
  | "FREEZE"
  // États
  | "POISON"
  | "PARALYZED"
  | "SLEEP"
  // Vie
  | "BREATHE"
  | "WOUNDED"
  | "FATIGUED"
  // Mort
  | "DEATH_COLLAPSE"
  | "DEATH_DISSOLVE"
  | "RESURRECT"
  // Interaction
  | "PICKUP"
  | "OPEN"
  | "TALK"
  | "CRAFT"
  // Spécial
  | "FLY"
  | "SWIM"
  | "CLIMB"
  | "TRANSFORM"
  | string;

// ─── Géométrie ────────────────────────────────────────────────────────────────

export interface Vector2D {
  x: number;
  y: number;
}

export interface Hitbox {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "DAMAGE" | "HURT" | "PUSH" | "INTERACT";
}

// ─── Points d'ancrage anatomiques ─────────────────────────────────────────────

export type AnchorPointId =
  | "HEAD_TOP"
  | "NECK"
  | "SHOULDER_LEFT"
  | "SHOULDER_RIGHT"
  | "ELBOW_LEFT"
  | "ELBOW_RIGHT"
  | "WRIST_LEFT"
  | "WRIST_RIGHT"
  | "HIP_LEFT"
  | "HIP_RIGHT"
  | "KNEE_LEFT"
  | "KNEE_RIGHT"
  | "ANKLE_LEFT"
  | "ANKLE_RIGHT"
  | "SPINE_TOP"
  | "SPINE_BOTTOM"
  | "WAIST"
  | "CHEST"
  | "BELT"
  | "WING_ATTACH_LEFT"
  | "WING_ATTACH_RIGHT"
  | "TAIL_ATTACH"
  | "HORN_LEFT"
  | "HORN_RIGHT"
  | "WEAPON_MAIN_HAND"
  | "WEAPON_OFF_HAND"
  | "EFFECT_ORIGIN"
  | string;

// ─── Morphologie ──────────────────────────────────────────────────────────────

export interface MorphologyDefinition {
  /** 1.0 = référence humanoïde standard */
  heightRatio: number;
  corpulenceRatio: number;
  armLengthRatio: number;
  legLengthRatio: number;
  headSizeRatio: number;

  /** Points d'ancrage avec coordonnées relatives (0-1) */
  anchorPoints: Partial<Record<AnchorPointId, Vector2D>>;

  /** Appendices présents */
  hasWings: boolean;
  hasTail: boolean;
  hasHorns: boolean;
  hasExtraLimbs: boolean;
  extraLimbCount: number;

  /** Famille squelettale pour choix du rig */
  skeletonFamily: SkeletonFamily;
}

// ─── Palette ──────────────────────────────────────────────────────────────────

export type AnatomyZone =
  | "BODY_PRIMARY"
  | "BODY_SECONDARY"
  | "EYES"
  | "BEAK_SNOUT"
  | "EARS"
  | "TAIL"
  | "WINGS"
  | "HORNS"
  | "CLAWS"
  | "MARKINGS";

export interface CharacterPalette {
  /** Couleurs figées par zone — hexadécimal ex: "#ff4422" */
  colors: Partial<Record<AnatomyZone, string>>;
  /** Date de fixation — la palette ne change plus après */
  lockedAt: string;
}

// ─── Composants graphiques ────────────────────────────────────────────────────

export interface ComponentReference {
  componentId: string;
  zone: AnatomyZone | string;
  layerOrder: number;
  /** Chemin relatif vers l'asset PNG */
  assetPath: string;
  /** SHA-256 du fichier pour intégrité */
  sha256: string;
  version: number;
}

// ─── Équipement ───────────────────────────────────────────────────────────────

export type EquipmentSlotId =
  | "HEAD"
  | "BODY"
  | "ARMS"
  | "LEGS"
  | "FEET"
  | "BELT"
  | "CAPE"
  | "WEAPON_MAIN"
  | "WEAPON_OFF"
  | "ACCESSORY_1"
  | "ACCESSORY_2";

export interface EquipmentSlots {
  slots: Partial<Record<EquipmentSlotId, string | null>>; // null = vide
}

// ─── Historique mutations ─────────────────────────────────────────────────────

export interface DNAMutation {
  timestamp: string; // ISO-8601
  field: string;
  previousValue: unknown;
  newValue: unknown;
  author: "USER" | "SYSTEM" | "AI_SUGGESTION";
}

// ─── CharacterDNA — type central ──────────────────────────────────────────────

export interface CharacterDNA {
  // Identité immuable
  dnaId: string;      // UUID v4 — JAMAIS modifié après création
  createdAt: string;  // ISO-8601
  version: number;    // Incrémenté à chaque mutation
  modificationHistory: DNAMutation[];

  // Espèces
  primarySpecies: SpeciesId;
  secondarySpecies?: SpeciesId;
  hybridRatio?: number; // 0.0 à 1.0, dominance espèce primaire

  // Morphologie
  morphology: MorphologyDefinition;

  // Identité visuelle
  palette: CharacterPalette;
  style: GraphicStyle;
  name?: string;

  // Classe RPG
  characterClass: CharacterClass;

  // Composants graphiques (références, pas les images elles-mêmes)
  components: ComponentReference[];

  // Équipement actuel
  equipment: EquipmentSlots;

  // Squelette associé
  skeletonId?: string;

  // Invariants — NE JAMAIS MODIFIER
  certified: false;              // TOUJOURS false — jamais certifié automatiquement
  unique_human_proven: false;    // TOUJOURS false
}

// ─── Définition d'espèce ──────────────────────────────────────────────────────

export interface SpeciesDefinition {
  id: SpeciesId;
  name: string;
  defaultMorphology: MorphologyDefinition;
  /** Espèces avec lesquelles cette espèce peut former un hybride */
  hybridCompatible: SpeciesId[];
  /** Zones anatomiques distinctives */
  distinctiveZones: AnatomyZone[];
}

// ─── Animation ────────────────────────────────────────────────────────────────

export interface AnimationEvent {
  frame: number;
  type: "STEP" | "ATTACK_ACTIVE" | "EFFECT_SPAWN" | "SOUND" | string;
  data?: Record<string, unknown>;
}

export interface AnimationDescriptor {
  animationId: string;
  type: AnimationType;
  frameCount: number;
  fps: number;
  durationMs: number;
  looping: boolean;
  /** Déplacement du personnage pendant l'animation */
  characterDisplacement: Vector2D;
  events: AnimationEvent[];
  /** Hitboxes actives par numéro de frame */
  hitboxes: Record<number, Hitbox[]>;
  /** Transitions autorisées */
  allowedTransitionsFrom: AnimationType[];
  allowedTransitionsTo: AnimationType[];
  compatibleSkeletonFamilies: SkeletonFamily[];
}

// ─── Résultat de validation qualité ──────────────────────────────────────────

export type QualityCheckStatus = "PASS" | "FAIL" | "WARNING";

export interface QualityCheckResult {
  checkId: string;
  status: QualityCheckStatus;
  message: string;
  details?: Record<string, unknown>;
}

export interface QualityReport {
  assetId: string;
  assetType: "CHARACTER" | "ANIMATION" | "EQUIPMENT" | "TERRAIN" | "CREATURE";
  timestamp: string;
  checks: QualityCheckResult[];
  exportAllowed: boolean; // false si au moins un FAIL
}

// ─── Compatibilité équipement ─────────────────────────────────────────────────

export interface AppendiceOpening {
  appendice: "WING_LEFT" | "WING_RIGHT" | "TAIL" | "HORN_LEFT" | "HORN_RIGHT" | string;
  required: boolean;
  defaultShapeAdjustment: "NONE" | "SMALL" | "LARGE" | "CUT";
}

export interface EquipmentRule {
  equipmentId: string;
  slotId: EquipmentSlotId;
  compatibleSpecies: SpeciesId[];      // [] = universel
  incompatibleSpecies: SpeciesId[];
  requiredOpenings: AppendiceOpening[];
  layerOrder: number;
  coverageZones: AnatomyZone[];
  name: string;
  description?: string;
}
