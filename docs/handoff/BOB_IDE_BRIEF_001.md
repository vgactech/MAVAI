# Klerio — Brief Bob IDE n°001

Date : 2026-10-28 (Paris)  
Dépôt : `https://github.com/vgacofc/klerio.git`  
Branche cible : `main`  
Référence fonctionnelle : `docs/specifications/KLERIO_CAHIER_DES_CHARGES_V1.md`  
Source de la demande : rapport Bob « Audit complet Klerio », avancement annoncé 95 %.

## 0. Règle de priorité

1. Ne pas casser l’authentification actuelle : e-mail, Google, Lovable, page `/auth`, accès protégé `/dashboard`.
2. Ne mettre aucun secret dans Git, dans les journaux, dans les commentaires ou dans les messages de commit.
3. Ne pas forcer l’historique de `main` : pas de force-push, rebase, amend ou squash sur des commits déjà publiés.
4. Chaque commit sur `main` doit laisser l’application démarrable.
5. Avant de coder une zone ambiguë, écrire la question dans `docs/handoff/BOB_IDE_QUESTIONS.md` et attendre une réponse.

## 1. Décisions transmises pour les 6 questions

| ID     | Décision provisoire                                           | Note                                                                                                             |
| ------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Q-K-01 | Garder le backend Lovable déjà relié au projet.               | Uniquement pour comptes, sessions, files de travail, verrous, reprise et index reconstruisibles.                 |
| Q-K-02 | Server Functions TanStack Start.                              | Pas de nouvelles fonctions Supabase Edge. Webhooks externes sous `/api/public/*` avec vérification de signature. |
| Q-K-03 | SVG composé fidèle à la maquette V4.                          | Mascotte chat-pingouin bronze, flottante, déplaçable, accessible et non bloquante.                               |
| Q-K-04 | Dépôt de mémoire client séparé dès P0.                        | Le dépôt applicatif `klerio` ne doit jamais contenir les fichiers ou données réelles des clients.                |
| Q-K-05 | OpenAI Vision par défaut, derrière une interface remplaçable. | Résultat OCR incertain marqué « À vérifier » ; aucune confiance inventée.                                        |
| Q-K-06 | Hébergement Lovable pour l’instant.                           | Le code doit rester compatible avec un runtime serveur sans module Node chargé dynamiquement.                    |

## 2. Demande de Gabriel sur les tables et GitHub

Gabriel veut éviter le chantier « 0 table → 14 tables métier + RLS par owner_id » et utiliser GitHub directement pour récupérer et stocker les fichiers et données clients.

Décision d’architecture proposée :

- **GitHub privé = source de vérité documentaire** : originaux, métadonnées, catégories, versions, journaux scellés, prompts transmis et explications disponibles.
- **Backend = couche opérationnelle minimale** : identité, liaison utilisateur ↔ dépôt, file d’envoi durable, verrous, état de synchronisation, déduplication et index reconstruisibles.
- **Ne pas recréer en double les 14 tables métier.** Créer seulement les tables techniques strictement nécessaires après validation. Toute table utilisateur doit avoir les droits et protections par propriétaire.

Bob doit répondre explicitement :

1. Le stockage GitHub direct remplace-t-il vraiment chacune des 14 tables ? Fournir le tableau `table prévue → chemin GitHub / table technique / supprimée`.
2. Quelle stratégie empêche la perte d’un événement si GitHub ou le navigateur tombe pendant l’écriture ?
3. Comment chaque client reste-t-il isolé : un dépôt privé par client, un dépôt par espace ou un autre modèle ?
4. Quelles limites de taille, fréquence et volume sont prévues ? Git LFS reste interdit par le cahier des charges.
5. Quel chiffrement est appliqué aux données sensibles avant écriture dans GitHub ?

## 3. Arborescence cible du dépôt de données client

```text
klerio-memory-<id-stable>/
  manifest.json
  registry/
    categories/
    entities/
    documents/
  documents/
    originals/<yyyy>/<mm>/<document_id>/
    derived/ocr/<document_id>/
    derived/annotations/<document_id>/
    versions/<document_id>/
  conversations/<yyyy>/<mm>/<session_id>/
  events/<yyyy>/<mm>/<dd>/<event_id>.json
  ai-runs/<yyyy>/<mm>/<dd>/<run_id>/
    request.json
    stream.ndjson
    result.json
    explanation.json
  indexes/
  schemas/
```

Règles : noms techniques stables, aucun nom de personne dans les chemins ou commits, originaux séparés des dérivés, commits regroupés par lots, aucun message « enregistré dans GitHub » avant confirmation réelle.

## 4. Journal complet avec horodatage

Chaque action doit produire des événements immuables :

- `event_id`, `schema_version`, `owner_id`, `workspace_id`, `session_id`, `task_id`, `run_id` ;
- `actor`, `event_type`, `phase` = `before` | `during` | `after` | `failed` | `cancelled` ;
- horodatage serveur ISO 8601 UTC, horodatage client facultatif, ordre `sequence` ;
- commande ou capacité appelée, paramètres expurgés, version du modèle, version du prompt ;
- entrées utilisées, sorties, erreurs, durée, nombre de tentatives, empreinte des fichiers ;
- état : reçu serveur, en attente GitHub, synchronisé GitHub avec SHA du commit.

### Raisonnements et prompts

- Journaliser intégralement les prompts envoyés par Klerio, les messages utilisateur, les instructions système de l’application, les appels d’outils et le flux de réponse reçu, sauf secrets et données interdites.
- Le raisonnement interne privé d’un modèle n’est pas garanti ni exportable. Ne pas l’inventer et ne pas prétendre l’avoir capturé.
- Stocker à la place un `explanation.json` vérifiable : objectif, faits utilisés, hypothèses, décision, outil appelé, résultat et limites.
- Si le fournisseur ne renvoie ni prompt exact ni explication : enregistrer l’événement `capture_unavailable` avec la raison, puis consigner le contexte connu dans les commentaires d’exécution **avant**, **pendant** et **après**, sans secret.

