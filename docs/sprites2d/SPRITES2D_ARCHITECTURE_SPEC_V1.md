
# SPRITES 2D — Architecture Specification V1
## Sous-projet indépendant intégré dans OWLY

**Projet parent :** `vgactech/owly` (fork de `vgactech/klerio-project-hub`)
**Auteur :** VGACTech — ARTCB Project
**Date :** 2026-11-04
**Statut :** SPEC_V1 — en attente implémentation P0
**CERTIFIED_100=false | unique_human_proven=false | Mode DEBUG actif**

---

## 1. Contexte et objectif

SPRITES 2D est un moteur universel de création d'assets 2D. Il est développé comme un sous-projet
totalement indépendant à l'intérieur du dépôt OWLY, avec pour objectif de devenir la fondation
graphique d'OWLY et de tout projet futur nécessitant des personnages, créatures, décors et
effets animés.

SPRITES 2D répond au problème suivant : les générateurs IA existants (SEELE, Midjourney, etc.)
produisent de belles images mais pas des assets de jeu techniquement utilisables. Ils ne
garantissent pas la cohérence anatomique entre les frames d'animation, la stabilité visuelle
lors des changements d'équipement, ni la compatibilité morphologique des armures avec des
espèces non humanoïdes.

La solution est un moteur déterministe d'assemblage par composants, alimenté optionnellement
par une couche IA locale, mais fonctionnant complètement sans elle.

---

## 2. Principe fondamental : image ≠ personnage

Un personnage n'est PAS une image.

Un personnage est une structure de données (CharacterDNA) qui contient :
- une identité persistante avec un identifiant immuable
- une morphologie définie par des ratios anatomiques
- une palette de couleurs figée par codes hexadécimaux exacts
- une liste de composants graphiques référencés individuellement
- des règles d'assemblage et de compatibilité
- un historique versionné de chaque modification

L'image est le RÉSULTAT de l'assemblage de ces composants selon les règles du DNA.
Elle n'est jamais l'entrée du système.

---

## 3. Architecture en trois couches

### Couche 1 : Moteur Déterministe (sans IA)

Responsabilités :
- Assembler les composants graphiques selon le CharacterDNA
- Calculer la morphologie des hybrides entre espèces
- Vérifier la compatibilité équipement/anatomie
- Générer les points d'ancrage et pivots
- Produire des résultats reproductibles à 100%

Contrainte absolue : cette couche fonctionne hors-ligne et sans modèle IA.
Les mêmes paramètres d'entrée produisent toujours la même sortie.

### Couche 2 : Moteur IA Local (optionnel)

Responsabilités :
- Générer des composants graphiques de base via des modèles locaux ONNX
- Segmenter des images pour en extraire des composants
- Créer des variantes stylistiques d'un composant existant

Contrainte absolue : cette couche n'a jamais accès aux décisions d'assemblage.
Elle fournit des matériaux bruts, jamais le résultat final.
Si elle est désactivée, le Moteur Déterministe continue de fonctionner.

### Couche 3 : Interface de Production

Responsabilités :
- Exposer les outils à l'utilisateur : Character Studio, Pixel Editor, Animation Studio
- Communiquer avec les deux couches via l'API interne sprites2d-sdk
- Fournir la prévisualisation temps réel

Contrainte absolue : cette couche ne contient aucune logique métier.
Elle appelle le SDK et affiche les résultats.

---

## 4. Structure monorepo dans OWLY

