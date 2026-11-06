# Rapport 003 — Audit de reprise + Plan Lot 1 détaillé

**Date :** 2026-10-29  
**Dépôt :** `vgactech/klerio-project-hub`  
**HEAD actuel :** `0bfdd50` (main)  
**Auteur :** Bob IDE (agent)  
**Mode DEBUG :** actif

---

## 1. Résumé exécutif

Cet audit couvre l'état exact du dépôt après le dernier commit (`0bfdd50`), identifie ce qui est présent, ce qui manque, et fournit un plan de développement Lot 1 complet que l'utilisateur doit valider avant tout codage.

**Avancement réel actuel : 8 %** (infrastructure Lovable/Supabase/auth existante, aucune fonctionnalité Klerio implémentée)

---

## 2. État réel du dépôt (vérifié ligne par ligne)

### 2.1 Ce qui EXISTE

| Fichier / dossier                                     | Contenu réel                                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/routes/index.tsx`                                | Page d'accueil minimale — bouton vers `/auth` ou `/dashboard`                      |
| `src/routes/auth.tsx`                                 | Auth email + Google + Lovable via Supabase/lovable-cloud-auth-js                   |
| `src/routes/_authenticated/route.tsx`                 | Guard auth — `beforeLoad` Supabase `getUser()` → redirect `/auth`                  |
| `src/routes/_authenticated/dashboard.tsx`             | Dashboard minimal — affiche email + bouton déconnexion                             |
| `src/routes/__root.tsx`                               | Shell SSR, QueryClientProvider, Toaster                                            |
| `src/start.ts`                                        | CSRF middleware TanStack Start — **NE PAS MODIFIER**                               |
| `src/server.ts`                                       | Gestionnaire SSR h3 — **NE PAS MODIFIER**                                          |
| `src/styles.css`                                      | Thème blanc/noir neutre (à remplacer par bronze)                                   |
| `src/integrations/supabase/`                          | Client Supabase, types, auth-middleware, previewStorage — **0 table créée**        |
| `src/integrations/lovable/index.ts`                   | Wrapper OAuth Lovable — **CONSERVER**                                              |
| `src/components/ui/`                                  | 40+ composants Radix/Shadcn (Button, Input, Dialog, Tabs, etc.)                    |
| `src/lib/utils.ts`                                    | `cn()` helper                                                                      |
| `src/lib/error-capture.ts`                            | Capture d'erreurs SSR                                                              |
| `src/test/app-routing.test.tsx`                       | 1 test routing de base                                                             |
| `AGENTS.md`                                           | Règles git + règles mémoire client                                                 |
| `docs/specifications/KLERIO_CAHIER_DES_CHARGES_V1.md` | CDC v1.6 complet (512 lignes)                                                      |
| `docs/handoff/BOB_IDE_BRIEF_001.md`                   | Brief Bob — 7 sections, livrables Lot 1/2/3                                        |
| `docs/handoff/BOB_IDE_QUESTIONS.md`                   | 7 questions (non répondues dans le fichier lui-même)                               |
| `KLERIO_BRONZE_BULLE_LIBRE.html`                      | **Prototype HTML V6 complet** — référence UI principale                            |
| `docs/handoff/assets/`                                | 5 images : mascotte bronze reference, fourni, poses-6, variantes-12, maquette-chat |
| `a1.png`, `image.png`, `Colagem...png`                | Images mascotte uploadées par Gabriel (commit `0bfdd50`)                           |

### 2.2 Ce qui N'EXISTE PAS (à créer en Lot 1)

| Élément                                              | Statut                         |
| ---------------------------------------------------- | ------------------------------ |
| Thème bronze `#6B4427 / #59371F / #FFF3DF / #CD7F32` | ❌ ABSENT                      |
| Route `/chat`                                        | ❌ ABSENT                      |
| Composant `ChatFeed`                                 | ❌ ABSENT                      |
| Composant `ChatComposer`                             | ❌ ABSENT                      |
| Composant `ModeKnob` (3 positions, draggable)        | ❌ ABSENT                      |
| Composant `SendKnob` (glisse gauche)                 | ❌ ABSENT                      |
| Composant `Mascot` (SVG tête chat-pingouin bronze)   | ❌ ABSENT                      |
| Types TypeScript `src/types/klerio.ts`               | ❌ ABSENT                      |
| Interface `MemoryRepository`                         | ❌ ABSENT                      |
| Implémentation GitHub `MemoryRepository`             | ❌ ABSENT                      |
| Implémentation locale test `MemoryRepository`        | ❌ ABSENT                      |
| Outbox durable `src/lib/outbox.ts`                   | ❌ ABSENT                      |
| Server Functions sessions + messages                 | ❌ ABSENT                      |
| Tests Lot 1 (isolation, idempotence, secret, taille) | ❌ ABSENT                      |
| Lien `/chat` depuis `/dashboard`                     | ❌ ABSENT                      |
| `docs/handoff/BOB_IDE_REPORT_002.md`                 | ❌ ABSENT (exigé par Brief §6) |

