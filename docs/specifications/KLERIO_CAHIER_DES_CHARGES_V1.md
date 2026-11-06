# Klerio — Cahier des charges produit, technique et UI

Version 1.6 — 28 octobre 2026 — Statut : proposition de référence pour réalisation.
Dépôt : vgactech/klerio-project-hub. Périmètre de cette livraison : spécifications et maquette UI, sans activation des services IA, voix, OCR ou mémoire.

## 1. Vision et résultat attendu

Klerio est un interlocuteur personnel autonome présenté comme une messagerie : l’utilisateur écrit, parle, scanne ou joint un fichier. L’agent comprend la demande, recherche les éléments utiles, propose les choix indispensables dans le fil, exécute les tâches autorisées, produit les livrables, classe les informations et permet de retrouver leurs sources.

L’écran principal demeure un chat. Les tableaux, formulaires, documents, calendriers et cartes apparaissent dans la conversation selon le besoin, puis se replient sans faire disparaître leurs données. L’utilisateur peut demander « retrouve », « explique », « corrige », « arrête », « montre les sources » ou « reprends ».

### Invariants

1. Aucun changement d’outil imposé pour accomplir un parcours courant.
2. Toute réponse utile existe en texte ; en mode vocal, la voix accompagne le texte.
3. Tout travail accepté possède un identifiant et un état durable.
4. Aucune annonce « enregistré dans GitHub » avant confirmation effective de l’écriture.
5. Les conversations originales ne sont pas remplacées par des résumés.
6. Les documents originaux restent distincts des OCR, annotations et versions générées.
7. Chaque relation créée est horodatée et rattachée à ses sources.
8. Aucune promesse de mémoire infinie ou d’expertise infaillible.
9. L’utilisateur peut interrompre, corriger et contrôler la portée de l’autonomie.
10. Les données d’utilisateurs différents sont isolées.

## 2. État vérifié du dépôt

Inspection du 27 octobre 2026 : dépôt privé ; branche principale main ; projet relié à Lovable. AGENTS.md demande de préserver l’historique publié et de maintenir une branche fonctionnelle.
Le projet utilise React, TypeScript, TanStack Start/Router, Vite, Tailwind, des composants Radix et Supabase. Les routes consultées fournissent une page d’accueil, une authentification et un tableau de bord minimal avec déconnexion.
Les fonctionnalités d’agent, de chat métier, de voix, de scan, de classement et de mémoire ne sont pas implémentées dans les routes inspectées. Aucun audit complet de sécurité ni test de production n’a été réalisé ici.

La conception doit prolonger le routeur existant et les composants accessibles, préserver la connexion existante et ne pas réécrire l’historique Git. La présence de fichiers de configuration ne prouve pas leur innocuité : auditer la gestion des secrets avant production, sans recopier leur contenu dans la documentation.

## 3. Interprétations et hypothèses explicites

- Le passage « raisonnement et actions ... journaliser » est interprété comme une demande de journal exhaustif des échanges, actions et justifications communicables. Si l’intention était de ne rien journaliser, elle contredirait la mémoire demandée : cette interprétation doit être confirmée avant d’activer la collecte réelle.
- « Sans résumé » signifie conserver les sources intégrales. Des index et descriptions dérivés peuvent accélérer la recherche, mais ne remplacent jamais les originaux et sont identifiés comme dérivés.
- Le raisonnement interne privé d’un modèle n’est pas une donnée exportable garantie. Le produit conserve les justifications explicites utiles : objectif, faits utilisés, hypothèses, décision, outil, résultat et limites.
- « Autonome en arrière-plan » nécessite un serveur et des exécutants durables. Une page web fermée ne suffit pas à maintenir les tâches.
- GitHub est le référentiel documentaire demandé. Une file de travail et des index reconstruisibles assurent l’exécution et la recherche. Ils ne constituent pas une seconde source documentaire cachée.
- La première version vise un utilisateur propriétaire sur téléphone et ordinateur. L’isolation multiutilisateur est prévue dès la conception ; la collaboration est une extension.
- Français par défaut. Langue de voix et de transcription sélectionnables ; le changement de langue ne modifie pas les archives.
- Les objectifs chiffrés ci-dessous sont des cibles de recette, pas des performances déjà mesurées.

## 4. Périmètre et priorités

| Lot                     | Contenu                                                                                 | Condition de sortie                                                 |
| ----------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| P0 Fondation            | identité, chat texte, pièces jointes, événements durables, classement, GitHub, reprise  | un parcours complet et restaurable sans perte ni doublon            |
| P1 Multimodal           | conversation vocale, silence, interruption, caméra, OCR, questions interactives         | parcours accessibles sur navigateurs mobiles et bureau testés       |
| P2 Interface adaptative | registre de composants, tableaux, documents, chronologies, formulaires et carte mémoire | schémas validés et données préservées au changement de présentation |
| P3 Robustesse           | tâches longues, quotas, reprise après incident, export, restauration, alertes et coûts  | incidents simulés résolus avec preuves                              |
| P4 Extensions           | plusieurs espaces, partage, outils spécialisés, automatisations choisies                | permissions et migrations validées                                  |

Exclus de la livraison de spécification : vrai moteur IA, temps réel branché, OCR branché, déploiement, facturation et alimentation automatique des archives personnelles.

## 5. Profils et expertises

Le propriétaire échange et contrôle les autorisations. L’agent agit dans les limites configurées. L’exécutant serveur effectue les opérations et produit les événements. L’administrateur technique accède seulement aux données nécessaires à l’exploitation.

L’agent identifie les domaines pertinents : produit, UX, développement, données, documents, sécurité, métiers spécialisés. Une ligne dans le fil annonce les domaines au démarrage d’une tâche et lors d’un changement significatif, sans notification à chaque jeton.
Exemple : « Domaines mobilisés : analyse documentaire, classement et comparaison. »
Les domaines annoncés décrivent les capacités utilisées, jamais un diplôme, une certification ou une garantie de vérité. Pour une décision spécialisée sensible, afficher les incertitudes et permettre une vérification humaine.

## 6. Écran principal et composition

### Surfaces permanentes

- En-tête discret : avatar Klerio, nom, état de la tâche, menu accessible.
- Fil chronologique : messages utilisateur alignés à droite, messages agent à gauche, séparateurs de date, livrables et cartes.
- Zone de saisie fixe en bas : texte multiligne, contrôle de mode, envoyer ; bouton arrêter pendant une génération.
- Aucun tableau de bord supplémentaire imposé. Historique, catégories, mémoire, sources et préférences s’ouvrent à la demande dans une feuille superposée.
- Sur grand écran, le chat reste centré (largeur cible 760 px) ; un panneau documentaire facultatif ne remplace pas le fil. Sur mobile, ce panneau devient une feuille plein écran.

### Contrôle coulissant demandé

Un seul bouton de mode physiquement déplaçable à trois positions : gauche = Vocal, centre = Texte, droite = Documents. L’utilisateur presse le bouton puis le déplace ; une simple barre de progression ou un curseur de plage standard ne satisfait pas cette exigence.
Le glissement est limité à ce contrôle pour éviter de perturber le défilement du fil. Chaque position possède aussi un bouton cliquable et une commande clavier. Un geste ne donne jamais implicitement permission d’utiliser la caméra ou le micro.

| Position           | Comportement                                                   | Retour                                                     |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Gauche : Vocal     | ouvrir les contrôles voix puis demander le micro si nécessaire | centre arrête la capture et garde la transcription validée |
| Centre : Texte     | saisie et envoi classiques                                     | toujours disponible                                        |
| Droite : Documents | ouvrir Scanner / Fichier local / Photos selon plateforme       | annuler conserve le brouillon et revient au centre         |

Le bouton Envoyer est intégré à l’intérieur de la zone de saisie, sur sa droite, et se déplace lui-même vers la gauche sous le doigt ou la souris. Le relâchement au-delà du seuil valide l’envoi. Un geste incomplet ou annulé conserve le brouillon. Clic et clavier demeurent des alternatives accessibles ; ne pas ajouter de bouton Envoyer extérieur. Entrée envoie sur bureau ; Maj+Entrée ajoute une ligne. Sur mobile, retour à la ligne dans le clavier et envoi explicite. Le comportement doit être configurable. Une capture en cours n’est pas envoyée accidentellement.

### Système visuel

