# MAVAI — Audit d'intégration de Teardown et des références de simulation interactive

Date : 2026-11-08
Dépôt cible : https://github.com/vgactech/MAVAI
Dépôt de référence principal : https://github.com/elvarofficial/teardown
Statut : cadrage technique et plan d'audit — aucune intégration de code ni dépendance installée dans cette étape.

## 1. Décision produit

La référence Teardown est confirmée par le propriétaire du projet. Elle devient la référence fonctionnelle principale pour une nouvelle capacité native de MAVAI : **MAVAI Simulation Studio**.

Les projets complémentaires à étudier sont :
- Teardown — https://github.com/elvarofficial/teardown : machines interactives démontables, commandes, vues en coupe, panneaux et visites guidées.
- Machine Skill — https://github.com/AirsupHQ/machine-skill : modèles mécaniques et solveurs physiques spécialisés.
- Living Anatomy — https://github.com/joonsp/threejs-skills : simulations anatomiques et physiologiques interactives en Three.js.
- Anatomy — https://github.com/jorgealves/anatomy-skill : illustrations techniques isométriques, SVG, WebGL et 3D expérimentale.

Ces dépôts sont des références d'architecture et de méthodes. Ils ne doivent pas être fusionnés aveuglément, ni intégrés comme dépendances d'exécution avant audit des fichiers, des licences, de la sécurité et des tests.

## 2. Synchronisation et périmètre réellement inspecté

Le README du dépôt cible vgactech/MAVAI a été récupéré sur la branche par défaut. Son SHA de blob est 91276e80bf3f2b6ab3053a6a771fbac67e843a78.

Le README décrit :
- Frontend React, TanStack Router/Start et Vite.
- Chat IA multimodal.
- Packages Sprites2D pour animation, QA frame par frame, schéma et SDK.
- Un backend MAVAI FastAPI annoncé dans le dossier backend.
- Une connexion déclarée à ARTcB.

Le présent contrôle n'est pas un audit exhaustif de tous les fichiers du dépôt MAVAI. Il ne permet donc pas d'affirmer que les composants décrits dans le README sont tous opérationnels. Avant tout développement, l'agent doit vérifier la branche, le commit courant, l'arborescence réelle, les manifestes, les tests, les routes et les conventions de l'application.

### Sources inspectées pour Teardown

- README.md, blob SHA : ba138fb0f6cfd3cd62ac5ed021e2c16374dad645
- SKILL.md, blob SHA : 9505e4aa15caa097260cd982d1a91312dd45859a
- LICENSE, blob SHA : ce935de9b08f13fc0ee7135ebe31044e7c2ef733

Le README et le SKILL.md indiquent notamment Node.js 20+, Three.js, Playwright Chromium, un runtime de simulation, une chaîne de capture vidéo et des exemples V8, train d'atterrissage Cessna 337 et mécanisme de marche Strandbeest. La licence du dépôt est MIT et mentionne également les crédits de composants issus de whaleyxbt/claude-motion. Les obligations de conservation des notices et l'historique des composants réutilisés doivent être respectés.

## 3. Ce que Teardown apporte concrètement

Son principe architectural est plus important que son apparence graphique.

1. Un modèle cinématique ou physique indépendant de Three.js calcule les états mécaniques.
2. Une entrée de simulation (angle de vilebrequin, course, vent, etc.) détermine la pose des pièces et les valeurs affichées.
3. La géométrie 3D représente cet état.
4. Les jauges, graphiques, libellés et panneaux lisent le même état calculé.
5. Les commandes permettent d'isoler, démonter, découper ou observer des sous-ensembles.
6. Une visite guidée peut piloter la caméra et les modes d'observation.
7. Le même modèle peut alimenter un rendu temps réel et une capture déterministe image par image.

Règle structurante à reprendre : **une seule source de vérité pour la simulation, la géométrie, les instruments, les explications et le rendu vidéo**. Il faut éviter les jauges décoratives indépendantes du modèle.

Le SKILL.md insiste également sur l'utilisation de dimensions réelles et de documents de référence, sur la comparaison image par image, sur le contrôle des collisions, sur la reproductibilité des rendus et sur les essais sur GPU intégré. Ces pratiques sont à transformer en exigences QA MAVAI.

## 4. Complémentarité des quatre projets

### P0 — Teardown : expérience interactive et chaîne de rendu

À étudier et adapter :
- runtime Three.js et gestion de scène ;
- architecture machine partagée / page interactive / séquence film ;
- commandes par sous-système ;
- vues éclatées, coupes, rayons X et isolation de pièces ;
- caméra, visites guidées et contrôle manuel ;
- synchronisation des panneaux et de l'animation ;
- capture de séquences et génération de planches de contrôle.