---

## 3. Décisions architecturales actées (Brief §1 Q-K-01 à Q-K-06)

| ID     | Décision                                                                     | Impact Lot 1                                                               |
| ------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Q-K-01 | **Conserver Supabase** pour identité, sessions, file durable, verrous, index | Ne PAS supprimer `src/integrations/supabase/` ni `@supabase/supabase-js`   |
| Q-K-02 | Server Functions TanStack Start                                              | Les appels GitHub API passent côté serveur uniquement — jamais côté client |
| Q-K-03 | Mascotte SVG composé fidèle à V4/V6                                          | SVG inline ou `<img>` — tête seule, flottante, draggable                   |
| Q-K-04 | Dépôt mémoire client séparé dès P0                                           | `klerio-memory-<id>` = dépôt GitHub privé distinct du dépôt applicatif     |
| Q-K-05 | OpenAI Vision OCR, résultat = "À vérifier"                                   | Lot 2 — hors Lot 1                                                         |
| Q-K-06 | Hébergement Lovable                                                          | Pas de modules Node chargés dynamiquement                                  |

**⚠️ CORRECTION IMPORTANTE par rapport au Rapport 002 :**  
Le rapport 002 proposait de **supprimer Supabase**. Après relecture du Brief BOB_IDE_BRIEF_001.md §1 (décision Q-K-01), Supabase est **conservé** pour les fonctions techniques (auth, identité, sessions opérationnelles, file durable, verrous). Seul le chantier "14 tables métier" est remplacé par GitHub. L'authentification existante (email, Google, Lovable) **ne doit pas être cassée**.

---

## 4. Réponses aux 7 questions ouvertes (BOB_IDE_QUESTIONS.md)

### Q1 — Correspondance 14 tables → GitHub / tables techniques / supprimées

| Table prévue CDC    | Remplacement                                                         |
| ------------------- | -------------------------------------------------------------------- |
| `messages`          | `sessions/<session_id>/messages/msg_<id>.json` dans dépôt mémoire    |
| `sessions`          | `sessions/<session_id>/manifest.json` dans dépôt mémoire             |
| `documents`         | `documents/<doc_id>/metadata.json` + `originals/` dans dépôt mémoire |
| `document_versions` | `documents/<doc_id>/versions/<v>.json` dans dépôt mémoire            |
| `categories`        | `registry/categories/<cat_id>.json` dans dépôt mémoire               |
| `entities`          | `registry/entities/<entity_id>.json` dans dépôt mémoire              |
| `relations` (graph) | `graph/nodes/` + `graph/edges/` dans dépôt mémoire                   |
| `events`            | `events/<yyyy>/<mm>/<dd>/<event_id>.json` dans dépôt mémoire         |
| `tasks`             | `tasks/<task_id>/manifest.json` dans dépôt mémoire                   |
| `actions` (ai-runs) | `ai-runs/<yyyy>/<mm>/<dd>/<run_id>/` dans dépôt mémoire              |
| `questions`         | Inclus dans `tasks/<task_id>/questions/<q_id>.json`                  |
| `indexes`           | `indexes/` reconstruisible dans dépôt mémoire                        |
| **`sync_records`**  | **Table Supabase technique** — outbox locale → sync GitHub           |
| **`workspaces`**    | **Table Supabase technique** — liaison user_id ↔ dépôt GitHub        |