Direction en vigueur : messagerie bronze moderne et futuriste avec la mascotte officielle chat-pingouin. Fond bronze profond #6B4427, cartes #59371F, textes crème #FFF3DF et accent bronze métallique #CD7F32. Surfaces translucides et bordures cuivrées discrètes. Cette décision remplace les thèmes noir/blanc des versions antérieures.
Police système, corps 16 px, interligne au moins 1,45 ; espacement sur base 4/8 px ; bulles arrondies 18 px ; contrôles tactiles cibles 44 × 44 px minimum.
Les états utilisent texte et icône, pas uniquement une couleur. Respect du zoom, de la réduction des animations, des zones sûres et du clavier virtuel. Pas d’animation qui déplace le bouton au moment du toucher.

## 7. Catalogue complet des vues et états UI

| ID    | Vue / composant       | Informations et actions                                                                          | États particuliers                                                    |
| ----- | --------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| UI-01 | Accueil / connexion   | connexion existante, inscription, récupération d’accès, explication succincte                    | chargement, erreur, confirmation mail                                 |
| UI-02 | Première ouverture    | finalité du stockage, dépôt privé, choix voix et permissions au moment utile                     | GitHub non connecté, dépôt indisponible                               |
| UI-03 | Chat vide             | « Que souhaites-tu faire ? », exemples facultatifs, saisie                                       | aucun historique, hors ligne                                          |
| UI-04 | Message texte         | auteur, contenu, heure, réponse, copier, corriger, sources                                       | en attente, envoyé, génération, échec                                 |
| UI-05 | Zone de saisie        | brouillon, bouton de mode déplaçable, bouton d’envoi intégré glissant à gauche, joindre, arrêter | vide, geste incomplet, geste annulé, pièces en cours, limite dépassée |
| UI-06 | Vocal temps réel      | état écoute/parle, transcription, micro, son, raccrocher                                         | permission refusée, silence, reconnexion                              |
| UI-07 | Import                | scanner, fichier local, photos, liste de pièces                                                  | type interdit, taille, annulation                                     |
| UI-08 | Scan                  | cadrage, capture, recadrage, rotation, pages, reprendre, valider                                 | caméra absente, flou, faible lumière                                  |
| UI-09 | Carte de document     | aperçu, nom, pages, OCR, catégorie, version, ouvrir/télécharger                                  | traitement, quarantainé, OCR partiel                                  |
| UI-10 | Question interactive  | question précise, 2–5 choix, autre réponse, facultatif/passer                                    | réponse expirée, déjà traitée, modification                           |
| UI-11 | Tâche autonome        | objectif, étapes publiques, état, temps écoulé, pause/arrêt                                      | attente utilisateur, outil bloqué, échec partiel                      |
| UI-12 | Résultat              | contenu adapté, sources, version, télécharger, approfondir                                       | incomplet, données manquantes                                         |
| UI-13 | Confirmation d’action | action exacte, destinataire, données, coût éventuel                                              | approuver, modifier, refuser, expiration                              |
| UI-14 | Historique            | recherche, sessions, dates, filtres, reprise                                                     | aucun résultat, index en reconstruction                               |
| UI-15 | Catégories            | catégories, alias, liens, renommer/fusionner/corriger                                            | conflit de classement, doublon probable                               |
| UI-16 | Carte mémoire         | nœuds, liens typés, origine, détail accessible en liste                                          | graphe volumineux, filtres                                            |
| UI-17 | Journal / sources     | événement, action, justificatif public, résultat, preuve GitHub                                  | non synchronisé, résultat inconnu                                     |
| UI-18 | Préférences           | langue, voix, notifications, autonomie, mémoire, export                                          | modification non enregistrée                                          |
| UI-19 | Connexions            | état GitHub, dépôt cible, permissions, reconnexion                                               | accès révoqué, quota, lecture seule                                   |
| UI-20 | Confidentialité       | conservation, export, effacement, révocation, sessions actives                                   | opération longue, historique à purger                                 |
| UI-21 | Incident              | explication, données déjà sauvées, réessayer, diagnostic                                         | service voix indisponible, GitHub en panne                            |
| UI-22 | Synchronisation       | local en attente / serveur reçu / GitHub synchronisé                                             | conflit, réseau perdu, reprise                                        |

Toutes ces vues secondaires sont accessibles depuis le menu ou par demande dans le chat. Une confirmation sensible ne doit pas être masquée par une notification.

## 8. Messagerie et questions

Chaque message possède un identifiant stable, auteur, contenu intégral, langue, date serveur, version, pièces et liens de provenance.
Le flux de texte apparaît progressivement. Les segments provisoires sont distincts de la version finale. Recharger la page retrouve la version reçue par le serveur ; l’état de synchronisation explique les données encore locales.
Une correction utilisateur crée une nouvelle version et marque les conséquences potentiellement obsolètes. Un résultat déjà produit n’est pas silencieusement modifié.
L’agent pose une question seulement si l’information manque réellement et change l’exécution. Il réutilise les informations autorisées existantes ; une hypothèse mineure est annoncée plutôt que transformée en questionnaire.

Les choix portent une valeur et un identifiant de question. Le serveur rejette les boutons obsolètes. Un choix sensible ne vaut pas consentement pour d’autres actions. Toujours proposer une réponse libre. Après réponse, la carte montre ce qui a été choisi et permet une correction si elle reste applicable.
Le texte reçu d’un document ne devient jamais une instruction autorisant une action.

## 9. Voix temps réel

Objectif : conversation bidirectionnelle avec transcription visible, interruption de la voix par la parole utilisateur et reprise cohérente.
Le serveur délivre des autorisations temporaires adaptées au fournisseur choisi ; aucun secret permanent dans le navigateur.
La première activation demande un geste explicite et la permission navigateur. Si refus : instructions simples et maintien du texte. Un témoin « Micro actif » reste visible dès que de l’audio est capturé.

Deux commandes distinctes :

- « Couper mon micro » arrête l’émission audio ; l’utilisateur peut continuer à écouter.
- « Couper la voix » arrête la sortie audio ; le texte continue et le micro garde son état explicite.
  Un bouton « Tout couper » coupe entrée et sortie. Quitter le mode vocal libère les pistes micro. Fermer une feuille visuelle ne doit pas laisser une capture cachée.

La réponse vocale suit le texte finalisé et partage son identifiant. Une interruption conserve ce qui a effectivement été prononcé. Une correction du texte ne doit pas déclencher une lecture en double.
Les tableaux et contenus longs reçoivent une introduction vocale et un bouton « Lire en entier » ; le contenu complet reste dans le fil.
États : inactif, demande de permission, connexion, écoute, transcription, préparation, lecture, micro coupé, sortie coupée, reconnexion, terminé, erreur.
La détection de silence ne conclut pas seule qu’une action sensible est approuvée. Mode casque conseillé dans l’aide, gestion de l’écho et seuils à tester.
Enregistrement audio brut désactivé par défaut ; sa conservation nécessite un choix distinct de celui de la transcription.

## 10. Scanner et import local

Le navigateur accède seulement aux fichiers choisis et à la caméra autorisée, jamais à tout le disque.
Flux scanner : choisir caméra → capturer → contrôler netteté → recadrer/rotation → ajouter pages → aperçu → envoyer → analyse → OCR → catégorie → résultat.
Flux fichier : sélecteur du système ou glisser-déposer → validation → aperçu/liste → retirer/renommer → envoyer.

Formats cibles P0 : PDF, JPG, PNG, TXT et Markdown ; DOCX et XLSX en extension après validation des extracteurs. SVG, HTML, macros et archives ne sont pas exécutés.
Limites produit initiales proposées : 20 Mio par fichier, 10 pièces par envoi, 50 pages par tâche OCR ; valeurs configurables et affichées avant transfert. Distinguer cette limite produit des limites du fournisseur.
Contrôler le type réel, l’extension, la taille, les fichiers chiffrés, le nombre de pages, les décompressions et les documents malveillants.
Un fichier suspect est isolé et ne part pas vers un outil d’analyse. Aucun script ou macro de document n’est exécuté.

Conserver original, empreinte, métadonnées, dérivé OCR, coordonnées de page si disponibles, confiance du moteur lorsqu’elle existe et corrections. Un OCR douteux affiche « À vérifier », jamais une précision inventée.
Doublon : détecter par empreinte du contenu, proposer réutiliser ou nouvelle version. Une même pièce peut avoir plusieurs catégories sans duplication physique.
Permettre ouverture, téléchargement et export des versions autorisées. Les conversions perdent parfois de la mise en page : signaler le dérivé comme tel.

## 11. Agent autonome et limites d’action

