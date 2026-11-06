# Klerio — Rapport 002 : Architecture GitHub-as-DB, réponses aux questions et plan de développement

**Date :** 2026-10-28  
**HEAD dépôt :** `eefc0cb`  
**Mode :** DEBUG actif  
**CERTIFIED_100 :** false  
**Rapporté par :** Bob IDE  
**Fichiers lus :** `docs/handoff/BOB_IDE_BRIEF_001.md`, `docs/handoff/BOB_IDE_QUESTIONS.md`, `roadmap.md`, `docs/specifications/KLERIO_CAHIER_DES_CHARGES_V1.md` (512 lignes), code source complet (`src/` — routes, styles, integrations, start, server, test)

---

## 1. Réponses aux 7 questions de `BOB_IDE_QUESTIONS.md`

### Q1 — Tableau de correspondance des 14 tables prévues (CDC §19) vers GitHub / tables techniques / suppression

Le CDC §19 décrit 14 objets logiques. Voici leur correspondance exacte :

| Objet CDC         | Chemin GitHub (dépôt mémoire `klerio-memory-<id>`)               | Table Supabase technique                                                                                                                                                     | Verdict                                     |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `Workspace`       | `manifest.json` à la racine                                      | ✅ **Table `workspaces`** — liaison `owner_id` → dépôt GitHub, politique, état sync. Nécessaire comme index central                                                          | **Table minimale conservée**                |
| `Session`         | `conversations/<yyyy>/<mm>/<session_id>/manifest.json`           | ✅ **Table `sessions`** — `id`, `workspace_id`, `status`, `last_cursor`, `github_synced_at`. Nécessaire pour reprise et événements en temps réel                             | **Table minimale conservée**                |
| `Message`         | `conversations/<yyyy>/<mm>/<session_id>/messages/<msg_id>.json`  | ❌ Pas de table. L'outbox suffit pour les messages en transit.                                                                                                               | **Supprimée — GitHub = source de vérité**   |
| `Document`        | `documents/originals/<yyyy>/<mm>/<doc_id>/` + métadonnées JSON   | ✅ **Table `documents`** — index léger (`id`, `workspace_id`, `fingerprint`, `github_path`, `status`). Nécessaire pour déduplication rapide et quota                         | **Table index-only conservée**              |
| `DocumentVersion` | `documents/versions/<doc_id>/<version_id>.json`                  | ❌ Pas de table. Chaque version = un commit GitHub.                                                                                                                          | **Supprimée — GitHub = historique**         |
| `Category`        | `registry/categories/<category_id>.json`                         | ❌ Pas de table. Lecture directe GitHub ou index reconstruit.                                                                                                                | **Supprimée — GitHub = source**             |
| `Entity`          | `registry/entities/<entity_id>.json`                             | ❌ Pas de table.                                                                                                                                                             | **Supprimée**                               |
| `Relation`        | `graph/edges/<relation_id>.json`                                 | ❌ Pas de table.                                                                                                                                                             | **Supprimée**                               |
| `Task`            | `tasks/<task_id>/manifest.json` + `tasks/<task_id>/steps/`       | ✅ **Table `tasks`** — `id`, `session_id`, `status`, `checkpoint_ref`. Nécessaire pour reprise serveur, verrous, état temps réel                                             | **Table opérationnelle conservée**          |
| `Action`          | `ai-runs/<yyyy>/<mm>/<dd>/<run_id>/request.json` + `result.json` | ❌ Pas de table. Chaque run = dossier GitHub.                                                                                                                                | **Supprimée**                               |
| `Question`        | `tasks/<task_id>/questions/<question_id>.json`                   | ✅ **Table `questions`** — `id`, `task_id`, `version`, `status`. Nécessaire pour rejet des cartes obsolètes côté serveur (CDC §8)                                            | **Table minimale conservée**                |
| `Event`           | `events/<yyyy>/<mm>/<dd>/<event_id>.json`                        | ✅ **Table `outbox`** — file durable avant sync GitHub (`event_id`, `payload_hash`, `status`, `attempts`, `github_commit_sha`). **Jamais annoncé GitHub avant commit réel.** | **Table outbox conservée (opérationnelle)** |
| `SyncRecord`      | Colonne dans `outbox` (`github_commit_sha`, `synced_at`)         | ❌ Fusionné dans `outbox`.                                                                                                                                                   | **Supprimée — colonne d'outbox**            |
| `Preference`      | `policies/<pref_id>.json`                                        | ❌ Pas de table pour les préférences documentaires. Les préférences UI légères (langue, mode) peuvent être dans une table `preferences` si besoin Supabase Realtime.         | **Optionnelle — décision différée**         |