```
owly/
├── apps/
│   ├── owly-web/                    ← Application OWLY existante
│   └── sprites2d-studio/            ← Studio autonome SPRITES 2D (à créer)
├── packages/
│   ├── sprites2d-schema/            ← Types TypeScript partagés (P0 - PRIORITÉ 1)
│   ├── sprites2d-core/              ← Moteur d'assemblage déterministe (P0)
│   ├── sprites2d-character/         ← Gestion CharacterDNA (P0)
│   ├── sprites2d-anatomy/           ← Morphologie et points d'ancrage (P1)
│   ├── sprites2d-species/           ← Espèces et hybrides (P1)
│   ├── sprites2d-equipment/         ← Vêtements, armures, armes (P2)
│   ├── sprites2d-skeleton/          ← Squelettes 2D multi-espèces (P3)
│   ├── sprites2d-animation/         ← Animations et transitions (P3)
│   ├── sprites2d-pixel-editor/      ← Éditeur canvas HTML5 (P1)
│   ├── sprites2d-creatures/         ← Créatures et monstres (P4)
│   ├── sprites2d-world/             ← Biomes et environnements (P4)
│   ├── sprites2d-tilemap/           ← Tilesets et cartes (P4)
│   ├── sprites2d-vfx/               ← Magie et effets visuels (P4)
│   ├── sprites2d-quality/           ← Validation automatique (P0)
│   ├── sprites2d-assets/            ← Bibliothèque et versionnement (P0)
│   ├── sprites2d-sdk/               ← API publique (P0)
│   └── sprites2d-exporters/         ← Export PNG/JSON/Aseprite (P1)
└── services/
    └── sprites2d-ai-worker/         ← Processus Python ONNX local (P5)
```

**Règle de dépendance absolue (sens unique) :**
`owly-web` → importe `sprites2d-sdk`
`sprites2d-sdk` → NE CONNAÎT PAS `owly-web`
Violer cette règle bloque toute réutilisation externe.

---

## 5. Schémas de données (sprites2d-schema)

### CharacterDNA

```typescript
interface CharacterDNA {
  // Identité immuable
  dnaId: string;                      // UUID v4, jamais modifié après création
  createdAt: string;                  // ISO-8601
  version: number;                    // Incrémenté à chaque modification
  modificationHistory: DNAMutation[]; // Audit complet des changements

  // Espèces
  primarySpecies: SpeciesId;
  secondarySpecies?: SpeciesId;       // Hybride optionnel
  hybridRatio?: number;               // 0.0 à 1.0, dominance espèce primaire

  // Morphologie
  morphology: MorphologyDefinition;

  // Identité visuelle
  palette: CharacterPalette;          // Couleurs figées par zone anatomique
  style: GraphicStyle;                // PIXEL_ART | CARTOON | ANIME | ISOMETRIC

  // Classe et rôle RPG
  characterClass: CharacterClass;

  // Composants graphiques (références, pas les images)
  components: ComponentReference[];

  // Équipement actuel
  equipment: EquipmentSlots;

  // Squelette
  skeletonId?: string;                // Référence vers squelette 2D associé
}
```

### MorphologyDefinition

```typescript
interface MorphologyDefinition {
  // Proportions relatives (1.0 = référence humanoïde standard)
  heightRatio: number;                // 0.5 (chibi) à 2.0 (gigantesque)
  corpulenceRatio: number;            // 0.5 (fin) à 2.0 (massif)
  armLengthRatio: number;
  legLengthRatio: number;
  headSizeRatio: number;

  // Points d'ancrage anatomiques nommés
  anchorPoints: Record<AnchorPointId, Vector2D>;

  // Appendices présents
  hasWings: boolean;
  hasTail: boolean;
  hasHorns: boolean;
  hasExtraLimbs: boolean;
  extraLimbCount: number;

  // Famille squelettale pour choix du rig
  skeletonFamily: SkeletonFamily; // HUMANOID | QUADRUPED | AVIAN | SERPENTINE | HYBRID
}
```

### EquipmentCompatibility

```typescript
interface EquipmentRule {
  equipmentId: string;
  compatibleSpecies: SpeciesId[];           // [] = universel
  incompatibleSpecies: SpeciesId[];
  morphologyConstraints: MorphologyConstraint[];
  // Ouvertures nécessaires pour appendices
  requiredOpenings: AppendiceOpening[];
  // Calques (ordre d'assemblage)
  layerOrder: number;
  // Zones anatomiques couvertes
  coverageZones: AnatomyZone[];
}
```

### AnimationDescriptor

```typescript
interface AnimationDescriptor {
  animationId: string;
  type: AnimationType;     // IDLE | WALK | RUN | ATTACK_LIGHT | ATTACK_HEAVY | etc.
  frameCount: number;
  fps: number;
  looping: boolean;
  // Déplacement du personnage pendant l'animation (pour footstep sync)
  characterDisplacement: Vector2D;
  // Événements déclencheurs à des frames précises
  events: AnimationEvent[];
  // Zones de collision actives par frame
  hitboxes: Record<number, Hitbox[]>;
  // Transitions autorisées depuis/vers cette animation
  allowedTransitionsFrom: AnimationType[];
  allowedTransitionsTo: AnimationType[];
  // Compatible avec ces familles squelettales
  compatibleSkeletonFamilies: SkeletonFamily[];
}
```