Pipeline public : réception durable → identification de l’objectif → récupération de contexte → domaines utiles → plan d’action communicable → question si nécessaire → exécution → vérification → livraison → classement et synchronisation.

| Niveau                    | Exemple                                        | Comportement proposé                                            |
| ------------------------- | ---------------------------------------------- | --------------------------------------------------------------- |
| Lecture                   | rechercher dans les sources autorisées         | autonome                                                        |
| Production réversible     | rédiger, OCR, classer, créer une version       | autonome dans l’espace autorisé                                 |
| Action externe engageante | envoyer un message, publier, acheter, partager | confirmation sur l’action concrète sauf mandat préalable précis |
| Destruction / accès       | effacer, rendre public, changer droits         | confirmation explicite avec périmètre et conséquences           |

Les mandats peuvent préciser outil, espace, type d’action, limites financières, durée et révocation. Une instruction générale d’autonomie ne donne pas un accès illimité à des systèmes inconnus.
L’utilisateur peut voir les tâches, les arrêter et comprendre un blocage. Une interruption empêche de nouveaux effets ; elle ne prétend pas annuler ce qui a déjà été envoyé.
Le travail continue serveur fermé côté client. Les notifications hors application sont opt-in et dépendent des capacités de la plateforme. Sans permission de notification, le résultat attend dans le chat.

États durables : queued, running, waiting_user, waiting_tool, paused, cancel_requested, cancelled, succeeded, failed, partial, outcome_unknown.
Chaque étape possède délai, tentatives, identifiant d’idempotence et résultat. Après un timeout d’une action externe, vérifier son effet avant une relance. Ne jamais répéter aveuglément un paiement ou un envoi.
Un opérateur peut reprendre les échecs irrécupérables sans recevoir automatiquement l’accès au contenu privé.

## 12. GitHub comme référentiel documentaire

### Décision proposée

Utiliser GitHub pour les sources structurées et l’historique versionné. L’exécution temps réel, la coordination, les verrous et les flux audio appartiennent au service serveur.
Éviter un commit par mot ou fragment audio. Enregistrer d’abord dans un journal durable côté serveur puis synchroniser des lots ordonnés vers GitHub ; afficher distinctement les deux états.
Pour éviter de mélanger code applicatif et vie privée, créer ultérieurement un dépôt mémoire privé séparé par propriétaire ou espace. Le dépôt actuel héberge le code et cette spécification. Aucun dépôt supplémentaire n’est créé par cette livraison.

### Organisation logique cible du dépôt mémoire

| Chemin                              | Rôle                                                                       |
| ----------------------------------- | -------------------------------------------------------------------------- |
| registry/categories/                | une fiche par catégorie : ID stable, titre, alias, parent éventuel, statut |
| registry/entities/                  | objets, projets, personnes pseudonymisées si nécessaire                    |
| sessions/<session_id>/manifest.json | ordre, versions, statut et liens de la session                             |
| sessions/<session_id>/messages/     | messages intégraux versionnés                                              |
| events/<année>/<mois>/<jour>/       | événements immuables par objet ou lot scellé                               |
| documents/<document_id>/            | original autorisé, métadonnées, dérivés et versions                        |
| tasks/<task_id>/                    | mandat, plan public, étapes, résultats et contrôles                        |
| graph/nodes/ et graph/edges/        | cartographie versionnée et provenance                                      |
| policies/                           | schémas, versions et règles de conservation                                |
| indexes/manifests/                  | descriptions et points de reprise reconstruisibles                         |

Les noms sont techniques et stables ; les titres affichés peuvent évoluer. Éviter les noms de personnes dans les chemins et messages de commit.
Un seul exemplaire canonique d’un événement ; les catégories pointent vers son ID. Issues et labels servent au suivi du développement, pas à stocker les conversations privées.
Git LFS est interdit par décision du propriétaire. Les pièces acceptées sont stockées directement dans Git classique, sans fichiers pointeurs LFS. La limite produit initiale est de 20 Mio par fichier ; un contrôle de volume total et de croissance historique doit précéder chaque admission. Un fichier trop gros est refusé avec une explication et une possibilité de fournir une version plus légère choisie par l’utilisateur. Aucun découpage automatique destiné à contourner les limites de GitHub et aucun stockage externe implicite. À terme, répartir les archives dans plusieurs dépôts privés liés par un registre peut être étudié, sous réserve des limites et conditions de GitHub ; cela ne rend pas le stockage illimité. Aucun basculement caché vers Google Drive.

### Synchronisation et concurrence

File par dépôt ; lots atomiques cohérents ; lecture du commit parent ; contrôle de version ; rejeu contrôlé si la branche a changé.
Ne jamais écraser un changement manuel. En conflit : préserver les deux modifications et produire un événement de résolution.
Maintenir un outbox durable entre transaction serveur et écriture GitHub. Un crash ne doit pas perdre un événement reçu. Déduplication par event_id et opération externe.
Une modification GitHub entrante est validée contre les schémas et permissions avant son utilisation. Un webhook, s’il est retenu, doit être authentifié et dédupliqué.
Le dépôt est privé et reste privé ; GitHub n’équivaut pas à un chiffrement applicatif de bout en bout. Prévoir un modèle de chiffrement et une gestion de clés selon la sensibilité.

## 13. Catégories automatiques et correction

À chaque nouvel objet :

1. Identifier son type et les domaines pertinents.
2. Rechercher les catégories existantes via IDs, alias et proximité sémantique.
3. Réutiliser la catégorie si l’adéquation est suffisante.
4. En ambiguïté, utiliser « À classer » et proposer un choix sans bloquer le reste.
5. Si un nouveau domaine est clair, créer sa fiche et un événement category.created.
6. Relier document/message/tâche à une ou plusieurs catégories par relations typées.
7. Rejouer l’opération avec la même clé ne crée pas de doublon.

Seuils initiaux indicatifs : adéquation ≥ 0,85 pour réutilisation automatique ; 0,60–0,85 proposition ; sous 0,60 nouveau domaine ou attente. Ces scores sont des paramètres de moteur à calibrer, pas des probabilités fiables par défaut.
Limiter la prolifération : alias, détection de synonymes, aperçu des catégories nouvelles et correction simple. Pas de fusion irréversible automatique.
Renommer conserve l’ID. Fusionner maintient les redirections et l’historique ; séparer une catégorie ne supprime pas les liens d’origine.
L’utilisateur peut écrire « ceci appartient à logement » ; la correction devient une nouvelle relation datée et une préférence contextualisée.

## 14. Journal intégral, temps et preuves

Enregistrer : messages utilisateur/agent complets, pièces autorisées, événements d’outils expurgés des secrets, choix de l’utilisateur, décisions publiques, résultats, erreurs et relations.
Ne pas archiver les mots de passe, jetons, cookies ni autorisations temporaires. Une suppression de secret est indiquée, sans reproduire sa valeur.
Un journal exhaustif des événements conservables n’est pas une garantie d’enregistrer les calculs internes du modèle ou tous les paquets réseau.

Chaque événement comporte :

- event_id, schema_version, owner_id, workspace_id ;
- session_id, task_id facultatif, actor, event_type ;
- occurred_at et received_at en UTC avec précision milliseconde ;
- client_observed_at facultatif et fuseau d’origine ;
- sequence serveur par flux, correlation_id, causation_id ;
- catégories, entités, relations, références de contenu et empreintes ;
- statut, justification publique si utile, source/provenance ;
- version et informations de synchronisation dans un registre associé.

L’horodatage serveur est la référence d’enregistrement ; la date du client peut être décalée. Une milliseconde affichée ne prouve pas l’exactitude absolue d’une horloge. Utiliser synchronisation des horloges et ordre serveur ; en multi-région, distinguer ordre causal et temps physique.
Afficher en Europe/Paris pour cet utilisateur, en conservant UTC. Tester changement d’heure et import de dates anciennes. L’heure d’un commit n’est pas l’heure de chaque action.

Les corrections créent des événements supplémentaires. Une chaîne d’empreintes aide à détecter des altérations ; Git et les empreintes ne suffisent pas à prouver une inviolabilité contre un administrateur ayant les accès. Pour exigences fortes, prévoir signatures et ancrage externe.

## 15. Mémoire globale et reprise de session

Trois couches :

- Sources : conversations, documents et événements intégraux versionnés.
- Cartographie : catégories, entités et relations typées.
- Index : recherche textuelle et sémantique reconstruisible avec filtres d’autorisation.

