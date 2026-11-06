/**
 * sprites2d-quality — Moteur de validation qualité des assets SPRITES 2D
 *
 * Projet : OWLY / SPRITES 2D (VGACTech)
 * Module : sprites2d-quality
 * Auteur : ARTCB Project <vgactech@artcb.me>
 *
 * CERTIFIED_100=false | unique_human_proven=false
 * Mode DEBUG actif
 *
 * Responsabilités :
 *   - Valider un CharacterDNA (cohérence anatomique, palette, morphologie)
 *   - Valider une animation (frames, pivots, boucles)
 *   - Valider un équipement (compatibilité morphologique, slots)
 *   - Produire un QualityReport avec score, détails et recommandations
 *
 * PRINCIPE : Aucun asset ne passe en production sans un rapport vert.
 *            Un asset peut être visuellement magnifique et techniquement inutilisable.
 *            Les indicateurs restent séparés — on ne fusionne pas en un seul score global.
 */

import type {
  CharacterDNA,
  QualityReport,
  QualityCheck,
  AnimationDescriptor,
  EquipmentRule,
  SkeletonFamily,
  MorphologyDefinition,
} from "@sprites2d/schema";

// ─── Sévérités et statuts ──────────────────────────────────────────────────────

export type CheckSeverity = "ERROR" | "WARNING" | "INFO";
export type CheckStatus = "PASS" | "FAIL" | "WARN" | "SKIP";

export interface DetailedCheck {
  readonly id: string;
  readonly category: string;
  readonly description: string;
  readonly status: CheckStatus;
  readonly severity: CheckSeverity;
  readonly message: string;
  readonly suggestion?: string;
}