**Résumé :** 14 objets → **5 tables techniques** (`workspaces`, `sessions`, `documents`, `tasks`, `questions`, `outbox`) + 0 table métier dans GitHub. Le reste est dans les fichiers GitHub.

**Note importante :** ces tables portent **uniquement** des données opérationnelles et des index reconstruisibles — aucune donnée privée de l'utilisateur. Elles peuvent être recréées à partir du dépôt GitHub en cas de perte.

---

### Q2 — Mécanisme de file d'envoi durable et reprise sans perte ni doublon

**Architecture outbox :**

```
Client → Server Function TanStack Start
    1. Écriture atomique dans `outbox` (Supabase) avec `event_id` UUID stable
       Status = PENDING
    2. Réponse HTTP 200 immédiate au client ("reçu serveur")
    3. Worker asynchrone (boucle serveur) :
       - Lit les PENDING par ordre de séquence
       - Tente le commit GitHub (API REST, lot cohérent)
       - Si succès → status = SYNCED, github_commit_sha enregistré
       - Si échec → status = RETRY, attempts++, next_attempt_at avec backoff
       - Si attempts > MAX → status = DEAD_LETTER → alerte
    4. Client SSE/polling : reçoit l'état réel (PENDING / SYNCED / FAILED)
```

**Idempotence :**

- Chaque `event_id` est **UUID v7** (ordonné temporellement), généré côté client avant l'envoi.
- Le serveur fait `INSERT ... ON CONFLICT (event_id) DO NOTHING`.
- GitHub : chaque commit contient l'`event_id` dans le message. Un double-commit est détecté par lecture du parent + présence du fichier `events/<id>.json`.
- Un crash entre commit réussi et mise à jour de l'outbox est résolu par réconciliation : relire le commit SHA sur GitHub et marquer SYNCED.

**Garantie formelle :** `AT_LEAST_ONCE` delivery vers GitHub + déduplication par `event_id` → effectivement `EXACTLY_ONCE` observable.

---

### Q3 — Modèle d'isolation client

**Décision (Q-K-04 du Brief §1) : un dépôt privé par propriétaire (workspace).**

```
GitHub organisation ou compte vgactech (service)
├── klerio-memory-<workspace_id_stable>/   ← client A (privé)
├── klerio-memory-<workspace_id_stable>/   ← client B (privé)
└── klerio-project-hub/                    ← code applicatif (séparé)
```

**Règles d'isolation :**

- Le `workspace_id_stable` est un identifiant opaque non devinable (UUID v4 haché).
- L'accès GitHub est via une **GitHub App** installée uniquement sur chaque dépôt client, avec permissions minimales (`contents:write`, `metadata:read`). Le token d'installation est généré à la demande et expire.
- Côté Supabase : chaque requête vérifie `workspace_id = auth.uid()` via RLS sur les 5 tables.
- Le code applicatif ne doit jamais recevoir une liste de tous les dépôts — seulement celui du workspace en cours.

**Limitations à documenter (CDC §12) :**

- GitHub impose 100 MB par fichier, ~1 GB recommandé par dépôt (soft), ~5 GB toléré.
- Git LFS **interdit** — les fichiers > 20 Mo sont refusés avec message explicatif.
- Limites API : 5000 requêtes/heure (GitHub App installée) ; 1000 requêtes/min par endpoint.
- En cas de quota atteint : message visible `"Archivage en attente — quota GitHub momentanément atteint"`, attente Retry-After, jamais de fausse confirmation.

---

### Q4 — Chiffrement et gestion des clés des données sensibles

**Niveau actuel (P0) :** dépôt privé GitHub = protection d'accès, **pas** chiffrement applicatif bout en bout.