---

## 6. Les 18 modules fonctionnels

### Module 01 — Character DNA
Stockage et gestion du CharacterDNA. Versionnement. Historique des mutations.
Validation de cohérence interne. Serialisation/désérialisation JSON.

### Module 02 — Species Engine
Définitions anatomiques par espèce. Règles de fusion pour les hybrides.
Calcul de morphologie résultante. Validation de compatibilité espèce/équipement.

Espèces initiales OWLY : HIBOU, CHAT, LOUP, RENARD, DRAGON, LAPIN, OURS, AIGLE.
Espèces extensibles par le développeur de projet.

### Module 03 — Clothing Engine
Vêtements adaptatifs. Calcul du fitting sur la morphologie courante.
Règles d'ouverture pour les appendices. Détection des conflits de calques.

### Module 04 — Armor Engine
Armures et protections. Contraintes morphologiques strictes.
Systèmes de découpe automatique pour appendices. Variantes par famille squelettale.

### Module 05 — Weapon Engine
Armes blanches, à distance, magiques. Points de prise en main calculés selon la morphologie.
Synchronisation des deux bras pour armes à deux mains. Zones de collision et dégâts.

### Module 06 — VFX Engine
Effets magie, feu, glace, eau, foudre, lumière, ombre, poison, explosion, aura, portail.
Chaque effet : animation propre, durée, origine, orientation, événements de déclenchement.
Effets indépendants des personnages, attachables via points d'ancrage.

### Module 07 — Skeleton Engine
Squelettes 2D par famille : HUMANOID, QUADRUPED, AVIAN, SERPENTINE, ARACHNID, HYBRID.
IK et FK. Articulations supplémentaires. Os secondaires (capes, queues, cheveux).
Déformation douce des vêtements. Points d'attache des armes et effets.
Méthode 1 : déplacement de pièces (pixel art haute résolution).
Méthode 2 : remplacement d'images (pixel art basse résolution).

### Module 08 — Animation Engine
Bibliothèque d'animations par catégorie :
- Déplacement : idle, marche 4 dirs, course, sprint
- Combat : attaque légère/lourde/combo, blocage, parade, esquive
- Magie : invocation, canalisation, lancement
- Dégâts : impact, recul, brûlure, gel, empoisonnement
- États : vie, blessure, fatigue, paralysie
- Mort : effondrement, disparition, résurrection
- Interaction : ramasser, ouvrir, parler, fabriquer
- Spécial : vol, nage, escalade, transformation

Transitions interruptibles. Animations prioritaires. Blending de transitions.

### Module 09 — Creature Engine
Animaux, insectes, reptiles, créatures marines, dragons, démons, élémentaires,
morts-vivants, créatures artificielles, boss, hybrides, créatures évolutives.
Stades de vie : naissance, croissance, maturité, évolution, transformation.
Variantes anatomiques et comportements visuels.

### Module 10 — World Engine
Biomes, zones géographiques, règles d'évolution du monde.
Graine reproductible par monde. API de requête d'assets par contexte narratif.

### Module 11 — Tilemap Engine
Tilesets, cartes en couches, collisions, végétation, bâtiments.
Validation de continuité des tiles. Détection des trous.

### Module 12 — Terrain Engine
Génération procédurale de terrain 2D et 2.5D isométrique.
Biomes, reliefs, chemins, zones de rencontre. Export de carte avec métadonnées.

### Module 13 — Pixel Editor
Éditeur canvas HTML5 intégré. Dessin pixel par pixel. Sélection de zone.
Remplissage. Palette. Déplacement de membres. Comparaison de versions.
Modification multi-frames simultanée. Propagation vers animations.
Undo/redo complet. Zoom 1x à 32x.

### Module 14 — Layer Engine
Assemblage par calques ordonnés. Ordre standard :
anatomie / corps / peau-fourrure / visage / yeux / oreilles / queue /
cornes-ailes / sous-vêtements / vêtements / armure / gants-bottes /
ceinture-accessoires / armes / effets / ombres-lumières.
Chaque calque est remplaçable indépendamment.