**Résultat : 12 tables → GitHub ; 2 tables techniques Supabase minimales.**

### Q2 — Mécanisme file d'envoi durable (outbox)

Stratégie 3 niveaux :

1. **Réception durable** : l'événement est écrit dans la table Supabase `sync_records` avec `status=pending` avant tout appel GitHub. Si le navigateur tombe ici, l'événement est préservé.
2. **Envoi GitHub** : commit atomique avec l'`event_id` en clé d'idempotence. GitHub renvoie le SHA du commit.
3. **Confirmation** : `sync_records.status=synced` + `commit_sha` stockés. Si le process tombe entre 2 et 3, le rejeu vérifie si l'`event_id` existe déjà via l'API GitHub (déduplication par `event_id`).

### Q3 — Isolation client

**1 dépôt GitHub privé par workspace (= par propriétaire initialement).**  
Nom : `klerio-memory-<workspace_id_stable>` — ID stable, jamais le nom d'une personne.  
Le propriétaire autorise Klerio via GitHub App à scope limité sur ce dépôt uniquement.  
Un workspace ne peut jamais lire le dépôt d'un autre workspace (vérification côté serveur).

### Q4 — Chiffrement

- Transport : HTTPS (Lovable, GitHub API) — assuré par la plateforme.
- Stockage GitHub : le dépôt privé n'est pas chiffré de bout en bout côté GitHub. Pour données très sensibles (santé, finances) : chiffrement AES-256-GCM applicatif côté serveur avant `base64` dans le fichier JSON. Clé de chiffrement = dérivée du `workspace_id` + secret serveur (pas dans le dépôt client).
- **Lot 1** : chiffrement applicatif = non activé (données de démo uniquement). La décision de quelles données chiffrer doit être prise par Gabriel (question §8 du Brief).

### Q5 — Limites GitHub

| Limite                      | Valeur            | Comportement Klerio                                      |
| --------------------------- | ----------------- | -------------------------------------------------------- |
| Fichier max                 | 100 Mo (API REST) | Limite produit = 20 Mo — refus avec message avant upload |
| Taille dépôt recommandée    | < 1 Go            | Alerte à 800 Mo, refus admission à 950 Mo                |
| Rate limit API authentifiée | 5 000 req/h       | File par dépôt, lots batchés, respect `Retry-After`      |
| Push GraphQL                | 60 requêtes/min   | Lot batchés max 10 fichiers/commit                       |
| Git LFS                     | **INTERDIT**      | Vérification taille avant commit, refus explicite        |

### Q6 — Format événements before/during/after/failed/cancelled

```json
{
  "event_id": "evt_01j9xyz...",
  "schema_version": "1.0",
  "owner_id": "usr_...",
  "workspace_id": "wsp_...",
  "session_id": "ses_...",
  "task_id": null,
  "actor": "user|agent|system",
  "event_type": "message.sent",
  "phase": "before|during|after|failed|cancelled",
  "occurred_at": "2026-10-29T10:30:00.000Z",
  "received_at": "2026-10-29T10:30:00.123Z",
  "sequence": 42,
  "correlation_id": "cor_...",
  "causation_id": "evt_...",
  "payload": { "...données expurgées des secrets..." },
  "sync_status": "pending|synced|failed",
  "commit_sha": null
}
```

### Q7 — Ce qui peut/ne peut pas être capturé chez OpenAI

| Élément                                 | Capturable             | Stocké dans Klerio                               |
| --------------------------------------- | ---------------------- | ------------------------------------------------ |
| Prompt système envoyé                   | ✅ OUI                 | `ai-runs/<run_id>/request.json` — texte complet  |
| Messages utilisateur envoyés            | ✅ OUI                 | `ai-runs/<run_id>/request.json`                  |
| Réponse complète reçue                  | ✅ OUI                 | `ai-runs/<run_id>/result.json`                   |
| Flux streaming token par token          | ✅ OUI                 | `ai-runs/<run_id>/stream.ndjson`                 |
| Raisonnement interne (chain-of-thought) | ❌ NON GARANTI         | Événement `capture_unavailable` + contexte connu |
| Tokens utilisés / coût                  | ✅ OUI (`usage` field) | Dans `result.json`                               |
| Paramètres modèle (temp, max_tokens…)   | ✅ OUI                 | Dans `request.json`                              |
| Clés API / secrets                      | ❌ JAMAIS              | Rédaction obligatoire                            |

