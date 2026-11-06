# SPRITES 2D — Étude d'architecture, cartographie fonctionnelle et audit d'intégration OWLY

- Rapport : SPRITES2D-ARCH-001
- Date : 2026-11-04
- Dépôt cible : https://github.com/vgactech/owly
- Branche observée : main
- Commit OWLY observé avant rédaction : c581070d944f0029de0e88c86347d5c2b003d460
- Référence de synchronisation ARTCB consultée : vgactech/artcb, main, commit fe348a5dba80e1248d9d2426f8eec9673ca101bd
- Statut : étude et spécification initiale ; aucun moteur SPRITES 2D n'est déclaré implémenté ou validé.

## 1. Résumé exécutif

SPRITES 2D doit devenir un moteur universel, autonome et réutilisable de création, d'édition, d'assemblage, d'animation, de validation et d'export d'assets 2D pour les jeux et applications.

Il ne doit pas être un simple générateur d'images. Il doit produire des ressources structurées, cohérentes, modifiables et intégrables dans plusieurs moteurs de jeu.

Décision structurante : SPRITES 2D est un produit indépendant dont OWLY sera le premier client et démonstrateur. La dépendance doit aller d'OWLY vers SPRITES 2D, jamais l'inverse.

Objectifs :
- personnages humanoïdes, animaux, hybrides et fantastiques ;
- morphologies, visages, appendices, palettes et variantes ;
- vêtements et armures adaptés à l'anatomie ;
- armes, accessoires, points de prise en main et interactions ;
- créatures, monstres, boss et stades d'évolution ;
- magie, VFX, projectiles et effets environnementaux ;
- objets, bâtiments, biomes, terrains 2D/2.5D et tilesets ;
- pixel editor, calques, pivots, hitboxes et collisions ;
- rigging 2D, animations par frames et animations squelettiques ;
- génération procédurale, IA locale, contrôle qualité et exports universels.

L'indépendance visée signifie absence de dépendance obligatoire à des API SaaS commerciales pour produire, éditer, stocker et exporter les assets. Elle ne signifie pas absence de toute bibliothèque, pilote matériel ou dépendance open source.

## 2. Expertises mobilisées

- Game development 2D et architecture de moteurs.
- Pixel art, spritesheets, palettes et cohérence visuelle.
- Character design, anatomie et morphologie multi-espèces.
- Systèmes modulaires de vêtements, armures et armes.
- Animation 2D, rigging, IK/FK et retargeting.
- Génération procédurale et géométrie.
- IA générative locale et vision par ordinateur.
- Game design RPG et génération d'environnements.
- Architecture logicielle, API, SDK et formats d'échange.
- Sécurité, traçabilité des assets et conformité des licences.
- Optimisation CPU/GPU, mémoire, rendu et stockage.

## 3. Cartographie fonctionnelle de SEELE

La cartographie repose sur les pages et descriptions publiques consultées. Elle décrit les capacités annoncées et les workflows visibles ; elle ne prétend pas accéder au code, aux poids de modèles, aux datasets ou aux mécanismes propriétaires internes de SEELE.

### 3.1 A2 Sprite / Sprite Generator
Capacités publiquement présentées : description d'un sprite, choix de style et de résolution, durée/FPS, génération de spritesheet, aperçu animé et export PNG avec métadonnées JSON. Styles mentionnés : pixel art, cartoon/chibi, isométrique, anime/JRPG, science-fiction et fantasy.

À reconstruire et renforcer :
- cohérence stricte des dimensions et pivots ;
- identité stable entre frames ;
- transparence et nettoyage des pixels ;
- contrôle de palette ;
- validation de boucle ;
- métadonnées et découpage de frames ;
- historique et régénération reproductible.

Références : https://www.seeles.ai/features/tools/sprite ; https://www.seeles.ai/p/tool/sprite ; https://www.seeles.ai/features/tools/ai-sprite-sheet-generator