**Plan par sensibilité (à valider avec Gabriel — Q8 du Brief) :**

| Niveau de sensibilité | Exemple                            | Mesure P0                                                         | Mesure future                                                  |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Faible                | Catégories, titres, métadonnées    | Dépôt privé, TLS                                                  | Aucune clé supplémentaire                                      |
| Moyen                 | Messages, documents courants       | Dépôt privé, TLS                                                  | Chiffrement AES-256-GCM avec clé dérivée du token utilisateur  |
| Élevé                 | Santé, finances, identité, mineurs | **À ne pas stocker** tant que chiffrement applicatif non en place | Clé par workspace, gérée en KMS (Supabase Vault ou équivalent) |

**Ce qui ne sera pas promis :** effacement instantané de l'historique Git (CDC §20 — procédure de purge documentée mais non triviale). Confirmé dans le rapport.

---

### Q5 — Limites de volume GitHub et comportement en cas de quota

| Limite              | Valeur                            | Comportement Klerio                              |
| ------------------- | --------------------------------- | ------------------------------------------------ |
| Taille fichier max  | 100 MB (rejet automatique GitHub) | Refus à 20 Mo côté produit, message explicatif   |
| Pièces par envoi    | Configurable, défaut 10           | Refus à 11+ avec compte visible                  |
| Pages OCR           | Configurable, défaut 50           | Refus au-delà, signalement                       |
| Quota API REST      | 5000 req/h (GitHub App)           | Backoff + file outbox, alerte si < 500 restantes |
| Quota secondaire    | 100 req/min                       | Rate limiting interne avant appel                |
| Volume dépôt (soft) | ~1 GB recommandé                  | Alerte à 800 MB, refus à 1.5 GB                  |

Aucun stockage externe implicite (Google Drive, S3, etc.) sans accord explicite. Aucun découpage automatique pour contourner les limites.

---

### Q6 — Format exact des journaux `before`, `during`, `after`, `failed`, `cancelled`

```json
{
  "event_id": "01932f4a-...",
  "schema_version": "1.0",
  "owner_id": "uuid-utilisateur",
  "workspace_id": "uuid-workspace",
  "session_id": "uuid-session",
  "task_id": "uuid-tâche-ou-null",
  "run_id": "uuid-run-ou-null",
  "actor": "user | klerio_agent | system",
  "event_type": "message.sent | ocr.started | github.synced | ...",
  "phase": "before | during | after | failed | cancelled",
  "occurred_at": "2026-10-28T14:23:01.123Z",
  "received_at": "2026-10-28T14:23:01.187Z",
  "client_observed_at": "2026-10-28T14:23:00.940Z",
  "sequence": 42,
  "correlation_id": "uuid-corrélation",
  "causation_id": "uuid-cause-ou-null",
  "command": "send_message | run_ocr | sync_github | ...",
  "parameters": { "message_length": 312 },
  "model_version": "gpt-4o-2024-11-20 | null",
  "prompt_version": "system-v1.2.0 | null",
  "inputs_fingerprint": ["sha256:abc...", "sha256:def..."],
  "outputs_fingerprint": ["sha256:xyz..."],
  "error": null,
  "duration_ms": 340,
  "attempts": 1,
  "status": "received | pending_github | synced_github | failed | cancelled",
  "github_commit_sha": "abc123... | null"
}
```

**Règles :**

- Jamais de token, mot de passe, clé API ni donnée biométrique dans ce JSON.
- `parameters` : expurgés des valeurs sensibles (taille oui, contenu non).
- `phase=during` : émis si l'action prend > 1 s (streaming, OCR longue).
- `phase=failed` : champ `error` avec `code`, `message`, `retryable: bool`, `correlation_id`.
- `phase=cancelled` : champ `reason: "user_requested | timeout | quota"`.

---

### Q7 — Ce qui peut être capturé chez chaque fournisseur IA et ce qui ne peut pas l'être