### P0 — Machine Skill : méthodes de calcul mécanique

À étudier :
- séparation stricte des solveurs par famille de machine ;
- calcul de moteurs thermiques et cycles thermodynamiques ;
- courbes de pompes et compresseurs ;
- cinématique, dynamique et modèles de défaillance ;
- présentation des équations et hypothèses ;
- traçabilité des paramètres, unités et domaines de validité.

Ne pas considérer les chiffres des démonstrations comme des résultats validés par MAVAI. Chaque solveur doit avoir des références, tests numériques, tolérances et cas de validation indépendants.

### P1 — Living Anatomy : systèmes biologiques

À étudier :
- représentation d'organes et de systèmes ;
- états physiologiques et paramètres d'entrée ;
- animations pilotées par modèles ;
- graphiques et visualisations explicatives ;
- séparation entre modèle pédagogique, modèle physiologique validé et données médicales.

Une simulation anatomique pédagogique ne doit jamais être présentée comme un outil de diagnostic ni comme une simulation médicale certifiée sans validation appropriée.

### P2 — Anatomy : figures techniques et documentation

À étudier :
- génération de figures isométriques ;
- composants SVG autonomes ;
- intégration WebGL localisée ;
- figures explicatives embarquées dans la documentation ;
- export HTML autonome et composants React.

Le mode 3D de ce projet est annoncé comme bêta : il doit rester expérimental jusqu'à validation de ses performances et de sa robustesse.

## 5. Architecture cible proposée pour MAVAI

Créer un domaine fonctionnel indépendant, raccordé au frontend existant :

**MAVAI Simulation Studio**
- Simulation Registry : registre des familles de simulation, versions, unités, solveurs et capacités.
- Reference Manager : plans, manuels, photos, dimensions, provenance et droits d'utilisation.
- Model Core : modèles mathématiques purs, sans dépendance au rendu graphique.
- Geometry Engine : construction et mise à jour des pièces 3D.
- Interaction Engine : sélection, démontage, vues en coupe, isolation et commandes.
- Instrumentation Engine : jauges et graphiques issus de l'état du solveur.
- Tour Director : visites guidées et scénarios pédagogiques.
- Capture Engine : rendu déterministe, images de contrôle et vidéo.
- Validation Engine : tests des équations, contraintes géométriques, cohérence des unités et QA visuelle.
- Export Engine : HTML autonome, médias et rapport technique.

Flux logique :

Références et paramètres → modèle scientifique → état de simulation → géométrie + jauges + explications → contrôles interactifs → capture et export → validation et rapport.

Le LLM et les agents MAVAI doivent planifier, rechercher les références, générer des propositions de modèles et expliquer les résultats. Ils ne doivent pas inventer des valeurs physiques ni remplacer les solveurs numériques. Les solveurs déterministes restent responsables des calculs.

## 6. Intégration avec l'architecture générale MAVAI

- Frontend : intégrer le Studio comme route et espace de travail cohérent avec l'application React existante, après examen des conventions TanStack et des composants UI.
- Three.js : candidat prioritaire pour le rendu 3D, avec évaluation d'une éventuelle couche React Three Fiber uniquement si elle s'intègre réellement au projet et ne duplique pas le runtime.
- Simulation : privilégier des modules TypeScript purs et testables pour le premier prototype. Déplacer ultérieurement les calculs coûteux vers WebAssembly, C/C++ ou Rust si les benchmarks le justifient.
- Agents : agent de recherche documentaire, agent de modélisation, agent de calcul, agent 3D, agent QA scientifique et agent de documentation.
- Mémoire : conserver les références, hypothèses, versions de solveurs, paramètres, résultats, décisions et provenance dans le système de mémoire MAVAI ; ne pas supposer que LUMVORAX2 est prêt sans tests de persistance et de récupération.
- ARTcB : utiliser les contrats d'API et d'identité existants après vérification ; ne pas coupler directement le moteur de simulation au stockage interne de LUMVORAX2.
- Exports : séparer les artefacts autonomes des composants applicatifs et documenter les ressources externes éventuelles.

## 7. Exigences de qualité non négociables

Chaque simulation publiée doit présenter :
- son objectif et son niveau de fidélité (illustratif, pédagogique, ingénierie préliminaire ou validé) ;
- les sources documentaires et la provenance des dimensions ;
- les unités, hypothèses, paramètres et équations ;
- le domaine de validité et les limites connues ;
- les tests numériques et leurs résultats ;
- les tests géométriques de collisions et d'assemblage ;
- les contrôles de cohérence entre solveur, pièces, jauges et graphiques ;
- les performances mesurées sur GPU dédié et intégré ;
- la version du modèle et la reproductibilité de la capture.