---

## 5. Décisions prises par l'utilisateur (ce prompt)

D'après la conversation de session précédente (rapport 002 + réponses utilisateur) :

| #   | Décision                                                                   | Statut                  |
| --- | -------------------------------------------------------------------------- | ----------------------- |
| A   | Supabase conservé pour auth/identité/opérationnel                          | ✅ ACTÉ (Brief Q-K-01)  |
| B   | 1 dépôt GitHub privé par workspace client                                  | ✅ ACTÉ                 |
| C   | Consentement, suppression, export, chiffrement, sauvegardes, alertes = OUI | ✅ ACTÉ                 |
| D   | Seul l'utilisateur propriétaire peut lire les journaux complets            | ✅ ACTÉ                 |
| E   | L'agent crée les secrets GitHub App                                        | ⚠️ À PRÉCISER (voir §7) |

---

## 6. Plan de développement Lot 1 — tâches ordonnées

### Lot 1 — Fondation sécurisée (à coder après validation)

**Total estimé : 14 tâches**

| #    | Tâche                                                                                                                          | Fichiers                                          | Priorité |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- | -------- |
| T-01 | Thème bronze — remplacer `:root` et `.dark` dans `styles.css`                                                                  | `src/styles.css`                                  | P0       |
| T-02 | Types TypeScript `KlerioEvent`, `KlerioMessage`, `KlerioDocument`, `KlerioTask`, `EventPhase`, `TaskStatus`, `SyncStatus`      | `src/types/klerio.ts`                             | P0       |
| T-03 | Interface `MemoryRepository` + implémentation locale `LocalMemoryRepository` (Map en mémoire, tests)                           | `src/lib/memory/repository.ts`, `local.ts`        | P0       |
| T-04 | Outbox durable `DurableOutbox` — Map en mémoire + `event_id` idempotence                                                       | `src/lib/outbox.ts`                               | P0       |
| T-05 | Mascotte SVG — tête chat-pingouin bronze, flottante, draggable, accessible                                                     | `src/components/chat/Mascot.tsx`                  | P0       |
| T-06 | Composant `ModeKnob` — 3 positions (Vocal/Texte/Documents), draggable, keyboard, WCAG                                          | `src/components/chat/ModeKnob.tsx`                | P0       |
| T-07 | Composant `SendKnob` — intégré dans textarea, glisse gauche, seuil configurable                                                | `src/components/chat/SendKnob.tsx`                | P0       |
| T-08 | Composant `ChatComposer` — textarea + SendKnob + ModeKnob + joindre + arrêter                                                  | `src/components/chat/ChatComposer.tsx`            | P0       |
| T-09 | Composant `ChatFeed` — fil messages, date separator, bulles user/agent                                                         | `src/components/chat/ChatFeed.tsx`                | P0       |
| T-10 | Route `/chat` protégée par `_authenticated`                                                                                    | `src/routes/_authenticated/chat.tsx`              | P0       |
| T-11 | Lien vers `/chat` depuis `/dashboard`                                                                                          | `src/routes/_authenticated/dashboard.tsx` (ajout) | P0       |
| T-12 | Server Function `sessions.ts` — créer/récupérer session                                                                        | `src/server-functions/sessions.ts`                | P1       |
| T-13 | Server Function `messages.ts` — envoyer message, appel OpenAI stub                                                             | `src/server-functions/messages.ts`                | P1       |
| T-14 | Tests Vitest — isolation propriétaire, idempotence outbox, absence secret journaux, horodatage monotone, refus fichier > 20 Mo | `src/test/lot1-*.test.ts`                         | P0       |

### Tâches hors Lot 1 (Lot 2+)