| Fournisseur             | Capturé                                                                                                                                  | Non capturé                                                                      | Comportement si absent                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **OpenAI GPT-4o**       | Prompt système exact, messages utilisateur envoyés, flux de réponse (`stream.ndjson`), tokens input/output, model_version, finish_reason | Raisonnement interne (CoT privé), probabilités de tokens, calculs intermédiaires | `capture_unavailable` event avec raison `"provider_reasoning_private"` |
| **ElevenLabs**          | Texte envoyé à la synthèse, voice_id, model_id, durée audio produite                                                                     | Modèle de synthèse interne, données d'entraînement                               | `capture_unavailable` event                                            |
| **OpenAI Vision (OCR)** | Prompt envoyé, pages envoyées (empreinte), réponse texte OCR, confidence si fournie                                                      | Traitement image interne                                                         | Résultat marqué `"À vérifier"` si confidence absente                   |

**`explanation.json` systématique :**

```json
{
  "run_id": "uuid",
  "objective": "Extraire le montant total de la facture",
  "facts_used": ["page 1 document_id ABC", "catégorie Factures"],
  "assumptions": ["le montant est en euros"],
  "decision": "Montant = 1234,56 €",
  "tool_called": "openai_vision",
  "result_summary": "OCR PASS, 2 pages traitées",
  "limits": ["page 2 qualité faible, résultat marqué À vérifier"],
  "capture_unavailable": []
}
```

---

## 2. Décisions d'architecture validées (à confirmer par Gabriel)

| Décision                                                             | Statut                       | Source             |
| -------------------------------------------------------------------- | ---------------------------- | ------------------ |
| GitHub privé = source de vérité documentaire                         | ✅ Décision Q-K-04           | Brief §1           |
| 1 dépôt privé par propriétaire                                       | ✅ Proposé                   | Brief §2 Q3        |
| Supabase = auth + 5 tables opérationnelles seulement                 | ✅ Décision                  | Brief §2           |
| Outbox durable avec idempotence `event_id`                           | ✅ Décision                  | CDC §12 + Brief §4 |
| Chiffrement applicatif = analyse de sensibilité **avant** activation | ⚠️ À valider avec Gabriel    | Brief §7 + CDC §20 |
| Git LFS interdit                                                     | ✅ Ferme                     | CDC §12            |
| `explanation.json` à la place du CoT privé                           | ✅ Décision                  | Brief §4 + CDC §3  |
| Consentement explicite avant collecte du journal complet             | ⚠️ À valider avec Gabriel    | Brief §7           |
| Stripe = hors scope P0 (attente réponse Gabriel)                     | ⚠️ Bloquant pour facturation | Brief §8 Q5        |

---

## 3. Réponses aux 5 questions restantes pour Gabriel (Brief §8)

Ces questions **bloquent des choix d'implémentation** et doivent être répondues avant certaines phases :

| #        | Question                                                          | Impact sur le code                     | Bloque            |
| -------- | ----------------------------------------------------------------- | -------------------------------------- | ----------------- |
| **Q8-1** | Un dépôt privé GitHub par client est-il accepté ?                 | Architecture isolation complète        | P0 GitHub service |
| **Q8-2** | Quelles données sont très sensibles (santé, finances, mineurs…) ? | Niveau de chiffrement applicatif       | P0 chiffrement    |
| **Q8-3** | Durée de conservation des journaux et documents ?                 | Table `policies`, logique de rétention | P1 rétention      |
| **Q8-4** | Qui peut lire les journaux complets ?                             | RLS Supabase, UI Journal (UI-17)       | P0 journal        |
| **Q8-5** | Quel produit Stripe, à quel prix et quelle fréquence ?            | Stripe integration, facturation        | P3+               |

---

## 4. État actuel du code — avant/après par zone

### Zone 1 — Thème visuel (`src/styles.css`)

|                | AVANT (HEAD `eefc0cb`)                     | APRÈS (Lot 1)                                                   |
| -------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `--background` | `oklch(1 0 0)` (blanc pur)                 | `oklch(0.27 0.06 45)` ≈ `#6B4427` (bronze profond)              |
| `--foreground` | `oklch(0.129 0.042 264.695)` (quasi-noir)  | `oklch(0.97 0.02 85)` ≈ `#FFF3DF` (crème)                       |
| `--primary`    | `oklch(0.208 0.042 265.755)` (bleu sombre) | `oklch(0.62 0.14 55)` ≈ `#CD7F32` (bronze métallique)           |
| `--card`       | `oklch(1 0 0)`                             | `oklch(0.22 0.05 42)` ≈ `#59371F` (brun foncé)                  |
| Fichier source | `src/styles.css` ligne 66–98               | Même fichier, même lignes — remplacement des valeurs uniquement |