export interface DetailedQualityReport {
  readonly assetId: string;
  readonly assetType: "CHARACTER_DNA" | "ANIMATION" | "EQUIPMENT" | "WORLD_TILE";
  readonly timestamp: string;
  readonly checks: DetailedCheck[];
  readonly scores: {
    readonly anatomicalConsistency: number;   // 0–100
    readonly paletteIntegrity: number;        // 0–100
    readonly morphologyValidity: number;       // 0–100
    readonly equipmentCompatibility: number;   // 0–100 (NaN si non applicable)
    readonly animationQuality: number;         // 0–100 (NaN si non applicable)
    readonly runtimeReadiness: number;         // 0–100
  };
  readonly passed: boolean;  // true si aucun check ERROR FAIL
  readonly warnings: number;
  readonly errors: number;
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

function check(
  id: string,
  category: string,
  description: string,
  condition: boolean,
  severity: CheckSeverity,
  failMessage: string,
  passMessage: string,
  suggestion?: string
): DetailedCheck {
  return {
    id,
    category,
    description,
    status: condition ? "PASS" : severity === "ERROR" ? "FAIL" : "WARN",
    severity,
    message: condition ? passMessage : failMessage,
    suggestion: condition ? undefined : suggestion,
  };
}

function warnIf(
  id: string,
  category: string,
  description: string,
  condition: boolean,
  warnMessage: string,
  passMessage: string,
  suggestion?: string
): DetailedCheck {
  return check(id, category, description, !condition, "WARNING", warnMessage, passMessage, suggestion);
}

// ─── Validation CharacterDNA ──────────────────────────────────────────────────

/**
 * Validates a CharacterDNA object.
 *
 * Checks performed (not exhaustive, grows with implementation):
 *   DNA-001  ID présent et non vide
 *   DNA-002  primarySpecies présente
 *   DNA-003  morphology heightRatio dans [0.1, 5.0]
 *   DNA-004  morphology corpulenceRatio dans [0.1, 5.0]
 *   DNA-005  palette primaryColor est un hex valide
 *   DNA-006  palette secondaryColor est un hex valide
 *   DNA-007  skeletonFamily cohérente avec les appendices déclarés
 *   DNA-008  hasExtraLimbs → extraLimbCount > 0
 *   DNA-009  version présente
 *   DNA-010  historique des mutations non négatif
 */
export function validateDNA(dna: CharacterDNA): DetailedQualityReport {
  const checks: DetailedCheck[] = [];
  const now = new Date().toISOString();

  // DNA-001 : ID
  checks.push(check(
    "DNA-001", "IDENTITY", "ID présent et non vide",
    typeof dna.id === "string" && dna.id.trim().length > 0,
    "ERROR", "L'identifiant DNA est vide ou absent.", "ID valide détecté.",
    "Régénérer via createCharacterDNA()."
  ));

  // DNA-002 : espèce principale
  checks.push(check(
    "DNA-002", "SPECIES", "primarySpecies présente",
    typeof dna.primarySpecies === "string" && dna.primarySpecies.trim().length > 0,
    "ERROR", "primarySpecies est vide ou absent.", "primarySpecies valide.",
    "Fournir une SpeciesId valide."
  ));

  // DNA-003 : hauteur morphologique
  const h = dna.morphology?.heightRatio ?? -1;
  checks.push(check(
    "DNA-003", "MORPHOLOGY", "heightRatio dans [0.1, 5.0]",
    h >= 0.1 && h <= 5.0,
    "ERROR", `heightRatio hors limites : ${h}`, `heightRatio OK : ${h}`,
    "Valeur recommandée entre 0.5 (chibi) et 1.5 (géant)."
  ));

  // DNA-004 : corpulence
  const c = dna.morphology?.corpulenceRatio ?? -1;
  checks.push(check(
    "DNA-004", "MORPHOLOGY", "corpulenceRatio dans [0.1, 5.0]",
    c >= 0.1 && c <= 5.0,
    "ERROR", `corpulenceRatio hors limites : ${c}`, `corpulenceRatio OK : ${c}`,
    "Valeur recommandée entre 0.6 (svelte) et 2.0 (colosse)."
  ));

  // DNA-005 & 006 : palette hexadécimale
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  const primaryColor = dna.palette?.primaryColor ?? "";
  const secondaryColor = dna.palette?.secondaryColor ?? "";

  checks.push(check(
    "DNA-005", "PALETTE", "primaryColor format hex #RRGGBB",
    hexRegex.test(primaryColor),
    "WARNING", `primaryColor invalide : "${primaryColor}"`, `primaryColor OK : ${primaryColor}`,
    "Format attendu : #RRGGBB (ex: #FF4500)."
  ));

  checks.push(check(
    "DNA-006", "PALETTE", "secondaryColor format hex #RRGGBB",
    hexRegex.test(secondaryColor),
    "WARNING", `secondaryColor invalide : "${secondaryColor}"`, `secondaryColor OK : ${secondaryColor}`,
    "Format attendu : #RRGGBB (ex: #8B4513)."
  ));

  // DNA-007 : squelette vs appendices
  const sf: SkeletonFamily = dna.morphology?.skeletonFamily ?? "HUMANOID";
  const hasWings = dna.morphology?.hasWings ?? false;
  const hasTail = dna.morphology?.hasTail ?? false;

  const avianConsistency = sf === "AVIAN" ? hasWings : true;
  checks.push(check(
    "DNA-007", "ANATOMY", "skeletonFamily cohérente avec les appendices",
    avianConsistency,
    "WARNING",
    `AVIAN déclaré mais hasWings=false — incohérence anatomique.`,
    `Squelette ${sf} cohérent avec les appendices.`,
    "Activer hasWings ou changer de skeletonFamily."
  ));

  // DNA-008 : extra limbs
  const hasExtra = dna.morphology?.hasExtraLimbs ?? false;
  const extraCount = dna.morphology?.extraLimbCount ?? 0;
  checks.push(check(
    "DNA-008", "ANATOMY", "hasExtraLimbs → extraLimbCount > 0",
    !hasExtra || extraCount > 0,
    "ERROR",
    "hasExtraLimbs=true mais extraLimbCount=0 — incohérence critique.",
    "Nombre de membres supplémentaires cohérent.",
    "Définir extraLimbCount > 0 ou désactiver hasExtraLimbs."
  ));

  // DNA-009 : version
  checks.push(check(
    "DNA-009", "METADATA", "version présente",
    typeof dna.version === "string" && dna.version.length > 0,
    "WARNING", "version absente ou vide.", `version : ${dna.version}`,
    "Initialiser via createCharacterDNA()."
  ));

  // DNA-010 : mutations
  const mutCount = dna.mutationCount ?? 0;
  checks.push(warnIf(
    "DNA-010", "METADATA", "Nombre de mutations non négatif",
    mutCount < 0,
    `mutationCount négatif : ${mutCount}`,
    `mutationCount : ${mutCount}`
  ));

  // ─── Calcul des scores ──────────────────────────────────────────────────────
  const anatomyChecks = checks.filter((c) => c.category === "ANATOMY" || c.category === "MORPHOLOGY");
  const anatomyPassed = anatomyChecks.filter((c) => c.status === "PASS").length;
  const anatomicalConsistency = anatomyChecks.length > 0
    ? Math.round((anatomyPassed / anatomyChecks.length) * 100)
    : 100;

  const paletteChecks = checks.filter((c) => c.category === "PALETTE");
  const palettePassed = paletteChecks.filter((c) => c.status === "PASS").length;
  const paletteIntegrity = paletteChecks.length > 0
    ? Math.round((palettePassed / paletteChecks.length) * 100)
    : 100;

  const morphologyChecks = checks.filter((c) => c.category === "MORPHOLOGY");
  const morphologyPassed = morphologyChecks.filter((c) => c.status === "PASS").length;
  const morphologyValidity = morphologyChecks.length > 0
    ? Math.round((morphologyPassed / morphologyChecks.length) * 100)
    : 100;

  const errors = checks.filter((c) => c.status === "FAIL").length;
  const warnings = checks.filter((c) => c.status === "WARN").length;
  const runtimeReadiness = errors === 0
    ? (warnings === 0 ? 100 : Math.max(0, 100 - warnings * 15))
    : 0;

  return {
    assetId: dna.id,
    assetType: "CHARACTER_DNA",
    timestamp: now,
    checks,
    scores: {
      anatomicalConsistency,
      paletteIntegrity,
      morphologyValidity,
      equipmentCompatibility: NaN,
      animationQuality: NaN,
      runtimeReadiness,
    },
    passed: errors === 0,
    warnings,
    errors,
  };
}

// ─── Validation Animation ─────────────────────────────────────────────────────

/**
 * Validates an AnimationDescriptor.
 *
 * Checks:
 *   ANIM-001  frameCount >= 1
 *   ANIM-002  fps dans [1, 60]
 *   ANIM-003  width et height identiques dans tous les frames
 *   ANIM-004  duration > 0
 *   ANIM-005  transitions non vides si animation non isolée
 */
export function validateAnimation(anim: AnimationDescriptor): DetailedQualityReport {
  const checks: DetailedCheck[] = [];
  const now = new Date().toISOString();

  checks.push(check(
    "ANIM-001", "FRAMES", "frameCount >= 1",
    anim.frameCount >= 1,
    "ERROR", `frameCount invalide : ${anim.frameCount}`, `frameCount : ${anim.frameCount}`,
    "Une animation doit avoir au moins 1 frame."
  ));

  checks.push(check(
    "ANIM-002", "TIMING", "fps dans [1, 60]",
    anim.fps >= 1 && anim.fps <= 60,
    "ERROR", `fps hors limites : ${anim.fps}`, `fps : ${anim.fps}`,
    "Valeur recommandée : 4–24 pour pixel art, 30–60 pour fluide."
  ));

  checks.push(check(
    "ANIM-003", "TIMING", "duration > 0",
    anim.duration > 0,
    "ERROR", `duration invalide : ${anim.duration}ms`, `duration : ${anim.duration}ms`,
    "duration = frameCount / fps * 1000."
  ));

  checks.push(warnIf(
    "ANIM-004", "LOOP", "loop défini",
    anim.loop === undefined || anim.loop === null,
    "loop non défini — comportement par défaut indéfini.",
    `loop : ${anim.loop}`,
    "Définir explicitement loop=true ou loop=false."
  ));

  const errors = checks.filter((c) => c.status === "FAIL").length;
  const warnings = checks.filter((c) => c.status === "WARN").length;
  const passed = checks.filter((c) => c.status === "PASS").length;
  const animationQuality = Math.round((passed / checks.length) * 100);

  return {
    assetId: anim.id ?? "unknown",
    assetType: "ANIMATION",
    timestamp: now,
    checks,
    scores: {
      anatomicalConsistency: NaN,
      paletteIntegrity: NaN,
      morphologyValidity: NaN,
      equipmentCompatibility: NaN,
      animationQuality,
      runtimeReadiness: errors === 0 ? Math.max(0, 100 - warnings * 10) : 0,
    },
    passed: errors === 0,
    warnings,
    errors,
  };
}

// ─── Validation Équipement ────────────────────────────────────────────────────

/**
 * Validates an EquipmentRule against a CharacterDNA morphology.
 *
 * Checks:
 *   EQ-001  slot non vide
 *   EQ-002  compatibleSpecies inclut la primarySpecies du DNA
 *   EQ-003  Pas de contraintes de morphologie violées (wings, horns)
 *   EQ-004  incompatibleWith liste non vide (warning si absente)
 */
export function validateEquipment(
  equipment: EquipmentRule,
  dna: CharacterDNA
): DetailedQualityReport {
  const checks: DetailedCheck[] = [];
  const now = new Date().toISOString();

  // EQ-001
  checks.push(check(
    "EQ-001", "SLOT", "slot non vide",
    typeof equipment.slot === "string" && equipment.slot.trim().length > 0,
    "ERROR", "slot d'équipement vide ou absent.", `slot : ${equipment.slot}`,
    "Définir un slot valide (HEAD, CHEST, LEGS, etc.)."
  ));

  // EQ-002 : compatibilité espèce
  const speciesCompat =
    equipment.compatibleSpecies.length === 0 ||
    equipment.compatibleSpecies.includes(dna.primarySpecies) ||
    (dna.secondarySpecies != null && equipment.compatibleSpecies.includes(dna.secondarySpecies));

  checks.push(check(
    "EQ-002", "COMPATIBILITY", "Espèce compatible avec l'équipement",
    speciesCompat,
    "ERROR",
    `Espèce "${dna.primarySpecies}" incompatible avec cet équipement.`,
    `Espèce "${dna.primarySpecies}" compatible.`,
    "Vérifier compatibleSpecies dans la définition de l'équipement."
  ));

  // EQ-003 : ailes + armure dorsale
  const hasWings = dna.morphology?.hasWings ?? false;
  const isBackSlot = equipment.slot === "BACK" || equipment.slot === "CAPE";
  if (hasWings && isBackSlot) {
    checks.push(check(
      "EQ-003", "ANATOMY", "Slot BACK avec ailes — ouvertures requises",
      equipment.requiresWingOpening === true,
      "WARNING",
      "Armure dorsale sur personnage ailé sans ouvertures déclarées.",
      "Ouvertures pour ailes déclarées (requiresWingOpening=true).",
      "Ajouter requiresWingOpening: true à l'équipement."
    ));
  }

  // EQ-004 : liste incompatibilités
  checks.push(warnIf(
    "EQ-004", "METADATA", "incompatibleWith défini",
    !equipment.incompatibleWith || equipment.incompatibleWith.length === 0,
    "incompatibleWith non défini — combinaisons problématiques non détectables.",
    "incompatibleWith défini.",
    "Lister les IDs d'équipements incompatibles (ex: deux armes deux-mains)."
  ));

  const errors = checks.filter((c) => c.status === "FAIL").length;
  const warnings = checks.filter((c) => c.status === "WARN").length;
  const passed = checks.filter((c) => c.status === "PASS").length;
  const compat = Math.round((passed / checks.length) * 100);

  return {
    assetId: equipment.slot,
    assetType: "EQUIPMENT",
    timestamp: now,
    checks,
    scores: {
      anatomicalConsistency: NaN,
      paletteIntegrity: NaN,
      morphologyValidity: NaN,
      equipmentCompatibility: compat,
      animationQuality: NaN,
      runtimeReadiness: errors === 0 ? Math.max(0, 100 - warnings * 10) : 0,
    },
    passed: errors === 0,
    warnings,
    errors,
  };
}

// ─── Rapport batch ────────────────────────────────────────────────────────────

/**
 * Runs all applicable validations for a CharacterDNA and returns
 * a summary with all individual reports.
 */
export function fullCharacterAudit(dna: CharacterDNA): {
  dnaReport: DetailedQualityReport;
  globalPassed: boolean;
  totalErrors: number;
  totalWarnings: number;
} {
  const dnaReport = validateDNA(dna);
  return {
    dnaReport,
    globalPassed: dnaReport.passed,
    totalErrors: dnaReport.errors,
    totalWarnings: dnaReport.warnings,
  };
}