La totalité des archives reste consultable, mais ne peut pas être injectée en permanence dans une fenêtre de contexte finie. La reprise retrouve sélectivement les sources pertinentes et permet de remonter aux originaux. L’agent signale les portions non consultées ou indisponibles.
Les résumés facultatifs sont des vues dérivées, jamais la mémoire canonique. Ils ne doivent pas être présentés comme une transcription complète.

À l’ouverture d’une session : vérifier identité et droits → lire manifestes de reprise → récupérer tâches ouvertes, décisions et préférences pertinentes → rechercher les sources liées → vérifier contradictions et versions → permettre continuer.
Une information trouvée dans une seule session ne devient pas une vérité universelle. Stocker périmètre, source, validité et statut confirmé/hypothèse/contredit/obsolète.
Chaque réponse fondée sur la mémoire expose les sources sur demande, idéalement message/page/version/commit.
Une mémoire effacée doit disparaître des index, caches, exports gérés et restaurations futures selon la politique applicable. Aucun « rappel fantôme » via un ancien résumé.

## 16. Cartographie créée au fil de l’eau

Nœuds : session, message, document, version, tâche, catégorie, décision, livrable et entité.
Liens : belongs_to, derived_from, references, supersedes, contradicts, produced_by, decided_in, same_as.
Chaque lien a ID, origine, date, auteur, confiance éventuelle et statut. La création d’un document, de sa catégorie et des relations indispensables forme une opération cohérente ou une réparation explicite.
Le graphe se consulte en vue visuelle et en liste accessible ; filtres par catégorie, période, type et session. Un lien ouvre sa preuve. La vue limite le nombre de nœuds à l’écran sans supprimer l’archive.

## 17. Interface modulaire et métamorphique

L’agent décrit une interface avec un schéma déclaratif versionné ; le client affiche seulement les composants du registre autorisé. Il ne reçoit pas du JavaScript arbitraire à exécuter.

| Composant           | Usage                  | Actions possibles                   |
| ------------------- | ---------------------- | ----------------------------------- |
| text / rich_text    | explication et réponse | copier, lire, sources               |
| choice              | clarification courte   | choisir, réponse libre              |
| form                | collecte structurée    | valider, sauvegarder brouillon      |
| document            | scan, rapport, pièce   | ouvrir, corriger OCR, télécharger   |
| table               | comparaison            | trier, filtrer, exporter            |
| chart               | valeurs sourcées       | détail, tableau alternatif          |
| timeline            | événements et tâches   | ouvrir événement                    |
| checklist           | plan ou contrôle       | cocher si autorisé, commenter       |
| task_progress       | travail autonome       | pause, arrêter, reprendre           |
| action_confirmation | effet engageant        | approuver, modifier, refuser        |
| memory_graph        | cartographie           | filtrer, ouvrir preuve              |
| artifact            | livrable               | prévisualiser, versionner, exporter |

Chaque carte : component_id, schema_version, source_ids, data_version, type, props validées, actions autorisées et texte alternatif.
L’agent ne choisit jamais un nom de fonction serveur libre : chaque action pointe vers une capacité autorisée, contrôlée à nouveau côté serveur. Les URLs, le texte riche et les pièces sont assainis.
Composant inconnu ou invalide : afficher un texte de secours avec les données utiles et conserver l’erreur technique hors du fil principal.
Changer de vue ne perd pas la saisie ni le résultat. Une carte obsolète est marquée « version antérieure ». Accessibilité, focus et ordre du fil restent stables.
Une interface spécialisée s’ouvre seulement si elle aide la tâche : aucune métamorphose décorative qui désoriente.

## 18. Architecture proposée et contrats

Client existant React/TanStack → API authentifiée → orchestrateur durable → exécutants spécialisés (IA, voix, OCR, documents, GitHub).
Journal durable/outbox → synchroniseur GitHub → référentiel documentaire.
Index de recherche ← projections validées du référentiel et des événements autorisés.
Le client reçoit des événements de progression et reprend après son dernier curseur. Lovable, OpenAI et ElevenLabs sont retenus par le propriétaire. Le choix des modèles, des services précis, des transports audio et de l’hébergement des exécutants durables reste à figer après une preuve de faisabilité.

Supabase peut continuer à gérer l’identité et, si retenu, l’état opérationnel et la file durable. Cela ne remplace pas les archives GitHub. Prévoir une migration/export et ne pas supprimer l’existant avant validation.
Une authentification de l’application ne donne pas automatiquement l’accès au dépôt : association explicite et permissions minimales.

| Contrat indicatif               | Entrée                                    | Sortie attendue                        |
| ------------------------------- | ----------------------------------------- | -------------------------------------- |
| POST /sessions                  | espace, intention facultative             | session_id                             |
| POST /sessions/:id/messages     | client_message_id, texte, pièces validées | message_id, task_id, statut reçu       |
| GET /sessions/:id/events?after= | curseur                                   | événements ordonnés et nouveau curseur |
| POST /questions/:id/answers     | version, valeur, clé d’idempotence        | réponse acceptée ou conflit            |
| POST /documents/uploads         | métadonnées et taille                     | transfert limité et temporaire         |
| POST /documents/:id/finalize    | empreinte et preuve transfert             | statut analyse                         |
| POST /tasks/:id/control         | pause/reprendre/annuler                   | état durable                           |
| POST /voice/sessions            | session et préférences                    | autorisation temporaire et limites     |
| GET /memory/search              | requête, filtres, curseur                 | sources autorisées et versions         |
| POST /categories/corrections    | lien/version/correction                   | nouvel événement                       |
| POST /exports                   | périmètre, format                         | tâche export et lien temporaire        |
| POST /privacy/requests          | périmètre et type de demande              | suivi de traitement                    |

Ces chemins sont une proposition de contrat, pas des API existantes. Toutes les mutations vérifient identité, appartenance, schéma, limites et idempotence. Les erreurs ont code stable, message compréhensible, caractère réessayable et correlation_id.

## 19. Modèle de données logique

| Objet           | Attributs essentiels                            | Contraintes                         |
| --------------- | ----------------------------------------------- | ----------------------------------- |
| Workspace       | id, owner_id, dépôt lié, politique              | isolation par espace                |
| Session         | id, workspace_id, titre, dates, état            | ordre des messages                  |
| Message         | id, session_id, rôle, version, contenu, pièces  | intégral et versionné               |
| Document        | id, empreinte, type, propriétaire, original_ref | pas de duplication canonique        |
| DocumentVersion | id, document_id, source, dérivés                | traçabilité des transformations     |
| Category        | id, titre, alias, parent, statut                | ID immuable                         |
| Entity          | id, type, attributs sourcés                     | pas d’unification hasardeuse        |
| Relation        | id, source, cible, type, provenance, dates      | références valides                  |
| Task            | id, mandat, état, limites, checkpoint           | transitions contrôlées              |
| Action          | id, outil, entrées expurgées, résultat, effet   | reprise sans double effet           |
| Question        | id, task_id, schéma, version, état              | réponse validée                     |
| Event           | id, type, temps, séquence, références           | append-only hors effacement encadré |
| SyncRecord      | event_id, tentative, commit, statut             | pas d’archive annoncée avant succès |
| Preference      | id, valeur, portée, source, validité            | corrigible et révocable             |

Versionner les schémas, migrer avec sauvegarde, contrôler les références cassées et reconstruire les projections à partir des sources.

## 20. Sécurité, confidentialité et confiance

Mesures produit à prévoir :

- Session sécurisée, contrôle d’accès serveur par propriétaire/espace et révocation.
- GitHub App ou mécanisme équivalent limité aux dépôts choisis ; secrets côté serveur et rotation.
- Chiffrement des transports et des stockages gérés ; décision explicite sur chiffrement applicatif.
- Aucun document privé dans les logs techniques, messages de commit ou outils d’analyse d’audience.
- Fichiers et contenus récupérés traités comme données non fiables ; protection contre injection de consignes et exfiltration par l’agent.
- Appels outils autorisés par capacité et périmètre, destinations réseau contrôlées, protection SSRF.
- Aperçus de documents isolés, texte riche assaini, liens de téléchargement temporaires.
- Redaction des secrets avant archivage ; journal des accès techniques et réponse aux incidents.
- Sauvegardes distinctes et restaurations testées ; GitHub seul n’est pas un plan de reprise complet.
- Paramètres de conservation explicites : transcriptions, originaux, dérivés, journaux et audio brut séparés.