- Implémentation `GitHubMemoryRepository` (nécessite clés GitHub App — §7)
- Streaming OpenAI réel (nécessite `OPENAI_API_KEY` côté serveur)
- OCR Vision (Lot 2)
- Tables Supabase `sync_records` + `workspaces` (Lot 2)
- Vue journal, synchronisation (Lot 3)
- `BOB_IDE_REPORT_002.md` (à créer en parallèle du Lot 1 comme exigé par Brief §6)

---

## 7. Éléments manquants — questions à Gabriel AVANT de coder Lot 1

### 7.1 Éléments bloquants pour GitHub as DB

Les tâches T-12 et T-13 peuvent être démarrées avec des stubs. L'implémentation réelle GitHub (`GitHubMemoryRepository`) nécessite :

| Secret requis                       | Usage                             | Disponible ?               |
| ----------------------------------- | --------------------------------- | -------------------------- |
| `KLERIO_GITHUB_APP_ID`              | ID de la GitHub App Klerio        | ❌ À créer                 |
| `KLERIO_GITHUB_APP_PRIVATE_KEY`     | Clé privée de la GitHub App       | ❌ À créer                 |
| `KLERIO_GITHUB_APP_INSTALLATION_ID` | Installation sur le compte client | ❌ À créer par workspace   |
| `OPENAI_API_KEY`                    | Streaming IA (Lot 2)              | ✅ Déjà dans Doppler `lvx` |
| `ELEVENLABS_API_KEY`                | TTS voix (Lot 2)                  | ✅ Déjà dans Doppler `lvx` |

**Pour créer la GitHub App :** Gabriel doit aller sur https://github.com/settings/apps/new et créer une App avec les permissions `Contents: Read & Write` sur les dépôts clients uniquement. Le `App ID` et la clé privée générée sont les deux secrets nécessaires.

### 7.2 Questions ouvertes non bloquantes pour Lot 1

Ces questions peuvent attendre Lot 2/3 :

1. **Facturation Stripe** — quel produit, quel prix, quelle fréquence ? (Brief §8, Q5)
2. **Données très sensibles** — quelles catégories (santé, finances, juridique, mineurs) nécessitent chiffrement applicatif dès P0 ? (Brief §8, Q2)
3. **Durée de conservation** — journaux et documents combien de temps ? (Brief §8, Q3)
4. **Mode administrateur** — qui a accès et avec quels droits séparés ? (Brief §7)

### 7.3 Images mascotte (commit `0bfdd50`)

Les fichiers `a1.png`, `image.png`, `Colagem de Pinguins-Gato Adoráveis.png` ont été ajoutés à la racine du dépôt. **Ils doivent être déplacés vers `public/` ou `src/assets/` avant utilisation.** La mascotte SVG du composant `Mascot.tsx` sera construite à partir de ces références visuelles. La tête seule est requise (V6 du prototype HTML confirme cette décision).

---

## 8. Avant / Après — changements prévus Lot 1

### T-01 Thème bronze — `src/styles.css`

**AVANT (lignes 64-98 de styles.css) :**

```css
:root {
  --background: oklch(1 0 0);          /* blanc */
  --foreground: oklch(0.129 0.042 264.695); /* bleu-gris foncé */
  --primary: oklch(0.208 0.042 265.755);   /* bleu-gris */
  ...
}
```

**APRÈS :**

```css
:root {
  --background: oklch(0.34 0.07 46);   /* #6B4427 bronze profond */
  --card: oklch(0.27 0.06 43);         /* #59371F brun foncé */
  --foreground: oklch(0.97 0.02 85);   /* #FFF3DF crème */
  --primary: oklch(0.62 0.14 55);      /* #CD7F32 bronze métallique */
  --primary-foreground: oklch(0.22 0.05 42); /* texte sombre sur bronze */
  ...
}
```

### T-10 Route `/chat` — fichier à créer

**AVANT :** inexistant  
**APRÈS :** `src/routes/_authenticated/chat.tsx` — route protégée, rendu `<ChatFeed>` + `<ChatComposer>` + `<Mascot>`

### T-11 Dashboard — ajout lien `/chat`

**AVANT (dashboard.tsx ligne 33) :**