### 3.2 AI Character Generator
Capacités publiques : fiches de personnages, références avant/profil/dos, silhouettes, palettes, poses, expressions, règles de costume et revue de cohérence.

À reconstruire :
- identité persistante Character DNA ;
- invariants de visage, proportions, palette et silhouette ;
- références multi-vues ;
- variantes contrôlées ;
- séparation entre concept art et asset final exploitable.

Référence : https://www.seeles.ai/features/tools/ai-character-generator-for-games

### 3.3 Terrain Generation
Capacités publiques : blockouts de terrains, reliefs, routes, élévations, points d'intérêt, zones de rencontre, navigation, contraintes de collision, biomes, seeds et préparation à l'intégration dans un moteur.

Adaptation SPRITES 2D :
- génération de cartes 2D par tuiles ;
- terrain isométrique et 2.5D ;
- couches de hauteur simulée ;
- routes, zones, points d'intérêt, collisions et navigation ;
- seeds reproductibles et versions ;
- génération de variantes de biomes.

Le terrain 3D complet doit rester une extension séparée, hors périmètre du premier moteur 2D.

Référence : https://www.seeles.ai/features/create/terrain-generation

### 3.4 Skeleton Rigging
La page fournie concerne principalement le rigging 3D : hiérarchie d'os, articulation, skin weights, IK/FK, tests de déformation et export.

Adaptation 2D requise :
- rigs humanoïdes, quadrupèdes, aviaires, serpentin, arachnides et hybrides ;
- points de pivot et chaînes d'articulation ;
- IK/FK lorsque pertinent ;
- déformation par pièces/maillage ;
- animation par remplacement de frames pour préserver le pixel art ;
- tests de poses extrêmes et d'intersections.

Un rig 3D n'est pas à recopier tel quel dans le moteur 2D.

Référence : https://www.seeles.ai/features/create/skeleton-rigging

### 3.5 Motion Generation
Capacités publiques : définition de clips, locomotion, esquive, attaque, saut, réception, réaction aux dégâts, root motion, boucles, retargeting et contrôle de continuité.

Adaptation 2D :
- bibliothèque d'états et de transitions ;
- idle, marche, course, sprint, saut, chute, réception ;
- combat, blocage, parade, esquive, magie, tir ;
- réactions, altérations d'état, mort et interaction ;
- événements de gameplay, hitboxes et points de contact ;
- variantes directionnelles et validation des boucles.

Référence : https://www.seeles.ai/features/create/motion-generation

### 3.6 GS Pixel / Make a Pixel Game
Le workspace public présente un parcours de création de jeu pixel art, ainsi que la création de jeux 2D et la continuité entre assets et prototype jouable.

Adaptation :
- aperçu de scène jouable intégré au studio ;
- test du personnage et de ses animations ;
- test des armes, collisions et effets ;
- test des tilesets et cartes ;
- export d'un package d'assets, sans coupler le moteur à la logique de jeu OWLY.

Référence : https://www.seeles.ai/workspace

### 3.7 Limite de l'étude concurrentielle
Les pages publiques ne permettent pas d'affirmer que les fonctions annoncées sont toutes exécutées automatiquement ou que chaque page produit un asset final prêt à livrer. Les propres pages SEELE indiquent à plusieurs endroits que la qualité, les exports, le rigging, le retargeting, les collisions, la jouabilité et les droits nécessitent encore une revue technique ou humaine.

SPRITES 2D doit donc viser des sorties vérifiables et ne pas confondre brief de génération, concept visuel et asset de production.

## 4. Périmètre fonctionnel proposé : 18 modules