La conservation indéfinie de tout ne peut pas être le seul choix. Prévoir conservation jusqu’à suppression, durées configurables, export et effacement. Les obligations applicables, contrats fournisseurs et transferts de données nécessitent une validation dédiée avant production ; ce document ne certifie aucune conformité.
Git conserve les anciennes versions. Effacer un fichier courant ne retire pas son historique. Une procédure d’effacement peut nécessiter purge de l’historique, des objets annexes et sauvegardes ; ce cas exceptionnel doit être isolé et évalué avec les contraintes Lovable. D’où l’intérêt d’un dépôt mémoire séparé dès le début.
Ne pas promettre une suppression totale immédiate de copies externes déjà partagées. Documenter délais et limites observables.

## 21. Pannes, coûts et fonctionnement dégradé

| Incident                  | Expérience attendue                         | Comportement serveur                                      |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| Réseau client perdu       | brouillon conservé avec avertissement local | reprise par curseur                                       |
| GitHub indisponible       | « reçu, archivage en attente »              | outbox, attente bornée, alerte capacité                   |
| Quota GitHub atteint      | délai visible, aucun faux succès            | respecter Retry-After et fenêtres de quota                |
| IA indisponible           | message conservé, reprise proposée          | retry borné, aucun résultat inventé                       |
| Voix indisponible         | texte disponible, bascule explicite         | fermer le transport audio                                 |
| OCR partiel               | pages concernées signalées                  | conservation original et détail d’erreur                  |
| Accès révoqué             | tâche bloquée, reconnexion ciblée           | aucune tentative d’accès alternative                      |
| Action externe incertaine | « résultat à vérifier »                     | réconciliation avant relance                              |
| Stockage plein            | limites et export proposés                  | refuser avant perte, arrêter les admissions si nécessaire |
| Deux onglets actifs       | même état et pas de double tâche            | idempotence et contrôle de version                        |

Budgets par tâche et par mois : jetons, minutes voix, pages OCR, volume documentaire, opérations GitHub et temps d’exécution. Le propriétaire choisit les plafonds ; alerte avant dépassement et arrêt sûr. Prix réels à obtenir lors du choix des fournisseurs, sans coût fictif annoncé ici.
Hors ligne : brouillon minimal seulement, avec consentement sur appareil partagé. Pas de promesse d’analyse IA ou d’archivage distant sans réseau.

## 22. Objectifs non fonctionnels et méthode de mesure

| Indicateur cible          | Objectif initial                                         | Mesure                                  |
| ------------------------- | -------------------------------------------------------- | --------------------------------------- |
| Réactivité interface      | actions locales visibles en moins de 100 ms au p95       | appareil et jeu de test documentés      |
| Accusé de réception texte | moins de 1 s au p95 hors panne                           | envoi client → réception serveur        |
| Début de réponse texte    | moins de 3 s au p95 pour demande simple                  | réception → premier contenu utile       |
| Début de réponse vocale   | moins de 1,5 s au p95 après fin de parole simple         | trace audio et serveur                  |
| Synchronisation GitHub    | moins de 30 s au p95 hors quota/panne                    | reçu durable → commit confirmé          |
| Disponibilité cible       | 99,5 % mensuel au lancement                              | sondes du parcours central              |
| Reprise exécutant         | moins de 5 minutes pour incident standard                | crash simulé et checkpoint              |
| Perte d’événement reçu    | aucune dans les tests de crash                           | comptage IDs avant/après                |
| Accessibilité             | cible WCAG 2.2 AA                                        | audit automatique et manuel             |
| Compatibilité             | Safari iOS, Chrome Android et navigateurs bureau récents | versions fixées dans matrice de recette |

Ces cibles doivent être révisées après mesures. Un accès intégral aux archives ne garantit ni récupération parfaite ni rappel exhaustif par le modèle.
Capacité pilote proposée : 1 propriétaire, 10 000 messages, 1 000 documents, 100 catégories, puis essai à ×10. Mesurer temps de recherche, coût Git, taille des arbres et qualité de récupération avant élargissement.
Plan de reprise proposé : RPO opérationnel ≤ 5 min pour sinistre majeur, RTO ≤ 4 h ; ils dépendent de l’hébergement et des sauvegardes, distincts de l’absence de perte attendue lors d’un simple crash.

## 23. Parcours de référence

### A — Texte, catégorie existante

« Compare ces deux devis » → import des deux pièces → classification sous la catégorie existante → question « Quel critère privilégier ? » si nécessaire → tableau sourcé → documents et relations archivés → preuve de synchronisation.

### B — Voix puis scan

Glisser à gauche → autoriser micro → parler → lire transcription → couper seulement la voix si souhaité → glisser à droite → scanner plusieurs pages → valider → OCR → demande de confirmation d’un montant ambigu → réponse vocale et texte.

### C — Nouveau domaine

Un document sans catégorie pertinente arrive → création d’une nouvelle catégorie avec justification publique → liens à la session et au document → notification discrète dans le chat → possibilité de corriger ou fusionner.

### D — Nouvelle session

L’utilisateur revient sur un autre appareil et demande « reprends le devis » → identité → recherche → sources et versions pertinentes → rappel des décisions explicites → reprise au point ouvert ; demander lequel si plusieurs devis conviennent.

### E — Exécution longue

Créer un rapport → tâche durable → fermer le navigateur → exécutant continue → résultat conservé → prochaine connexion affiche résultat et sources. Une autorisation manquante suspend la tâche plutôt que de l’inventer.

### F — Défaillance puis reprise

GitHub répond en erreur → message reçu durablement → état « archivage en attente » → réessai respectant quotas → commit unique → état synchronisé. Le test force un crash entre écriture et accusé de succès pour vérifier la déduplication.

## 24. Recette fonctionnelle traçable

| Test  | Exigence couverte         | Réussite observable                                                                                              |
| ----- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| AT-01 | chat minimal              | parcours courant réalisé dans le fil sans navigation imposée                                                     |
| AT-02 | bouton de mode déplaçable | le bouton lui-même suit le geste ; relâcher choisit Vocal/Texte/Documents ; clics et clavier restent disponibles |
| AT-03 | permission                | refus micro/caméra laisse le texte fonctionnel                                                                   |
| AT-04 | silence                   | micro coupé = zéro audio envoyé ; voix coupée = zéro lecture                                                     |
| AT-05 | interruption              | parole utilisateur interrompt lecture et reste transcrite                                                        |
| AT-06 | import                    | pièce retirée avant envoi n’est pas analysée                                                                     |
| AT-07 | scan                      | trois pages ordonnées, recadrées et reliées à un original                                                        |
| AT-08 | OCR                       | erreur volontaire visible et correction versionnée                                                               |
| AT-09 | catégorie existante       | deux imports synonymes réutilisent la catégorie                                                                  |
| AT-10 | catégorie nouvelle        | fiche et liens créés une seule fois après rejeu                                                                  |
| AT-11 | question                  | double clic ou ancienne carte ne déclenche pas deux effets                                                       |
| AT-12 | source complète           | chaque message original du scénario reste consultable                                                            |
| AT-13 | reprise                   | nouvelle session retrouve décision et tâche avec preuves                                                         |
| AT-14 | contradictions            | valeur corrigée supplante l’ancienne sans effacer son origine                                                    |
| AT-15 | mémoire                   | jeu de 100 questions avec sources attendues, cible rappel ≥ 90 %, droits toujours respectés                      |
| AT-16 | GitHub en panne           | aucune fausse confirmation, reprise sans événement perdu                                                         |
| AT-17 | concurrence               | deux onglets ne dupliquent ni message ni action                                                                  |
| AT-18 | effet incertain           | timeout ne déclenche pas une deuxième action externe                                                             |
| AT-19 | sécurité                  | texte malveillant dans un PDF ne modifie pas les autorisations                                                   |
| AT-20 | isolation                 | accès à l’ID d’un autre propriétaire refusé côté serveur                                                         |
| AT-21 | interface adaptative      | composant invalide affiche un secours sans exécuter de code                                                      |
| AT-22 | accessibilité             | parcours texte/import/questions utilisable au clavier et lecteur d’écran                                         |
| AT-23 | archive                   | export restitue textes, pièces autorisées, versions et relations                                                 |
| AT-24 | effacement                | donnée retirée des sources gérées et index, limites historiques documentées                                      |
| AT-25 | heure                     | ordre cohérent malgré appareil décalé et changement d’heure                                                      |
| AT-26 | restauration              | restauration isolée retrouve IDs, liens et tâches, sans réexécuter d’effets                                      |
| AT-27 | arrière-plan              | navigateur fermé, tâche aboutit ou attend explicitement une réponse                                              |
| AT-28 | budgets                   | plafond atteint suspend proprement avec état et coût mesuré                                                      |
| AT-29 | mobile                    | clavier ouvert, rotation, zoom 200 %, aucune action essentielle inaccessible                                     |
| AT-30 | recherche traçable        | chaque source présentée correspond au bon document et à sa version                                               |