### Module 15 — AI Generation Engine
Phase 1 (P0-P3) : génération procédurale pure sans IA.
Phase 2 (P5) : modèles ONNX locaux pour composants graphiques.
Phase 3 (P6) : fine-tuning sur dataset VGACTech.
L'IA ne décide jamais de l'assemblage. Elle fournit des matériaux.

### Module 16 — Quality Engine
Vérifications automatiques avant export :
- Canal alpha présent
- Dimensions identiques entre frames
- Palette conforme au DNA
- Continuité des pivots d'animation
- Équipements présents dans chaque frame
- Absence de glissement non intentionnel
- Licence du composant documentée

Un asset qui échoue ne peut pas être exporté. Pas d'exception.

### Module 17 — Asset Manager
Bibliothèque versionnée des assets créés. Historique des versions par asset.
Recherche par DNA, espèce, classe, équipement. Import/export de packages.

### Module 18 — Export SDK
Formats : PNG RGBA, WebP, JSON, Aseprite, SVG, ZIP.
Format natif : package versionné (DNA + composants + animations + licence).
Adaptateurs moteurs : Godot 4, Unity 2D, Unreal Paper2D, GameMaker, Phaser, Pygame.

---

## 7. Parcours de création d'avatar OWLY

Ce parcours s'intègre sur la page /play existante dans OWLY.

### Étape 1 : Choix de classe (EXISTE DÉJÀ)
Le joueur voit les 8 cartes de classe : Samurai, Cyberpunk, Mage, Archer,
Chevalier, Pirate, Ninja, Tank.
Sélection → initialisation d'un CharacterDNA de base avec la classe.

### Étape 2 : Choix d'espèce principale (À CONSTRUIRE - P1)
Options : Hibou, Chat, Loup, Renard, Dragon, Lapin, Ours, Aigle.
Le Species Engine calcule la morphologie et met à jour le DNA.
Le personnage se construit pixel par pixel visible en direct.

### Étape 3 : Espèce secondaire optionnelle (À CONSTRUIRE - P1)
Hybridation avec calcul de morphologie résultante.
Le joueur voit l'évolution en temps réel.

### Étape 4 : Palette de couleurs (À CONSTRUIRE - P1)
Sliders teinte/saturation/luminosité par zone anatomique.
La palette est figée dans le DNA dès confirmation.

### Étape 5 : Morphologie (À CONSTRUIRE - P1)
Taille, corpulence, proportions, appendices.
Les sliders modifient les ratios du MorphologyDefinition.

### Étape 6 : Équipement compatible (À CONSTRUIRE - P2)
Seuls les équipements compatibles avec la morphologie actuelle sont affichés.
Le Clothing Engine et l'Armor Engine filtrent automatiquement.

### Étape 7 : Prévisualisation animée (À CONSTRUIRE - P3)
Marche 4 directions, attaque, pouvoir. Visible avant confirmation.

### Étape 8 : Sauvegarde du DNA
Le CharacterDNA est sauvegardé. Le joueur entre dans OWLY avec son avatar unique.

---

## 8. Fonctionnalités techniques obligatoires non mentionnées explicitement

Ces éléments sont ajoutés car indispensables à un système professionnel :

### Versionnement des assets
Chaque asset a un numéro de version. Les versions précédentes sont récupérables.
Un rollback est toujours possible.

### Format de package natif
Un export n'est pas une image. C'est un dossier compressé contenant :
- CharacterDNA.json
- Composants graphiques en PNG par calque
- Animations en JSON avec frames
- Métadonnées de licence (licence_manifest.json)
- Fichier README.md auto-généré

### Mode hors-ligne documenté
Fonctions offline : assemblage, édition pixel, export, sauvegarde DNA.
Fonctions nécessitant connexion : génération IA (optionnel), synchronisation multi-joueur.
Cette séparation est la preuve mesurable de l'indépendance.

### Test de régression visuelle automatique
À chaque modification du moteur d'assemblage, un test compare pixel par pixel
les assets créés avant et après. Aucune modification silencieuse n'est tolérée.