### Zone 2 — Routes existantes (intactes, à ne pas casser)

| Fichier                                   | État          | Note                                         |
| ----------------------------------------- | ------------- | -------------------------------------------- |
| `src/routes/__root.tsx`                   | ✅ Intact     | Shell SSR + QueryClientProvider + Toaster    |
| `src/routes/index.tsx`                    | ✅ Intact     | Redirige vers /auth ou /dashboard            |
| `src/routes/auth.tsx`                     | ✅ Intact     | Email + Google + Lovable OAuth               |
| `src/routes/_authenticated/route.tsx`     | ✅ Intact     | Guard Supabase auth                          |
| `src/routes/_authenticated/dashboard.tsx` | 🔄 À enrichir | Ajouter lien vers `/chat` (ne pas remplacer) |

### Zone 3 — Ce qui manque (P0 intégral)

| Élément                      | Fichier cible                          | Dépendances                             |
| ---------------------------- | -------------------------------------- | --------------------------------------- |
| Route `/chat` protégée       | `src/routes/_authenticated/chat.tsx`   | Route existante, guard existant         |
| Composant `ChatFeed`         | `src/components/chat/ChatFeed.tsx`     | Types message                           |
| Composant `ChatComposer`     | `src/components/chat/ChatComposer.tsx` | Types brouillon                         |
| Composant `ModeKnob`         | `src/components/chat/ModeKnob.tsx`     | CDC §6 — bouton physiquement déplaçable |
| Composant `SendKnob`         | `src/components/chat/SendKnob.tsx`     | CDC §6 — glisse à gauche                |
| Mascotte SVG chat-pingouin   | `src/components/chat/Mascot.tsx`       | SVG composé, déplaçable                 |
| Contrats TypeScript          | `src/types/klerio.ts`                  | Schémas message/event/document/task     |
| Interface `MemoryRepository` | `src/lib/memory/repository.ts`         | Abstraction GitHub + impl. test         |
| Implémentation GitHub        | `src/lib/memory/github.ts`             | Server Function uniquement              |
| Implémentation test locale   | `src/lib/memory/local.ts`              | Pour tests unitaires                    |
| Outbox durable               | `src/lib/outbox.ts`                    | Supabase table `outbox`                 |
| Server Functions API         | `src/server-functions/`                | TanStack Start createServerFn           |
| Secrets requis Doppler       | Voir §5 ci-dessous                     | —                                       |

---

## 5. Liste des secrets nécessaires (noms uniquement — aucune valeur)

Secrets déjà disponibles dans Doppler projet `lvx` (à utiliser via Server Functions — jamais côté client) :

| Nom de variable                       | Usage Klerio                        | Environnement              |
| ------------------------------------- | ----------------------------------- | -------------------------- |
| `OPENAI_API_KEY` ou `OPENAI_API_KEY2` | Streaming GPT-4o + OCR Vision       | Server Function uniquement |
| `ELEVENLABS_API_KEY`                  | TTS voix (Lot 2)                    | Server Function uniquement |
| `GITHUB_TOKEN` ou `GITHUB_API_KEY`    | Accès GitHub API pour dépôt mémoire | Server Function uniquement |
| `API_KEY_SUPABASE`                    | Client Supabase serveur             | Server Function            |
| `SUPABASE_URL`                        | URL projet Supabase                 | Client + Server            |

Secrets **manquants à créer** (à envoyer via formulaire sécurisé Lovable) :

| Nom proposé                     | Usage                                               | Priorité    |
| ------------------------------- | --------------------------------------------------- | ----------- |
| `KLERIO_GITHUB_APP_ID`          | GitHub App ID pour accès aux dépôts mémoire clients | P0          |
| `KLERIO_GITHUB_APP_PRIVATE_KEY` | Clé privée GitHub App (PEM)                         | P0          |
| `KLERIO_GITHUB_ORG_OR_USER`     | Compte GitHub qui héberge les dépôts mémoire        | P0          |
| `KLERIO_OUTBOX_MAX_ATTEMPTS`    | Configurable — défaut 5                             | P0 (config) |