Rapport de recette exigé : environnement, versions, données synthétiques, résultat attendu/observé, preuves, anomalies et date. Cette spécification ne déclare aucun de ces tests produit déjà réussi.

## 25. Plan de réalisation et livrables

1. Valider les hypothèses structurantes et figer le modèle d’archive ; produire décisions d’architecture.
2. Construire une tranche complète texte → agent → tâche → événement → catégorie → GitHub → reprise.
3. Ajouter pièces et OCR avec contrôles de fichiers.
4. Ajouter voix temps réel et tester appareils/permissions/interruption.
5. Déployer le registre adaptatif, sources et carte mémoire.
6. Ajouter exports, effacement, quotas, sauvegardes et exploitation.
7. Réaliser recette pilote, corriger les écarts et autoriser la production sur preuves.

Pour chaque lot : code, schémas, tests utiles, documentation d’exploitation, migration, retour arrière et risques résiduels.
Le planning et le budget ne sont pas engagés avant le choix des services précis chez les fournisseurs retenus et la preuve de faisabilité voix/GitHub.
Définition de terminé : fonctionnalité intégrée dans la pile existante, accessible, autorisée côté serveur, observable, restaurable, testée et documentée. Une maquette avec réponses simulées n’est pas une intégration fonctionnelle.

## 26. Choix à arrêter avant activation réelle

| Sujet                  | Proposition par défaut                                                    | Pourquoi ce choix compte                                                         |
| ---------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Dépôt mémoire          | privé séparé du code                                                      | confidentialité, volume, purge et maintenance                                    |
| Original des échanges  | conservation intégrale jusqu’à suppression choisie                        | continuité et contrôle                                                           |
| Audio brut             | non conservé                                                              | volume et vie privée                                                             |
| Autonomie              | lectures et créations réversibles autorisées                              | fluidité avec limites explicites                                                 |
| Effets externes        | mandat précis ou confirmation ciblée                                      | éviter les actions hors intention                                                |
| Hébergement            | service serveur durable à sélectionner                                    | exécution navigateur fermé                                                       |
| Fournisseurs           | Lovable pour la construction ; OpenAI pour l’IA ; ElevenLabs pour la voix | modèles, transcription, OCR et services précis à valider ; adaptateurs séparés   |
| Gros fichiers          | Git classique uniquement ; Git LFS interdit                               | taille et croissance historique contrôlées ; refus explicite au-delà des limites |
| Chiffrement applicatif | analyse de sensibilité préalable                                          | clés et accès nécessaires à l’agent                                              |
| Journalisation         | échanges/actions/justifications explicites                                | interprétation à confirmer, jamais chaîne de pensée privée                       |

## 27. Sources techniques et limites vérifiées

Sources officielles consultées le 27 octobre 2026 :