### Politique de licences par composant
Chaque composant externe (bibliothèque, modèle IA, dataset) a une fiche :
- Nom et version
- Licence (MIT, Apache2, GPL, CC-BY, etc.)
- Conditions d'usage commercial
- Restrictions de redistribution
- Empreinte SHA-256 du composant

---

## 9. Tableau de souveraineté technologique

| Indicateur | Phase P0-P3 | Phase P4-P5 | Phase P6 |
|---|---|---|---|
| Génération procédurale | DÉPENDANT (modèles externes optionnels) | LOCAL | LOCAL 100% |
| Édition graphique | LOCAL dès P0 | LOCAL | LOCAL |
| Assemblage des personnages | LOCAL dès P0 | LOCAL | LOCAL |
| Animations déterministes | LOCAL dès P3 | LOCAL | LOCAL |
| Génération IA composants | API externe optionnelle | Modèles ONNX locaux | Fine-tuning VGACTech |
| Export | LOCAL dès P1 | LOCAL | LOCAL |
| Dépendance API commerciale | AUCUNE obligatoire | AUCUNE | AUCUNE |
| Dataset propriétaire | Non | Partiel | Complet |

Mesure honnête : l'indépendance se déclare uniquement quand le mode hors-ligne
complet est démontré sur une infrastructure isolée.

---

## 10. Cartographie SEELE — ce qu'ils font, ce qu'on reproduit, ce qu'on dépasse

### Ce que SEELE fournit réellement (vérifié sur pages publiques, 4 nov 2026)

Pour le sprite generator :
- Description texte → spritesheet PNG + JSON frame metadata
- Styles : pixel art 8/16-bit, cartoon, chibi, isométrique, anime, sci-fi, fantasy
- Configuration : FPS 4-24, durée 1-4s, résolution 256 ou 512px
- Export compatible Unity, Unreal Paper2D, Godot 4, GameMaker, Phaser, Pygame
- Modèle de diffusion spécialisé jeu vidéo
- Licence commerciale gratuite sur tier free

Pour le character generator :
- Workflow de création de character sheet multi-vues
- Génération de briefs de production structurés
- Consistance via invariants visuels verrouillés manuellement + revue humaine
- Pas de Character DNA automatique au sens technique

Ce que SEELE NE garantit PAS :
- Cohérence anatomique entre frames d'animation
- Stabilité du personnage au changement d'équipement
- Fitting des armures sur morphologies non humanoïdes
- Génération procédurale déterministe reproductible
- Assemblage modulaire par composants contrôlés

### Ce que SPRITES 2D fait en plus
- Character DNA : identité structurée et persistante
- Moteur déterministe reproductible sans IA
- Fitting anatomique automatique pour n'importe quelle morphologie
- Compatibilité équipement/espèce vérifiée automatiquement
- Mode hors-ligne complet
- Réutilisable comme SDK dans n'importe quel projet
- Versionnement complet des assets
- Tests de régression visuelle automatiques

---

## 11. Roadmap de développement

### P0 — Fondation (priorité immédiate)
- Structure monorepo packages/
- sprites2d-schema : tous les types TypeScript
- sprites2d-core : moteur d'assemblage déterministe minimal
- sprites2d-character : gestion CharacterDNA
- sprites2d-quality : vérifications de base
- sprites2d-assets : stockage versionné
- sprites2d-sdk : API publique minimale
- Tests unitaires P0 : création DNA, validation, sérialisation

Livrable mesurable : `npx sprites2d create-character --species owl --class samurai`
retourne un CharacterDNA JSON valide avec l'ensemble des champs requis.

### P1 — Character Studio
- sprites2d-anatomy : morphologie et points d'ancrage
- sprites2d-species : espèces OWLY + hybrides
- sprites2d-pixel-editor : éditeur canvas HTML5
- sprites2d-exporters : export PNG + JSON de base
- Intégration dans /play OWLY : parcours espèce/palette/morphologie
- Prévisualisation temps réel du personnage en construction

Livrable mesurable : joueur crée hibou samouraï avec couleurs personnalisées,
le voit en 4 directions, l'exporte sans appel à une API externe.

### P2 — Équipements Modulaires
- sprites2d-equipment : vêtements, armures, armes
- Clothing Engine avec fitting adaptatif
- Armor Engine avec contraintes morphologiques
- Weapon Engine avec points de prise en main
- Interface d'équipement dans OWLY