---

## 6. Plan de développement — 3 lots détaillés

### Lot 1 — Fondation sécurisée (P0)

**Condition de sortie (CDC §25) :** un parcours complet texte → événement → journal → visible dans l'UI, restaurable sans perte, sans doublon.

**Tâches ordonnées :**

1. **Thème bronze** — Modifier `src/styles.css` (lignes 64–133) : remplacer les valeurs oklch blanc/bleu par la palette bronze. Vérifier contraste WCAG AA (ratio ≥ 4.5:1 corps, 3:1 grands titres).

2. **Types TypeScript** — Créer `src/types/klerio.ts` : `KlerioMessage`, `KlerioEvent`, `KlerioDocument`, `KlerioTask`, `KlerioQuestion`, `EventPhase`, `TaskStatus`, schémas Zod associés.

3. **Interface `MemoryRepository`** — `src/lib/memory/repository.ts` : définit `writeEvent()`, `readSession()`, `writeDocument()`, `getCategories()`. `src/lib/memory/local.ts` : implémentation Map en mémoire pour les tests. `src/lib/memory/github.ts` : **stub honnête** — `throw new Error("GitHub backend not yet wired")` avec TODO documenté jusqu'à ce que les secrets soient disponibles.

4. **Outbox durable** — `src/lib/outbox.ts` : classe `Outbox` avec `enqueue()`, `processNext()`, `getStatus()`. Table Supabase `outbox` (migration SQL à fournir). Idempotence `event_id`.

5. **Server Functions** — `src/server-functions/sessions.ts` : `createSession`, `getSession`. `src/server-functions/messages.ts` : `sendMessage` (enqueue → outbox → réponse HTTP 200 immédiate). CSRF protégé par `csrfMiddleware` déjà en place dans `src/start.ts`.

6. **Route `/chat`** — `src/routes/_authenticated/chat.tsx` : protégée par le guard existant, charge la session depuis Server Function, rend `ChatFeed` + `ChatComposer`.

7. **Composants chat** — `ChatFeed`, `ChatComposer`, `ModeKnob` (3 positions, draggable, clavier), `SendKnob` (glisse à gauche), `Mascot` (SVG chat-pingouin bronze, flottante, déplaçable).