1. Character DNA : identité, proportions, caractéristiques visuelles.
2. Species Engine : espèces, hybrides et familles anatomiques.
3. Clothing Engine : vêtements, patrons, couches et compatibilité.
4. Armor Engine : protections, ouvertures anatomiques et fitting.
5. Weapon Engine : armes, prises en main, pivots et hitboxes.
6. VFX Engine : magie, projectiles, impacts et effets.
7. Skeleton Engine : squelettes 2D, articulations et contraintes.
8. Animation Engine : frames, clips, états et transitions.
9. Creature Engine : animaux, monstres, boss et variantes.
10. World Engine : biomes, objets et environnements.
11. Tilemap Engine : tilesets, cartes, couches et collisions.
12. Terrain Engine : génération de terrains 2D/2.5D.
13. Pixel Editor : dessin et édition pixel par pixel.
14. Layer Engine : ordre des calques, masques et composition.
15. AI Generation Engine : génération assistée et modèles locaux.
16. Quality Engine : contrôles visuels et techniques.
17. Asset Manager : catalogue, versions, dépendances et licences.
18. Export SDK : API et adaptateurs multi-moteurs.

Modules transversaux complémentaires : palettes, éclairage, ombres, parallax, particules, hitboxes, pivots, caméra, localisation, undo/redo, autosave, collaboration, batch generation, optimisation et traçabilité des licences.

## 5. Architecture cible

### 5.1 Principe
Séparer strictement :
- interface et studio ;
- contrats de données et API ;
- moteur déterministe ;
- moteur IA local ;
- stockage et versionnement ;
- validation qualité ;
- adaptateurs d'export.

Le moteur central ne doit pas dépendre de React ni de l'application OWLY. Le studio peut utiliser React/TypeScript ; le moteur doit rester utilisable en bibliothèque, en CLI ou derrière une API locale.

### 5.2 Packages envisagés
- packages/sprites2d-schema
- packages/sprites2d-core
- packages/sprites2d-character
- packages/sprites2d-anatomy
- packages/sprites2d-equipment
- packages/sprites2d-animation
- packages/sprites2d-creatures
- packages/sprites2d-world
- packages/sprites2d-pixel-editor
- packages/sprites2d-renderer
- packages/sprites2d-assets
- packages/sprites2d-quality
- packages/sprites2d-sdk
- packages/sprites2d-exporters
- apps/sprites2d-studio
- services/sprites2d-ai
- services/sprites2d-generation-worker
- services/sprites2d-asset-storage
- docs/sprites2d/

Cette arborescence est une proposition ; elle n'a pas encore été créée.

### 5.3 Moteur déterministe
Les règles anatomiques, pivots, assemblages, calques, palettes, contraintes d'équipement et transformations doivent être exécutables sans IA. À paramètres et seed identiques, les opérations procédurales doivent être reproductibles.

### 5.4 Moteur IA local
Évaluer PyTorch, ONNX Runtime et des pipelines spécialisés auto-hébergés. ComfyUI peut servir au prototypage de workflows, mais ne doit pas devenir une dépendance SaaS ni le contrat interne du moteur.

L'IA doit assister la conception, la segmentation, la génération de variantes et le nettoyage. Elle ne doit pas remplacer les règles de structure, de cohérence et de validation.

### 5.5 Éditeur pixel
Canvas de pixels, calques, palettes, sélection, remplissage, déplacement, outils de dessin, édition multi-frames, timeline, zoom, onion skin, comparaison de versions, aperçu à l'échelle réelle, autosave et undo/redo.

### 5.6 Formats
Formats d'échange à prendre en charge ou à étudier : PNG RGBA, WebP, JSON, SVG, Aseprite et atlas de sprites. glTF est réservé à une extension future pour les données 3D. Le format natif SPRITES 2D devra être un package versionné contenant assets, métadonnées, pivots, animations, points d'attache, dépendances, licences et empreintes.

### 5.7 Adaptateurs
Prévoir des adaptateurs pour Godot, Unity 2D, Unreal Paper2D, GameMaker, Phaser et moteurs personnalisés. L'export doit être testé dans le moteur cible, pas seulement déclaré compatible.

## 6. Système de personnage modulaire

### 6.1 Character DNA
Chaque personnage doit posséder un identifiant stable et un document structuré :
- espèce principale et secondaire ;
- famille de squelette ;
- proportions et morphologie ;
- tête, visage, yeux et oreilles ;
- queue, ailes, cornes et appendices ;
- fourrure, plumes, écailles ou peau ;
- palette et motifs ;
- silhouette et style ;
- équipements ;
- points d'attache ;
- animations et versions.