- [GitHub : fichiers volumineux](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) : contraintes de Git classique ; Git LFS est explicitement exclu du projet.
- [GitHub : limites de l’API REST](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) : quotas, états 403/429 et reprise.
- [GitHub : bonnes pratiques REST](https://docs.github.com/en/rest/guides/best-practices-for-using-the-rest-api) : sérialisation et gestion des appels.
- Sources du projet inspectées : AGENTS.md, README.md, package.json, src/routes/README.md, index.tsx, auth.tsx et dashboard.tsx.
  Ces sources justifient les contraintes du référentiel ; l’architecture et les objectifs de performance restent des propositions à valider expérimentalement.

## 28. Carte mentale et vocabulaire

Carte : Chat → entrées (texte / voix / document) → agent (objectif / sources / questions / actions) → résultats (texte / voix / cartes) → mémoire (archives / catégories / liens / index) → reprise.
Contrôles transversaux : identité, permissions, temps, versions, coûts et arrêt.

| Anglais         | Français                   | Sens ici                                   |
| --------------- | -------------------------- | ------------------------------------------ |
| chat            | conversation               | interface principale                       |
| background      | arrière-plan               | travail poursuivi côté serveur             |
| mute            | couper le son              | distinguer entrée et sortie                |
| upload          | téléverser                 | envoyer un fichier choisi                  |
| source of truth | référence faisant autorité | archives versionnées                       |
| checkpoint      | point de reprise           | état durable d’une tâche                   |
| retry           | réessayer                  | nouvelle tentative contrôlée               |
| provenance      | origine                    | source et transformation d’une information |

Mini-exercice de validation : « Le micro est coupé, la voix reste active : l’agent peut-il encore m’écouter ? » Réponse attendue : non, la capture et l’envoi audio sont arrêtés.
Variante plus difficile : deux appareils corrigent simultanément la catégorie du même document pendant une panne GitHub. Le système doit préserver les deux événements, choisir une résolution explicite, synchroniser sans doublon et afficher la provenance.
Erreurs typiques à éviter : confondre mémoire et résumé, considérer GitHub comme moteur temps réel, cacher un micro actif, prendre un OCR pour une vérité, exécuter des instructions trouvées dans une pièce, annoncer un archivage non confirmé.

## 29. Plateformes et responsabilités — clarification du propriétaire

Git LFS est exclu de toutes les phases, de tous les environnements et du stockage documentaire. Aucun fichier .gitattributes ne doit activer de filtre LFS ; la recette doit vérifier qu’aucun objet documentaire accepté n’est un pointeur LFS.

| Élément                                                 | Statut                                          | Rôle précis                                                                                       |
| ------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| GitHub                                                  | demandé par le propriétaire et accessible       | code, cahier des charges et futur référentiel documentaire privé en Git classique                 |
| Lovable                                                 | retenu et déjà relié au dépôt                   | construction de l’interface et intégration applicative avec synchronisation du code               |
| Supabase                                                | déjà intégré, réutilisation proposée            | authentification ; état opérationnel, journal durable et file si la solution est validée          |
| React / TypeScript / TanStack / Vite / Tailwind / Radix | déjà dans le projet                             | technologies de l’interface, pas des plateformes de stockage supplémentaires                      |
| Serveur d’orchestration                                 | nécessaire, fournisseur non choisi              | exécuter les tâches après fermeture du navigateur, contrôler les permissions et synchroniser      |
| OpenAI                                                  | retenu par le propriétaire                      | compréhension, analyse, réponses structurées et propositions d’actions, contrôlées par le serveur |
| ElevenLabs                                              | retenu par le propriétaire                      | voix de l’agent ; architecture de conversation et attribution de la transcription à valider       |
| Service OCR                                             | fournisseur non choisi ; option locale possible | extraire du texte des scans avec provenance                                                       |
| Hébergement et sauvegardes                              | fournisseur et politique non choisis            | exécution durable, restauration et gestion des incidents                                          |
| Google Drive                                            | écarté selon la demande                         | aucune dépendance ni copie automatique                                                            |
| Git LFS                                                 | interdit selon la demande                       | aucun usage                                                                                       |

Supabase n’est pas proposé comme destination documentaire de substitution : toute utilisation pour les données opérationnelles doit être annoncée et limitée aux besoins d’exécution. Le journal y est durable pendant la synchronisation, avec une durée de conservation opérationnelle à définir. Les archives métier de référence restent GitHub.
Le fournisseur d’IA pourra recevoir les données utiles à une tâche : ce transfert est un traitement distinct du stockage documentaire et doit être décrit avant activation. Même exigence pour voix et OCR.
Aucune de ces nouvelles connexions n’est activée par la présente livraison. Ne pas confondre la suggestion d’une architecture avec un abonnement ou un service déjà fonctionnel.

### Recette complémentaire

- AT-31 : aucune configuration LFS, aucun pointeur LFS et aucun appel LFS dans l’implémentation.
- AT-32 : un fichier au-delà de la limite est refusé avant transfert vers un service d’analyse ; aucun envoi vers un stockage tiers.
- AT-33 : la croissance du dépôt et de ses versions déclenche une alerte avant dépassement du budget configuré.

## 30. Décision fournisseur — 27 octobre 2026

Instruction du propriétaire : utiliser Lovable, OpenAI et ElevenLabs pour l’instant. Cette décision remplace les mentions antérieures de fournisseurs IA et voix non sélectionnés.

- **Lovable** : environnement de construction de Klerio, de son chat et de ses composants adaptatifs ; conserver l’intégration existante avec le dépôt.
- **OpenAI** : fournisseur IA retenu pour interpréter les demandes, analyser les contenus, produire les réponses et proposer les actions. Les permissions, le journal durable et les effets réels restent sous contrôle du serveur Klerio.
- **ElevenLabs** : fournisseur vocal retenu. Priorité à une réponse vocale issue du même contenu que le texte affiché. Le transport temps réel, la transcription et la gestion des interruptions doivent faire l’objet d’une preuve de faisabilité.
- **GitHub** : référentiel documentaire et code, en Git classique exclusivement ; Git LFS demeure interdit.
- **Supabase** : intégration existante conservée pour l’authentification ; tout rôle supplémentaire reste une proposition technique, pas un nouveau choix imposé au propriétaire.

Architecture vocale à prototyper : entrée micro autorisée → transcription → traitement OpenAI via serveur Klerio → texte progressif → voix ElevenLabs. L’attribution de la transcription à OpenAI ou ElevenLabs reste ouverte ; ne pas ajouter un quatrième fournisseur vocal sans décision explicite.
Ce parcours est une cible de conception, pas une intégration déjà disponible. Mesurer la latence de bout en bout, l’interruption et la cohérence texte/voix avant de déclarer le mode temps réel conforme.

Ne pas déployer deux orchestrateurs conversationnels concurrents. Si une solution conversationnelle ElevenLabs est évaluée, préserver une responsabilité unique pour les tâches, leurs identifiants et leurs autorisations côté Klerio, et vérifier la compatibilité avec le fournisseur IA retenu.
Les clés OpenAI et ElevenLabs restent côté serveur ; le navigateur ne reçoit que les autorisations temporaires nécessaires lorsqu’elles sont prises en charge par le service choisi.
Les abonnements, modèles exacts, prix, régions, durées de conservation et conditions de traitement restent à vérifier avant activation. Aucun abonnement, appel facturable, connexion ou déploiement n’est réalisé par cette mise à jour documentaire.

## 31. Révision UX et scénarios administratifs — 27 octobre 2026

### Manipulation directe et simplicité

Demande utilisateur : déplacer le bouton lui-même, plutôt qu’une barre, et intégrer l’envoi dans le champ de chat. Cette section remplace toute représentation antérieure incompatible.

- Bouton de mode : pression sur le bouton, capture du pointeur, déplacement horizontal continu, relâchement et ancrage à la position retenue. Le centre correspond au texte.
- Bouton d’envoi : situé à droite dans le champ ; pression puis déplacement vers la gauche. Dans la V2, course maximale de 120 px adaptée à la largeur, seuil de validation de 80 px ou 70 % d’une course plus courte. Le seuil reste à calibrer sur appareils réels.
- Un début de geste n’envoie rien. Relâchement avant seuil, pointercancel ou perte de capture : retour visuel et conservation du brouillon. Au-delà du seuil : un seul envoi ; supprimer le clic synthétique associé.
- Le mouvement agit sur le bouton, sans déplacer le champ ni la conversation. Le geste commence exclusivement sur le bouton ; pas d’interception globale du défilement.
- Les boutons gardent une cible d’au moins 44 px, le focus visible et des libellés accessibles. Le clic et le clavier offrent une alternative au glissement. Flèches gauche/droite pour le mode ; Entrée ou clic pour envoyer.
- L’aide « Maintenez puis glissez » reste concise et visible. Une action sensible ne se trouve jamais implicitement approuvée par un envoi de prompt.
- Noir ou blanc, sans accent vert, bleu ou autre. Ne pas recopier les données privées des captures de référence dans les exemples.

### Scénarios réellement documentés, utilisateurs fictifs

La V2 contient quatre parcours interactifs : impôts, attestation de droits, feuille de soins et C2S. Les procédures proviennent des références officielles ci-dessous ; les échanges sont des scénarios synthétiques, pas des dossiers réels ni des services administratifs connectés.
Chaque parcours pose une question pertinente, adapte l’étape suivante, expose la source et propose une liste de vérification, un brouillon non envoyé et un classement simulé.
Les captures transmises servent à comprendre les préférences visuelles et l’organisation. Les autres projets et les identités visibles ne sont pas intégrés à Klerio.

| Parcours                         | Question utile                                     | Présentation du résultat                                                |
| -------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| Corriger une déclaration fiscale | dépôt en ligne, papier ou inconnu ?                | étapes adaptées et lien DGFiP, sans imposer de calendrier non revérifié |
| Attestation de droits            | accès au compte ameli ou difficulté de connexion ? | parcours officiel et aide, sans demander d’identifiant                  |
| Feuille de soins                 | document signé ou vérification nécessaire ?        | contrôles et choix du canal adapté, pas de remboursement promis         |
| Complémentaire santé solidaire   | démarche en ligne, papier ou préparation ?         | liste adaptée, sans attribuer automatiquement un droit                  |

Références officielles consultées le 27 octobre 2026 :

- https://www.impots.gouv.fr/particulier/questions/je-veux-corriger-la-declaration-que-jai-deja-deposee-comment-proceder
- https://www.ameli.fr/assure/adresses-et-contacts/l-obtention-d-un-document/obtenir-une-attestation/obtenir-une-attestation-de-droits
- https://www.ameli.fr/assure/remboursements/etre-bien-rembourse/feuille-soins-papier
- https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante/complementaire-sante-solidaire-demande

La date de consultation n’est pas une surveillance continue. Les conditions, formulaires et calendriers doivent être revérifiés lors d’une démarche réelle. Les liens ouvrent les sources ; la maquette ne soumet aucun dossier, ne lit pas les fichiers choisis et n’active ni micro ni caméra.

### Recette complémentaire des gestes et des scénarios

- AT-34 : le bouton de mode suit physiquement la souris ou le doigt, puis s’ancre à la bonne position.
- AT-35 : le bouton d’envoi est dans le champ ; un geste complet produit un seul message.
- AT-36 : geste court ou annulé conserve intégralement le brouillon.
- AT-37 : les deux thèmes sont monochromes et toutes les commandes restent lisibles.
- AT-38 : chaque scénario répond à ses choix, montre une référence officielle et ne prétend pas avoir envoyé un dossier.
- AT-39 : commandes disponibles au clavier et cibles tactiles utilisables sur petit écran.

## 32. Cas d’usage issus des trois références visuelles Simplio

Les captures fournies par le propriétaire sont des inspirations fonctionnelles. Elles ne prouvent ni les montants, ni les dates, ni l’authenticité d’un courrier, ni l’existence d’une intégration. Klerio conserve le chat unique et les thèmes noir/blanc au lieu de reprendre les tableaux de bord colorés.

### Besoins repris

1. Comprendre un document : objet, explication simple, passage original, actions demandées, dates, montants, pièces et origine des informations.
2. Préparer une démarche : une question à la fois, progression, pièces manquantes, brouillon et validation.
3. Organiser le quotidien : petites étapes, choix de la prochaine action, tâches en attente et historique.
4. Déléguer dans un cadre explicite : préparation autonome, transmission selon mandat et preuve de résultat.
5. Accéder à une aide humaine lorsqu’un blocage ne peut pas être résolu par l’application.

### Catalogue V3

| Parcours                             | Résultat de démonstration                                                          |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Lecture d’un courrier logement       | explication d’un extrait reconstitué, informations absentes explicitement marquées |
| Déclaration d’occupation             | vérification du rôle propriétaire et orientation DGFiP                             |
| Correction de déclaration de revenus | parcours selon mode de dépôt                                                       |
| Demande CAF / aide au logement       | préparation, pièces demandées ou suivi selon le point de blocage                   |
| Attestation de droits                | parcours d’accès et téléchargement officiel                                        |
| Feuille de soins                     | vérification de signature et canal de transmission                                 |
| Demande de C2S                       | préparation en ligne, papier ou liste de points à vérifier                         |
| Facture d’électricité                | lecture des lignes, échéance, montant et preuve de paiement                        |
| Absence scolaire                     | brouillon avec champs à compléter et destinataire à vérifier                       |
| Relance mutuelle                     | pièces utiles, contrat et demande d’état d’avancement                              |
| Santé au travail                     | orientation et modèle officiel de demande à l’employeur                            |
| Organisation personnelle             | une seule tâche et découpage en actions observables                                |

### Règles de présentation

- « Non indiqué » si le document ne fournit pas une date ou un montant ; ne jamais remplacer une absence par 0 €.
- Séparer données lues, explication et hypothèses. Chaque information extraite doit pouvoir renvoyer au passage source quand l’OCR réel sera intégré.
- Une date ancienne issue d’une capture n’est pas une échéance courante. Un compte à rebours dépend d’une échéance identifiée et vérifiée.
- Ne pas afficher « authentique », « cachet vérifié » ou « signature valide » sur la seule base d’une image.
- Ne pas promettre « aucune amende », « aucune urgence », « droit accepté » ou délai garanti sans base adaptée au dossier.
- Le langage simple est une cible ; une conformité FALC ne doit pas être revendiquée sans évaluation adaptée avec les publics concernés.
- Les affirmations de souveraineté, de serveurs en France et de conformité ne sont pas recopiées des captures ; elles nécessitent une vérification de toute la chaîne de traitement.
- Une case cochée signifie une étape déclarée faite. « Payé », « envoyé », « rendez-vous confirmé » et « document reçu par l’organisme » exigent chacun une preuve correspondant à cet effet.
- Le numéro de formulaire et son millésime sont vérifiés sur une source officielle ; aucun numéro de Cerfa n’est repris simplement depuis une maquette.
- Un indicateur mesure les tâches achevées, jamais une réduction médicale ou psychologique quantifiée de la charge mentale.
- Les rappels proposés par le produit seront créés seulement après choix du moment et des notifications. Aucun rappel personnel réel n’est créé dans cette livraison.

### Références supplémentaires consultées le 27 octobre 2026

- DGFiP, déclaration d’occupation : https://www.impots.gouv.fr/particulier/la-declaration-doccupation
- CAF, aides au logement : https://www.caf.fr/allocataires/aides-et-demarches/droits-et-prestations/logement
- Médiateur national de l’énergie, facture : https://www.energie-info.fr/fiche_pratique/les-differents-elements-de-ma-facture/
- Service Public, absence scolaire : https://www.service-public.gouv.fr/particuliers/vosdroits/F1899
- Service Public, complémentaire santé : https://www.service-public.gouv.fr/particuliers/vosdroits/F20314
- Service Public, demande d’organisation des visites : https://www.service-public.gouv.fr/particuliers/vosdroits/R65238

### Recette complémentaire

- AT-40 : un document incomplet produit « non indiqué », sans montant, date ni authenticité inventés.
- AT-41 : un brouillon reste « non envoyé » ; aucune preuve externe n’est créée par une simple case cochée.
- AT-42 : chaque famille de démarche possède son classement, ses sources et une suite adaptée à la réponse.
- AT-43 : une date de capture, un pourcentage décoratif ou un numéro de formulaire non vérifié n’est pas présenté comme fait actuel.

### Vérification de la livraison V3

Syntaxe JavaScript contrôlée. Les fonctions des 12 scénarios ont été exécutées avec un rendu simulé pour leurs 36 branches ; les gestionnaires de pointeur ont passé 8 contrôles unitaires avec géométrie simulée. Ces tests ne constituent ni une recette navigateur ni une validation tactile sur appareil réel.
Le navigateur de test n’était pas installé et son téléchargement n’a pas abouti ; aucune capture de rendu ni performance réelle n’est revendiquée.
Les services OpenAI, ElevenLabs, OCR, archivage GitHub automatique et comptes administratifs ne sont pas connectés dans le fichier de démonstration.

## 33. Identité officielle et compagnon flottant — 28 octobre 2026

Cette décision du propriétaire remplace toutes les consignes antérieures incompatibles de thème noir/blanc et de mascotte.

### Identité et présence

- Mascotte officielle : le chat-pingouin fourni par le propriétaire, conservé visuellement. Les illustrations réalistes constituent la référence principale ; les variantes pixel restent secondaires.
- Thème de toute l’application : bronze, moderne et futuriste. Palette de base : fond #6B4427, surface #59371F, texte #FFF3DF, texte secondaire #E0C6AA et accent #CD7F32. Les dégradés et transparences doivent faire l’objet d’une vérification de contraste sur le rendu effectif.
- Afficher uniquement la tête dans une bulle ronde en superposition sur l’interface, librement positionnable par l’utilisateur. Aucun emplacement ni bande vide n’est réservé au-dessus du chat.
- Suspension légère, halo bronze et ombre douce. Les effets restent discrets et respectent la préférence système de réduction des animations.
- La tête figure aussi comme petit avatar ; le corps complet peut apparaître dans la galerie d’identité, sans devenir un élément permanent du chat.

### Animation et voix

- Animer la bouche pendant la parole de l’agent. Dans le produit connecté, l’animation suit la lecture réelle de l’audio ElevenLabs, son arrêt, sa pause et ses interruptions. Utiliser les informations de synchronisation disponibles dans le service retenu ; un mouvement basé sur l’amplitude ne doit pas être présenté comme une synchronisation phonétique exacte.
- Distinguer lecture audio, écoute micro, attente et silence par des libellés. Une bouche qui bouge n’est jamais une preuve que le micro fonctionne.
- La maquette propose un bouton de test visuel explicite : « Tester l’animation · sans audio ». Le test dure au plus cinq secondes, s’arrête sur une seconde pression, un changement de mode ou lorsque la page est masquée.
- Aucun audio ni micro n’est activé par le test. L’animation de démonstration n’est pas présentée comme une intégration ElevenLabs.
- Le compagnon n’est pas un assistant supplémentaire et ne possède pas une mémoire indépendante : il représente l’agent Klerio existant.
- Une expression joyeuse n’atteste pas une démarche réussie ; seule une preuve d’exécution peut faire passer la tâche au statut confirmé.

### Intégration fournie

La maquette autonome inclut une copie WebP optimisée de la référence fournie et affiche les poses par positionnement CSS. L’original utilisateur n’est pas remplacé. La tête et la bouche sont présentées par la composition de l’interface, sans régénération de la mascotte.
Le chat, les douze parcours administratifs, le bouton de mode déplaçable et l’envoi intégré glissant vers la gauche sont conservés.
La syntaxe JavaScript a été vérifiée ; la validation visuelle du cadrage de tête, du placement de bouche et du comportement sur téléphone reste à effectuer en navigateur.

### Recette complémentaire

- AT-44 : la mascotte et le bronze sont cohérents dans les surfaces principales et secondaires.
- AT-45 : la tête seule flotte en superposition sur l’interface, se déplace librement et peut être repositionnée pour dégager les commandes.
- AT-46 : le test d’animation est explicitement sans audio et s’arrête sur demande.
- AT-47 : une fois la voix branchée, bouche et état de parole s’arrêtent avec l’audio, notamment lors d’une interruption.
- AT-48 : réduction des animations, navigation clavier et petits écrans restent utilisables.

## 34. Bulle libre et commandes dans la saisie — 28 octobre 2026

Cette révision remplace la position fixe en haut et le bouton Mascotte dans l’en-tête.

- Supprimer le bouton Mascotte de l’écran principal. La galerie et les réglages de la mascotte se trouvent dans le menu.
- Déplacer le bouton menu dans la zone de saisie, au bord droit ; le bouton d’envoi intégré se situe immédiatement à sa gauche et conserve son geste d’envoi vers la gauche.
- Le bouton menu est de type non soumission : cliquer dessus ne doit jamais envoyer le brouillon.
- La boule est une couche flottante au-dessus de l’interface, sans bande supérieure réservée. L’utilisateur la positionne à la souris ou au doigt, horizontalement et verticalement.
- Distinguer déplacement et clic : déplacer la boule ne déclenche pas le test vocal. Un glissement interrompu restaure sa position précédente.
- Borner la position à la fenêtre visible. Conserver la position en coordonnées relatives sur cet appareil, puis l’adapter à un redimensionnement.
- Au clavier : flèches pour déplacer, Maj pour affiner, touche Début pour réinitialiser. Le menu Mascotte propose aussi une réinitialisation.
- Retirer le badge de démonstration permanent sous la boule ; conserver un état accessible et le bouton de test explicite dans le menu. La voix réelle demeure non connectée.
- Maintenir les préférences de réduction des animations et les libellés accessibles.
- La maquette possède des contrôles unitaires de déplacement avec géométrie simulée ; un essai visuel et tactile en navigateur reste nécessaire.

Recette :

- AT-49 : aucun bouton Mascotte isolé dans l’en-tête ; option disponible dans le menu.
- AT-50 : le menu est au bord droit de la saisie et ne soumet jamais le formulaire.
- AT-51 : glisser la boule modifie ses coordonnées sur les deux axes sans déclencher la parole.
- AT-52 : annulation, limites de fenêtre, mémorisation locale et réinitialisation fonctionnent.