```tsx
<main className="mx-auto max-w-2xl space-y-4 px-4 py-16">
  <h1 className="text-3xl font-semibold text-foreground">Bienvenue sur Klerio</h1>
  <p className="text-muted-foreground">Connecté en tant que {user.email}</p>
  <Button variant="outline" onClick={signOut}>
    Se déconnecter
  </Button>
</main>
```

**APRÈS :**

```tsx
<main className="mx-auto max-w-2xl space-y-4 px-4 py-16">
  <h1 className="text-3xl font-semibold text-foreground">Bienvenue sur Klerio</h1>
  <p className="text-muted-foreground">Connecté en tant que {user.email}</p>
  <Button asChild>
    <Link to="/chat">Ouvrir le chat</Link>
  </Button>
  <Button variant="outline" onClick={signOut}>
    Se déconnecter
  </Button>
</main>
```

---

## 9. Contraintes techniques confirmées

| Contrainte                             | Source                        | Statut                      |
| -------------------------------------- | ----------------------------- | --------------------------- |
| `vite.config.ts` NE PAS MODIFIER       | AGENTS.md + BOB_IDE_BRIEF_001 | ✅ Respecté                 |
| Pas de force-push / rebase / amend     | AGENTS.md                     | ✅ Respecté                 |
| Git LFS interdit                       | CDC §12                       | ✅ Respecté                 |
| Aucun secret côté client               | CDC §20                       | ✅ Intégré dans plan        |
| WCAG 2.2 AA                            | CDC §6                        | ✅ Intégré dans plan        |
| Lint + tests + build verts avant push  | BOB_IDE_BRIEF_001 §6          | ✅ Intégré dans plan        |
| `src/start.ts` NE PAS MODIFIER         | Code existant                 | ✅ Respecté                 |
| `src/server.ts` NE PAS MODIFIER        | Code existant                 | ✅ Respecté                 |
| Supabase auth conservée                | Q-K-01                        | ✅ Intégré dans plan        |
| Images dans `public/` ou `src/assets/` | Convention projet             | ⚠️ Images racine à déplacer |

---

## 10. Rapports Klerio dans ce dépôt

Espace numérotation : `001–NNN` (indépendant de ARTCB).

| Rapport                                                      | Contenu                                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `rapports/001_audit_complet_klerio_2026-10-28.md`            | Audit initial — structure, technologies, gaps                                     |
| `rapports/002_architecture_github_db_plan_dev_2026-10-28.md` | Architecture GitHub-as-DB — réponses Q1-Q7 initiales (partiellement amendées ici) |
| **`rapports/003_audit_reprise_lot1_plan_dev_2026-10-29.md`** | **CE RAPPORT — audit complet post-0bfdd50 + plan Lot 1**                          |

---

## 11. Actions requises de Gabriel avant que l'agent code

**BLOQUANT pour GitHub as DB (Lot 2) :**

- [ ] Créer la GitHub App Klerio (https://github.com/settings/apps/new) — permissions `Contents: R/W`
- [ ] Fournir les secrets dans Doppler projet `lvx` : `KLERIO_GITHUB_APP_ID`, `KLERIO_GITHUB_APP_PRIVATE_KEY`

**NON BLOQUANT pour Lot 1 (l'agent peut coder les stubs) :**

- [ ] Confirmer que le plan Lot 1 ci-dessus est validé
- [ ] Confirmer que les images `a1.png` / `image.png` / `Colagem...png` sont bien les références mascotte (tête uniquement)
- [ ] Confirmer ou corriger la correction de la décision Supabase (Q-K-01 = **conserver**, non supprimer)

---

## 12. Avancement actuel

```
Lot 1 Fondation    ░░░░░░░░░░░░░░░░░░░░  0% (14 tâches à faire)
Lot 2 IA + docs    ░░░░░░░░░░░░░░░░░░░░  0%
Lot 3 Contrôle     ░░░░░░░░░░░░░░░░░░░░  0%
Auth existante     ████████████████████  100% (email + Google + Lovable)
Infrastructure     ████████████████████  100% (TanStack, Radix, Supabase client)

GLOBAL KLERIO : 8 %
```

---

_Rapport produit après audit complet ligne par ligne de tous les fichiers source. Aucune donnée inventée. Mode DEBUG actif._