8. **Lien dashboard → /chat** — Ajouter `<Link to="/chat">Ouvrir le chat</Link>` dans `dashboard.tsx` (2 lignes, sans casser l'existant).

9. **Tests unitaires obligatoires** (CDC §24 + Brief §6) :
   - Isolation propriétaire : `outbox.enqueue()` avec `owner_id_A` ne retourne pas d'événements de `owner_id_B`
   - Absence de secret dans les journaux : `event.parameters` ne contient ni token ni password
   - Idempotence : double `enqueue()` avec même `event_id` = 1 seule ligne en base
   - Horodatage monotone : 100 événements consécutifs ont `sequence` croissant par session
   - Fichier trop gros : `validateDocument(21_000_000)` → `{ ok: false, reason: "size_exceeded" }`
   - OCR `"À vérifier"` : si `confidence < 0.85` → `status = "to_review"` dans le résultat

10. **Lint + build** doivent passer : `bun run lint && bun run build`

### Lot 2 — IA et documents (P1)

1. Streaming OpenAI GPT-4o via Server Function (jamais côté client, jamais de clé exposée).
2. OCR OpenAI Vision derrière `OcrAdapter` interface remplaçable — résultat marqué `"À vérifier"` si confidence absente ou < seuil.
3. Pièces jointes : validation type réel (magic bytes), taille ≤ 20 Mo, 10 pièces max.
4. Antivirus/quarantaine : détection heuristique (magic bytes interdit : `.exe`, macros DOCX/XLSX) avant tout envoi vers IA.
5. Catégorisation automatique : appel GPT-4o, retour catégorie + justification publique, seuils configurables (CDC §13).
6. Connexion GitHub réelle : GitHub App, création dépôt `klerio-memory-<id>`, commits atomiques, arborescence CDC §46.

### Lot 3 — Contrôle et reprise (P2)

1. Vue Journal (UI-17) : liste événements avec phase, heure, statut GitHub.
2. Vue Synchronisation (UI-22) : local / outbox / GitHub / conflit.
3. Bouton arrêter : `POST /tasks/:id/control` `{ action: "cancel" }`.
4. Reprise de tâche : `checkpoint_ref` dans table `tasks`, reprise via Server Function.
5. ElevenLabs TTS voix (Lot 2 voice).
6. Export données client (UI-20).

---

## 7. Contraintes absolues pour tout le code

1. **Aucun secret côté client** — toutes les clés API passent par Server Functions TanStack Start.
2. **Jamais `"enregistré dans GitHub"` avant commit SHA confirmé** — CDC invariant §1 point 4.
3. **OCR incertain = `"À vérifier"`** — jamais de confiance inventée.
4. **`event_id` UUID v7** — idempotence garantie.
5. **`vite.config.ts` intouchable** — preset Lovable.
6. **Pas de force-push / rebase / amend** sur commits publiés — `AGENTS.md`.
7. **Git LFS interdit** — refus explicite à 20 Mo.
8. **Mode DEBUG actif** — logs détaillés tant que non désactivé explicitement.
9. **WCAG 2.2 AA** — contraste, focus visible, cibles tactiles 44×44 px.
10. **Lint + tests + build verts** avant chaque push.

---

## 8. Éléments oubliés complétés automatiquement

Les points suivants (Brief §7) ne sont pas explicitement demandés dans les tâches mais sont **requis par le CDC** — je les signale et les intègre au plan :

| Élément oublié                                      | Où intégrer                                                               | Lot                |
| --------------------------------------------------- | ------------------------------------------------------------------------- | ------------------ |
| Consentement avant collecte du journal              | UI-02 « Première ouverture » + Server Function validation `consent_given` | P0 (Lot 1)         |
| Suppression / export / rectification                | Server Function `POST /privacy/requests`, UI-20                           | P2 (Lot 3)         |
| Révocation accès GitHub + rotation tokens           | GitHub App : `DELETE /installations/:id`, UI-19                           | P2                 |
| Alerte échec sync ou quota atteint                  | Événement `github.quota_warning` dans outbox + UI-21                      | P0 (Lot 1 partial) |
| Mode administrateur séparé des profils utilisateurs | Route `/_admin/` distincte, jamais via profil utilisateur                 | P3                 |
| Paquet de prompts versionné                         | `src/prompts/system-v1.0.0.ts` + changelog                                | P1 (Lot 2)         |
| Procédure d'effacement documentée                   | `docs/procedures/DATA_DELETION.md` (Git history ≠ effacement complet)     | P0 documentation   |

---

## 9. Liens entre rapport et actions futures

- Ce rapport est la réponse à `docs/handoff/BOB_IDE_QUESTIONS.md` — les 7 cases `[ ]` peuvent être cochées.
- Ce rapport correspond au livrable demandé par `BOB_IDE_BRIEF_001.md §6` : `docs/handoff/BOB_IDE_REPORT_002.md` (un alias sera créé).
- Le rapport 003 sera produit après le Lot 1 (thème + route /chat + types + outbox + tests).

---

## 10. Validation requise avant développement

**⚠️ Je ne démarre aucun développement avant que l'utilisateur confirme ce rapport.**

Questions bloquantes à trancher :

| #     | Question                                                                        | Décision demandée  |
| ----- | ------------------------------------------------------------------------------- | ------------------ |
| **A** | Les 5 tables Supabase proposées sont-elles validées ?                           | OUI / modifier     |
| **B** | 1 dépôt GitHub privé par client est-il confirmé ?                               | OUI / autre modèle |
| **C** | Quelle est la sensibilité des données (Q8-2) ?                                  | Réponse Gabriel    |
| **D** | Qui peut lire les journaux complets (Q8-4) ?                                    | Réponse Gabriel    |
| **E** | Les secrets manquants (`KLERIO_GITHUB_APP_*`) sont-ils disponibles ou à créer ? | Confirmation       |

---

_Mode DEBUG actif. CERTIFIED_100=false. Rapport non écrasable. Prochain rapport : 003 après Lot 1._