Un rendu visuellement convaincant n'est pas une preuve d'exactitude scientifique.

## 8. Plan d'exécution recommandé

### Étape 0 — Audit avant intégration
1. Synchroniser le dépôt MAVAI et enregistrer le commit exact.
2. Inspecter l'arborescence frontend, backend, tests et packages.
3. Examiner les versions React, TypeScript, Vite, Three.js éventuel et dépendances 3D.
4. Lire intégralement les fichiers d'entrée de Teardown, les modules runtime, les trois exemples, le script de build et la capture.
5. Examiner les dépendances et composants crédités, dont claude-motion.
6. Auditer Machine Skill, threejs-skills et Anatomy selon le même protocole.
7. Produire une matrice réutiliser / adapter / réécrire / exclure avec justification et licence.

### Étape 1 — Prototype mécanique de référence
Construire un moteur V8 interactif :
- vilebrequin, pistons, bielles et soupapes ;
- ordre d'allumage configurable et documenté ;
- animation synchronisée avec l'angle du vilebrequin ;
- mode transparent, coupe et isolation de cylindres ;
- jauges et diagrammes calculés à partir du modèle ;
- visite guidée et contrôle manuel ;
- export HTML et capture de séquence.

Commencer par un modèle cinématique vérifiable. Ajouter ensuite la thermodynamique et la combustion seulement lorsque les données et les validations sont disponibles.

### Étape 2 — Validation et industrialisation
- tests unitaires des solveurs ;
- tests de propriétés et cas limites ;
- vérification des unités ;
- tests géométriques ;
- capture automatisée et comparaison de planches d'images ;
- tests de performance ;
- validation des exports hors ligne ;
- documentation et provenance.

### Étape 3 — Extension des domaines
Après validation du socle mécanique :
- pompes, turbines, compresseurs et mécanismes ;
- anatomie et physiologie pédagogique ;
- figures techniques et documentation interactive ;
- scénarios de formation et simulations de systèmes plus complexes.

## 9. Critères d'acceptation du premier prototype

Le prototype ne sera pas considéré comme terminé tant que :
1. Les pièces animées et les jauges ne proviennent pas du même état calculé.
2. Le solveur passe des tests numériques documentés.
3. Les dimensions et paramètres sont traçables.
4. Les vues éclatées et coupes ne créent pas de géométrie incohérente.
5. La simulation est reproductible à paramètres et version identiques.
6. Les captures image par image sont inspectées automatiquement et visuellement.
7. Les interactions fonctionnent au clavier et à la souris.
8. Le mode dégradé GPU est mesuré.
9. L'export autonome fonctionne sans réseau lorsque c'est annoncé.
10. Les licences et crédits de tous les composants réutilisés sont conservés.

## 10. Sécurité et autonomie des agents

Les agents peuvent analyser, proposer, construire dans des espaces de travail isolés, exécuter des tests et corriger leurs propres artefacts dans les limites de leurs permissions explicites. Ne pas leur donner un accès root global ni supprimer les validations des actions destructrices ou de déploiement. Utiliser des permissions minimales par tâche, des environnements reproductibles, des journaux et des sauvegardes. Cette séparation protège le dépôt, les données et le serveur tout en permettant une automatisation élevée.

## 11. Instructions immédiates à l'agent de développement

1. Ne pas installer Teardown ni copier des fichiers dans MAVAI avant d'avoir terminé l'audit de sécurité, de dépendances et de licences.
2. Ne pas réécrire l'architecture existante sans cartographie des routes, packages, conventions et tests.
3. Auditer les quatre dépôts sources et livrer un tableau précis des fichiers et composants pertinents.
4. Proposer un plan d'intégration incrémental avec coûts, risques, compatibilités et critères de sortie.
5. Préparer un prototype V8 séparé, sans perturber le chat, Sprites2D ou les fonctions déjà présentes.
6. Faire valider le contrat d'architecture avant toute modification structurelle.
7. Fournir des preuves de tests et des captures ; ne jamais déclarer une simulation scientifiquement exacte sur la seule base de son apparence.

## Conclusion

Teardown est confirmé comme référence principale pour l'expérience de simulation 3D interactive. Machine Skill apporte la discipline des solveurs mécaniques. Living Anatomy ouvre le domaine biologique. Anatomy complète l'illustration technique et la documentation.

La valeur de MAVAI ne sera pas de juxtaposer quatre projets open source, mais de construire un moteur cohérent, traçable et validable, intégré à son architecture multi-agents et à ses outils de production.

**Priorité immédiate : audit complet des sources, puis prototype V8 autonome et mesurable.**

Aucune modification du code applicatif n'est autorisée par ce rapport : seule la documentation de cadrage doit être ajoutée à ce stade.