### 6.2 Familles anatomiques
Ne pas supposer qu'un squelette unique convient à toutes les espèces. Prévoir des familles de rigs et des règles d'hybridation : bipède, quadrupède, aviaire, serpentin, arachnide et multi-membres.

### 6.3 Vêtements et armures
Utiliser des zones anatomiques, gabarits, points d'attache, masques, ouvertures, contraintes de volume, couches de profondeur et règles de compatibilité. Les cas extrêmes peuvent nécessiter des variantes dessinées dédiées plutôt qu'un fitting automatique naïf.

### 6.4 Armes
Chaque arme doit déclarer points de prise, orientation, équilibre, dimensions, mains requises, hitbox, animation et compatibilité morphologique. Synchroniser les deux mains pour les armes à deux mains.

### 6.5 Vues
Prendre en charge face, dos, profils, trois-quarts, dessus et isométrie, avec une identité persistante. La cohérence entre vues doit être contrôlée.

## 7. Intégration OWLY

Les huit archétypes initiaux à préserver comme presets visuels :
- OWLY Samurai ;
- OWLY Cyberpunk ;
- OWLY Mage ;
- OWLY Archer ;
- OWLY Knight ;
- OWLY Pirate ;
- OWLY Ninja ;
- OWLY Tank.

Ils ne doivent pas devenir huit moteurs différents. Ils sont des presets de direction artistique et d'équipement construits sur le même Character DNA.

Parcours utilisateur :
1. choisir une espèce ;
2. choisir éventuellement une deuxième espèce ;
3. choisir les couleurs et motifs ;
4. régler la morphologie ;
5. choisir une classe ;
6. équiper vêtements et armure ;
7. choisir armes et accessoires ;
8. prévisualiser les animations et pouvoirs ;
9. sauvegarder le personnage et son historique.

Classes initiales envisageables : guerrier, mage, archer, assassin, paladin, druide, invocateur, ingénieur, prêtre, nécromancien, barde, berserker et classes personnalisées.

## 8. Monde dynamique : frontière de responsabilité

SPRITES 2D fournit les assets et leurs variantes. OWLY conserve l'état du monde, l'histoire, les décisions des joueurs, les factions, les quêtes et les événements.

Prévoir une interface de contrat entre les deux :
- événement de monde ;
- demande d'asset ;
- asset_id et version ;
- seed et paramètres ;
- état de validation ;
- disponibilité ;
- événement de livraison.

Trois niveaux :
1. procédural immédiat pour les modifications fréquentes ;
2. assets préparés et mis en cache pour les événements probables ;
3. génération IA asynchrone pour les contenus rares ou inédits.

Ne pas déclencher une génération IA lourde à chaque action du joueur. Le monde doit rester jouable si le worker IA est indisponible. La mémoire du monde et ses événements appartiennent à OWLY, pas au moteur graphique.

## 9. Agents spécialisés

Agents proposés : Art Director, Character Designer, Anatomy Specialist, Species Designer, Clothing Designer, Armor Designer, Weapon Designer, Animator, Rigging Specialist, Creature Designer, Environment Artist, Pixel Artist, VFX Artist, Level Designer, Asset Engineer, Visual QA, Licensing Agent et Optimization Agent.

Les tâches peuvent être parallélisées lorsque les dépendances le permettent. La validation finale doit être effectuée par des contrôles automatiques et des critères d'acceptation ; un agent ne peut pas s'auto-certifier sur la seule base de sa génération.

## 10. Qualité et critères d'acceptation

Indicateurs distincts :
- Visual Fidelity ;
- Anatomical Consistency ;
- Animation Quality ;
- Pixel Integrity ;
- Equipment Compatibility ;
- Runtime Readiness ;
- License Compliance.