Livrable mesurable : changement d'armure sans redessiner le personnage,
détection automatique des équipements incompatibles.

### P3 — Animation et Squelette
- sprites2d-skeleton : squelettes multi-familles
- sprites2d-animation : catalogue animations RPG
- Transitions interruptibles
- Spritesheets export

Livrable mesurable : personnage animé jouable avec 7 animations de base.

### P4 — Créatures et Environnements
- sprites2d-creatures : monstres, boss, animaux
- sprites2d-world : biomes et API d'assets
- sprites2d-tilemap : tilesets et cartes
- sprites2d-vfx : effets magiques et environnementaux

Livrable mesurable : environnement RPG complet avec personnage, monstres et décor.

### P5 — IA Locale Autonome
- sprites2d-ai-worker : service Python ONNX
- Modèles de diffusion spécialisés locaux
- Segmentation automatique de composants
- Évaluation et validation des outputs IA

Livrable mesurable : création assistée complète sans API commerciale.

### P6 — Industrialisation et SDK
- Export universel tous moteurs
- Documentation SDK complète
- Tests multi-moteurs
- Dataset VGACTech constitué
- Fine-tuning modèle propriétaire

Livrable mesurable : SPRITES 2D réutilisable dans un projet indépendant d'OWLY.

### P7 — Intégration OWLY Complète
- Connexion monde dynamique OWLY ↔ SPRITES 2D API
- Génération procédurale de monstres et décors selon l'état narratif
- World Memory Engine
- 8 presets OWLY complets avec toutes les animations

---

## 12. Critères d'acceptation par phase

### P0 acceptée si :
- CharacterDNA créé, validé, sérialisé et désérialisé sans perte
- Tests unitaires sprites2d-core : 100% PASS
- Aucune dépendance circulaire entre packages
- Mode hors-ligne documenté

### P1 acceptée si :
- 8 presets OWLY accessibles et modifiables
- 2 espèces combinables avec morphologie hybride correcte
- Couleurs modifiables en direct
- Pixels éditables individuellement
- DNA conservé identique après sauvegarde/rechargement
- 4 directions cohérentes
- Export réutilisable sans OWLY

### P2 acceptée si :
- Changement d'armure ne modifie pas le visage ni les proportions
- Équipements incompatibles refusés automatiquement
- Armes respectent les points de prise en main
- Animations conservent les équipements dans chaque frame
- Calques correctement ordonnés

### P3 acceptée si :
- 7 animations de base présentes et bouclées correctement
- Transitions vérifiées et sans rupture
- Points de collision présents
- Squelettes fonctionnels sur 3 familles morphologiques
- Prévisualisation temps réel

---

## 13. Ce qu'il ne faut jamais faire

Erreur 1 : confier à l'IA générative la géométrie, les règles d'assemblage ou les animations.
L'IA ne doit fournir que des matériaux bruts de composants.

Erreur 2 : dessiner chaque personnage séparément pour chaque classe.
Cela rend la personnalisation impossible à maintenir à grande échelle.

Erreur 3 : utiliser un squelette humanoïde universel pour toutes les espèces.
Un hibou, un dragon et un chat n'ont pas la même structure anatomique.

Erreur 4 : confondre image jolie et asset de jeu utilisable.
Un asset de jeu nécessite métadonnées, pivots, collisions, animations et compatibilité.

Erreur 5 : intégrer la logique SPRITES 2D directement dans OWLY.
La dépendance doit toujours aller de OWLY vers SPRITES 2D, jamais l'inverse.

Erreur 6 : déclarer l'indépendance avant de l'avoir mesurée.
L'indépendance se prouve par un test hors-ligne complet sur infrastructure isolée.

---

## 14. Contacts et dépôts

Dépôt principal OWLY : https://github.com/vgactech/owly
Dépôt source (fork) : https://github.com/vgactech/klerio-project-hub
Projet ARTCB : https://github.com/vgactech/artcb
Contact : vgactech@artcb.me

---

*Ce document constitue la Spec V1 de SPRITES 2D. Il sera mis à jour à chaque phase de développement
sans jamais supprimer les versions précédentes — append-only, conformément au PROTOCOLE_ARTCB.*