## 5. Ce que Bob doit livrer

### Lot 1 — Fondation sécurisée

- Thème bronze : `#6B4427`, `#59371F`, `#FFF3DF`, `#CD7F32`, sans casser l’accessibilité.
- Route `/chat` protégée et lien depuis `/dashboard`.
- `ChatFeed`, `ChatComposer`, `ModeKnob`, `SendKnob`, mascotte SVG.
- Contrats TypeScript et schémas de validation pour messages, documents, événements et exécutions IA.
- Interface `MemoryRepository` avec une implémentation GitHub et une implémentation de test locale.
- Outbox durable, idempotence par `event_id`, reprise après erreur.

### Lot 2 — IA et documents

- Streaming OpenAI via code serveur uniquement.
- Pièces jointes : 20 Mio maximum par fichier, 10 fichiers par envoi, 50 pages par OCR, limites configurables.
- OCR OpenAI Vision derrière un adaptateur.
- Catégorisation professionnelle avec catégories stables, alias, parent, statut et justification.

### Lot 3 — Contrôle et reprise

- Vue journal : action, phase, heure, résultat, preuve GitHub.
- Vue synchronisation : local / serveur / GitHub / conflit.
- Bouton arrêter, reprise de tâche, nouvel essai sans doublon.

## 6. Contrôles obligatoires

- Lint, tests unitaires et build doivent passer avant chaque push.
- Tests minimum : isolation propriétaire, absence de secret dans les journaux, idempotence, horodatage monotone par session, échec GitHub puis reprise, OCR « À vérifier », refus d’un fichier trop gros.
- Joindre un rapport `docs/handoff/BOB_IDE_REPORT_002.md` : fichiers modifiés, décisions, tests lancés, limites, captures d’écran et questions restantes.

## 7. Points oubliés ajoutés

- Consentement, conditions d’utilisation et politique de confidentialité avant le stockage de documents clients.
- Suppression, export et rectification des données d’un client.
- Révocation d’accès GitHub et rotation des jetons.
- Antivirus ou mise en quarantaine des fichiers entrants.
- Sauvegarde et restauration des dépôts clients.
- Alertes en cas d’échec de synchronisation ou de quota atteint.
- Mode administrateur seulement avec rôles séparés, jamais via le profil utilisateur.
- Facturation Stripe à brancher seulement après réponse de Gabriel : produit, prix, fréquence.
- Contrats exécutables manquants : schémas d’événements, transitions de tâches, erreurs, pagination, reprise et retour arrière.
- Paquet de prompts versionné : prompts système de l’application, configuration modèle, historique des changements et jeux d’évaluation.
- Matrice d’acceptation consolidée : le thème bronze et la mascotte remplacent les anciennes consignes noir/blanc.
- Consentement explicite avant la collecte réelle du journal complet.
- Procédure d’effacement documentée : supprimer un fichier Git ne le retire pas de l’historique.
- Validation réelle navigateur, mobile, toucher et accessibilité ; les fichiers V2/V3 sont seulement des simulations.

## 7 bis. Doppler et secrets

- Bob installe Doppler CLI uniquement sur sa machine ou son environnement de développement, puis se connecte avec `doppler login`.
- Accès limité au projet Doppler `lvx` et aux configurations Klerio nécessaires, en lecture seule si possible. Ne pas demander l’accès à tous les projets Doppler.
- Ne jamais coller un jeton Doppler, une clé API ou le résultat de `doppler secrets` dans le chat, Git, un ticket ou un journal.
- Produire seulement la liste des **noms** de secrets nécessaires, leur usage et l’environnement concerné.
- Lovable n’utilise pas un lien d’accès Doppler global : chaque secret requis est ajouté dans le coffre sécurisé Lovable du projet, par formulaire sécurisé. OpenAI et ElevenLabs y sont déjà enregistrés.
- Si Doppler doit devenir la source automatique des secrets en production, Bob propose une synchronisation dédiée au seul projet Klerio, avec rotation et révocation.

## 8. Questions à poser à Gabriel avant production

1. Un dépôt privé GitHub par client est-il accepté ?
2. Quelles données sont très sensibles : santé, identité, finances, juridique, mineurs ?
3. Combien de temps conserver les journaux et documents ?
4. Qui peut lire les journaux complets : client seul, équipe Klerio, administrateur ?
5. Quel produit Stripe vendre, à quel prix et à quelle fréquence ?

## Images de référence

- `docs/handoff/assets/mascotte-bronze-reference.png` : référence visuelle de la mascotte chat-pingouin bronze (à reproduire en SVG, Q-K-03).
- `docs/handoff/assets/mascotte-bronze-fourni.png` : variante bronze fournie par Gabriel, à considérer comme référence prioritaire avec la précédente.
- `docs/handoff/assets/mascotte-variantes-12-fourni.png` : planche de 12 variantes fournies par Gabriel (6 rendus réalistes + 6 pixel art : Le classique, Le joyeux, Le cool, Le dormeur, Le pirate, L'explorateur) — base pour les états/humeurs de la mascotte.
- `docs/handoff/assets/mascotte-poses-6-fourni.png` : collage de 6 poses fournies par Gabriel (assis, écharpe, saut, lunettes/hoodie, dormeur, poisson) — base pour les poses de la mascotte.
- `docs/handoff/assets/maquette-chat-reference.jpg` : référence d'ambiance de l'écran /chat (clients, conversation, documents catégorisés, journal horodaté). Les noms et chiffres affichés sont fictifs.