Contrôles :
- dimensions et pivots cohérents ;
- transparence correcte ;
- palette conforme ;
- absence de pixels parasites ;
- silhouette stable ;
- équipement compatible ;
- frames alignées ;
- boucles sans rupture visible ;
- transitions vérifiées ;
- absence de disparition d'équipement ;
- hitboxes et collisions cohérentes ;
- tilesets sans raccords incorrects ;
- navigation et chemins testés ;
- export réellement importable.

Ne pas fusionner ces indicateurs en un score global trompeur. Un asset peut être esthétiquement réussi et techniquement inutilisable.

## 11. Roadmap proposée

P0 — Fondation : monorepo/workspaces, contrats, Character DNA, stockage, versionnement, API et tests.

P1 — Character Studio : huit presets OWLY, espèces, hybrides, morphologie, palettes, pixel editor, prévisualisation et quatre directions de base.

P2 — Equipment Studio : vêtements, armures, casques, bottes, armes, points d'attache, fitting et compatibilité.

P3 — Animation Studio : rigs, clips, états, transitions, combat, magie, export spritesheets et validation.

P4 — Creature & World Studio : monstres, boss, animaux, biomes, terrains 2D/2.5D, bâtiments, objets et tilesets.

P5 — Local Generation Studio : modèles locaux, segmentation, variantes, évaluation, datasets autorisés et entraînement spécialisé.

P6 — Industrialisation : SDK, exports, documentation, optimisation, sécurité, licences, tests multi-moteurs et distribution.

P7 — Intégration OWLY : avatar creator, presets, personnages, monstres, décors et contrat avec le monde dynamique.

Chaque phase doit produire un livrable exécutable et testé. Aucun statut DONE ne doit être déclaré sans preuve.

## 12. Indépendance et souveraineté

Objectif final :
- génération procédurale locale ;
- édition et assemblage locaux ;
- animations déterministes locales ;
- stockage maîtrisé ;
- export sans service externe ;
- modèles IA auto-hébergés ;
- données d'entraînement traçables et autorisées ;
- SDK sans dépendance à OWLY ;
- mode déconnecté permettant de créer, modifier, sauvegarder et exporter.

La stratégie réaliste est de construire d'abord le moteur procédural propriétaire, puis d'intégrer des modèles ouverts exécutables localement, constituer un dataset autorisé et entraîner progressivement des modèles spécialisés. Recréer immédiatement un modèle de pointe depuis zéro serait un mauvais ordre de priorité.

## 13. Audit du dépôt OWLY au 2026-11-04

Dépôt public : https://github.com/vgactech/owly
Branche : main
Commit observé : c581070d944f0029de0e88c86347d5c2b003d460
Arbre consulté : 142 entrées.

Éléments constatés :
- README : application RPG hibou, sélecteur de classe, mascotte et chat IA ;
- React 19 et TypeScript ;
- TanStack Start et TanStack Router ;
- Vite ;
- tests Vitest ;
- route authentifiée /play ;
- composants et infrastructure de mémoire/outbox ;
- fichiers et spécifications encore marqués Klerio ;
- aucune arborescence sprites2d existante dans l'arbre consulté ;
- aucun moteur Character DNA, pixel editor, rigging ou asset pipeline identifié dans l'inventaire.

Points à traiter avant ou pendant l'implémentation :
1. Le dépôt contient à la fois package-lock.json et bun.lock ; fixer une stratégie de gestionnaire de paquets et de workspaces avant d'ajouter les packages.
2. Aucun fichier LICENSE racine n'a été observé dans l'inventaire consulté ; définir les licences du code, des assets et des modèles avant distribution.
3. Un fichier .env est présent dans l'arbre Git. Son contenu n'a pas été lu dans cet audit. Vérifier qu'il ne contient aucun secret ; si un secret y a été versionné, le révoquer et le renouveler plutôt que se limiter à supprimer le fichier.
4. Préserver les routes, l'authentification, les composants et les fonctions existantes OWLY/Klerio.
5. Ajouter SPRITES 2D comme frontière de packages indépendante, sans réécriture générale de l'application.

Le README et le brief handoff existant imposent notamment de préserver l'authentification, de ne pas versionner de secrets et de garder les données privées isolées. Ces exigences restent applicables à l'intégration.

## 14. Synchronisation ARTCB et limites de traçabilité

Référence consultée : https://github.com/vgactech/artcb
Commit main observé : fe348a5dba80e1248d9d2426f8eec9673ca101bd.

Les fichiers .artcb/task_ledger.yaml et .artcb/session_continuation.yaml ont été consultés. Leur horodatage interne (30 septembre et 18 septembre 2026 respectivement) est antérieur au commit main observé du 25 octobre 2026. Ils ne peuvent donc pas être considérés comme un état complet et actuel de toutes les tâches ARTCB au 4 novembre. Ne pas déclarer les anciens chantiers terminés sur la seule base de ces fichiers ; une réconciliation du ledger avec les commits, issues et tests récents reste nécessaire.

Aucune modification n'a été apportée au dépôt ARTCB dans le cadre de ce rapport.

## 15. Risques et décisions à garder visibles

- La génération IA seule ne garantit pas la cohérence multi-frame ou multi-vue.
- Le fitting universel de vêtements sur toutes les morphologies n'est pas réaliste sans familles anatomiques et variantes dédiées.
- Le rigging 2D doit offrir à la fois animation par pièces et remplacement de frames.
- Les générations lourdes ne doivent pas bloquer le gameplay.
- Les droits des modèles, datasets et assets doivent être contrôlés avant toute distribution.
- Le mode hors ligne doit être démontré par des tests réseau, et non par une simple option d'interface.
- La compatibilité moteur doit être prouvée par import et lecture d'un asset dans le moteur cible.

## 16. Décisions recommandées

1. Valider SPRITES 2D comme produit autonome et premier fournisseur graphique d'OWLY.
2. Retenir Character DNA comme contrat central du personnage.
3. Retenir le moteur déterministe comme fondation et l'IA locale comme accélérateur.
4. Préserver les huit presets OWLY dans le système commun.
5. Séparer la mémoire du monde (OWLY) de la production d'assets (SPRITES 2D).
6. Commencer par un vertical slice P0/P1 : un personnage complet, personnalisable, éditable pixel par pixel, sauvegardable, animé et exportable.
7. Ne déclarer l'indépendance opérationnelle qu'après un test complet sans API SaaS externe.

## 17. Sources publiques consultées

- SEELE Workspace : https://www.seeles.ai/workspace
- SEELE Sprite Generator : https://www.seeles.ai/features/tools/sprite
- SEELE Sprite Tool : https://www.seeles.ai/p/tool/sprite
- SEELE AI Character Generator : https://www.seeles.ai/features/tools/ai-character-generator-for-games
- SEELE Terrain Generation : https://www.seeles.ai/features/create/terrain-generation
- SEELE Skeleton Rigging : https://www.seeles.ai/features/create/skeleton-rigging
- SEELE Motion Generation : https://www.seeles.ai/features/create/motion-generation
- SEELE Sprite Sheet Generator : https://www.seeles.ai/features/tools/ai-sprite-sheet-generator
- Voidless 2D Sprite Rigging : https://voidless.dev/2d-sprite-rigging

## 18. État de livraison du présent rapport

- Étude fonctionnelle : réalisée sur les pages publiques identifiées.
- Audit structurel OWLY : réalisé sur l'arbre Git et les fichiers de référence consultés.
- Proposition d'architecture : documentée.
- Roadmap : proposée.
- Code moteur : non implémenté.
- Interface studio : non implémentée.
- Tests de production : non exécutés.
- Indépendance opérationnelle : non démontrée.
- Certification de qualité : non revendiquée.

Ce rapport constitue le cahier des charges initial et le point de départ de l'implémentation. Il ne constitue pas une preuve que SPRITES 2D existe déjà ou que les critères de production sont atteints.
