# Rapport 001 — Audit complet Klerio Project Hub

**Date :** 2026-10-28  
**Agent :** Bob IDE  
**Dépôt :** `vgactech/klerio-project-hub`  
**HEAD :** `2f702de` — _Merge Klerio specifications and bronze floating mascot prototype into main_  
**Mode :** DEBUG actif  
**Statut :** ⚠️ EN ATTENTE DE VALIDATION UTILISATEUR — ne pas démarrer le développement avant accord explicite

---

## 1. Résumé exécutif

Klerio est un assistant personnel conversationnel (chat + voix + documents). Le dépôt contient un **shell d'application fonctionnel** (auth, routing, composants Radix/Shadcn), un **CDC v1.6 complet en 28 sections**, une **maquette HTML interactive V1→V4** et les fichiers de vérification de gestes V2/V3.

**Avancement fonctionnel réel : ~4 %**

Ce qui existe : connexion email/Google/Lovable, guard d'authentification, dashboard vide (email + déconnexion), 40+ composants UI, client Supabase SSR. Ce qui n'existe pas : l'intégralité de la valeur métier (chat, agent IA, voix, scanner, mémoire GitHub, catégories, tâches).

---

## 2. État du dépôt — inventaire exact

### 2.1 Branches

| Branche                                     | Rôle                                |
| ------------------------------------------- | ----------------------------------- |
| `main`                                      | Branche officielle — HEAD `2f702de` |
| `docs/klerio-cahier-des-charges-2026-10-27` | Branche docs archivée               |

**Règle AGENTS.md :** ne jamais réécrire l'historique git publié, maintenir une branche fonctionnelle.

### 2.2 Stack technique vérifiée

| Couche          | Technologie                              | Version exacte    |
| --------------- | ---------------------------------------- | ----------------- |
| Framework UI    | React                                    | 19.2.0            |
| Routeur/SSR     | TanStack Start + Router                  | 1.168.60          |
| Build           | Vite (preset Lovable)                    | 8.1.5             |
| CSS             | Tailwind CSS v4                          | 4.2.1             |
| Composants      | Radix UI (40+ composants)                | dernières stables |
| Auth            | Supabase + Lovable Cloud Auth            | 2.118.0           |
| Tests           | Vitest + Testing Library                 | ^4.1.10           |
| Package manager | Bun                                      | bun.lock présent  |
| Déploiement     | Lovable Cloud (Nitro/Cloudflare Workers) | —                 |
| Langage         | TypeScript strict                        | 5.8.3             |
| Forms           | react-hook-form + zod                    | dernières         |
| Charts          | Recharts                                 | ^2.15.4           |

### 2.3 Fichiers sources existants (complet)

```
src/
├── components/ui/         ← 40 composants Radix/Shadcn complets
├── hooks/use-mobile.tsx
├── integrations/
│   ├── lovable/index.ts
│   └── supabase/
│       ├── auth-middleware.ts
│       ├── client.server.ts
│       ├── client.ts          ← client Supabase SSR dual-URL (server/browser)
│       ├── previewAuthStorage.ts
│       └── types.ts           ← ⚠️ Tables: never (AUCUNE table créée)
├── lib/
│   ├── error-capture.ts
│   ├── error-page.ts
│   ├── lovable-error-reporting.ts
│   └── utils.ts
├── routeTree.gen.ts
├── router.tsx
├── routes/
│   ├── README.md
│   ├── __root.tsx           ← shell HTML SSR, QueryClient, Toaster
│   ├── _authenticated/
│   │   ├── route.tsx        ← guard auth → /auth si non connecté
│   │   └── dashboard.tsx    ← dashboard minimal (email + déco seulement)
│   ├── auth.tsx             ← auth email + OAuth Google + Lovable
│   └── index.tsx            ← page accueil
├── server.ts
├── start.ts
├── styles.css               ← thème générique blanc/gris (À REMPLACER)
└── test/
    ├── app-routing.test.tsx ← 1 seul test routing
    └── setup.ts
```

### 2.4 Documentation existante

```
docs/specifications/
├── KLERIO_CAHIER_DES_CHARGES_V1.md        ← CDC v1.6 — 28 sections (512 lignes) — COMPLET
├── KLERIO_MAQUETTE_UI_V1.html             ← Maquette interactive V1→V4 (320 Ko)
├── KLERIO_UI_V2_VERIFICATION.json         ← 8 cas gestes PASS (logique pointer handlers)
└── KLERIO_UI_V3_VERIFICATION.json         ← 36 scénarios + 8 gestes — syntaxe OK, browser N/A
```

---

## 3. Analyse du CDC v1.6 — points clés pour le développement

### 3.1 Invariants absolus (§1)

1. Aucun changement d'outil imposé pour un parcours courant
2. Toute réponse utile existe en texte (voix = complément)
3. Tout travail accepté a un identifiant + état durable
4. Pas d'annonce "enregistré GitHub" avant confirmation effective
5. Conversations originales non remplacées par des résumés
6. Documents originaux distincts des OCR/dérivés
7. Chaque relation est horodatée + rattachée à ses sources
8. Pas de promesse de mémoire infinie
9. L'utilisateur peut interrompre, corriger, contrôler l'autonomie
10. Isolation stricte entre utilisateurs

### 3.2 Lots de livraison (§4)

| Lot                | Contenu                                                                                | Condition de sortie                                   |
| ------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **P0** ✅ PRIORITÉ | identité, chat texte, pièces jointes, événements durables, classement, GitHub, reprise | parcours complet et restaurable sans perte ni doublon |
| P1                 | voix, silence, interruption, caméra, OCR, questions interactives                       | navigateurs mobiles et bureau testés                  |
| P2                 | registre de composants, tableaux, documents, chronologies, formulaires, carte mémoire  | schémas validés                                       |
| P3                 | tâches longues, quotas, reprise après incident, export, restauration                   | incidents simulés résolus                             |
| P4                 | plusieurs espaces, partage, outils spécialisés                                         | permissions et migrations validées                    |

### 3.3 Composants UI obligatoires (§6 + §7)

- **ModeKnob** : bouton 3 positions **physiquement déplaçable** (gauche=Vocal / centre=Texte / droite=Documents) — NOT a slider/progress bar
- **SendKnob** : bouton envoi glissant à gauche intégré dans la zone de saisie — relâchement au seuil = envoi
- **ChatFeed** : fil chronologique (messages user à droite, agent à gauche)
- **ChatComposer** : zone de saisie fixe en bas avec ModeKnob + SendKnob
- **Mascotte chat-pingouin bronze** : flottante et déplaçable librement
- 22 vues UI définies (UI-01 à UI-22)

### 3.4 Palette bronze obligatoire (§6)

| Token                    | Hex                 | Usage            |
| ------------------------ | ------------------- | ---------------- |
| Fond bronze profond      | `#6B4427`           | background       |
| Cartes                   | `#59371F`           | card             |
| Texte crème              | `#FFF3DF`           | foreground       |
| Accent bronze métallique | `#CD7F32`           | primary / accent |
| Surfaces translucides    | + bordures cuivrées | overlays         |

⚠️ Le `styles.css` actuel utilise `oklch(1 0 0)` (blanc pur) — 100% à remplacer.

### 3.5 Architecture proposée (§18)

```
Client React/TanStack
    → API authentifiée (Supabase Edge Functions ou TanStack Start Server Functions)
    → Orchestrateur durable
    → Exécutants : IA (OpenAI), Voix (ElevenLabs), OCR, Documents, GitHub

Journal durable/outbox → Synchroniseur GitHub → Référentiel documentaire
Index de recherche ← projections validées
```

### 3.6 Modèle de données logique (§19 — tables Supabase à créer)

| Table               | Attributs clés                                      | Contraintes                  |
| ------------------- | --------------------------------------------------- | ---------------------------- |
| `workspaces`        | id, owner_id, github_repo, policy                   | isolation par owner          |
| `sessions`          | id, workspace_id, title, dates, state               | ordre des messages           |
| `messages`          | id, session_id, role, version, content, attachments | intégral et versionné        |
| `documents`         | id, hash, type, owner_id, original_ref              | pas de duplication canonique |
| `document_versions` | id, document_id, source, derivatives                | traçabilité                  |
| `categories`        | id, title, aliases, parent, status                  | ID immuable                  |
| `entities`          | id, type, attributes_sourced                        | pas d'unification hasardeuse |
| `relations`         | id, source_id, target_id, type, provenance, dates   | références valides           |
| `tasks`             | id, mandate, state, limits, checkpoint              | transitions contrôlées       |
| `actions`           | id, tool, inputs_redacted, result, effect           | reprise sans double effet    |
| `questions`         | id, task_id, schema, version, state                 | réponse validée              |
| `events`            | id, type, occurred_at, sequence, refs               | append-only                  |
| `sync_records`      | event_id, attempt, commit, status                   | pas d'annonce avant succès   |
| `preferences`       | id, value, scope, source, validity                  | corrigible et révocable      |

### 3.7 Contrats API à implémenter (§18)

| Endpoint                      | Méthode | Description                  |
| ----------------------------- | ------- | ---------------------------- |
| `/sessions`                   | POST    | créer une session            |
| `/sessions/:id/messages`      | POST    | envoyer un message           |
| `/sessions/:id/events?after=` | GET     | SSE ou polling (curseur)     |
| `/questions/:id/answers`      | POST    | répondre à une question      |
| `/documents/uploads`          | POST    | préparer un upload           |
| `/documents/:id/finalize`     | POST    | finaliser + empreinte        |
| `/tasks/:id/control`          | POST    | pause/reprendre/annuler      |
| `/voice/sessions`             | POST    | autorisation temporaire voix |
| `/memory/search`              | GET     | recherche sémantique         |
| `/categories/corrections`     | POST    | corriger une catégorie       |
| `/exports`                    | POST    | lancer un export             |
| `/privacy/requests`           | POST    | demande RGPD                 |

### 3.8 Tests de recette AT-01 à AT-30 (§24)

30 tests définis dans le CDC — aucun n'est encore implémenté.

---

## 4. Secrets disponibles dans Doppler

### Projet `lvx` (config `dev`) — secrets utilisables pour Klerio

| Variable Doppler                                                         | Service             | Usage Klerio                     |
| ------------------------------------------------------------------------ | ------------------- | -------------------------------- |
| `OPENAI_API_KEY`                                                         | OpenAI              | GPT-4o — agent LLM principal     |
| `OPENAI_API_KEY2`                                                        | OpenAI              | Clé secondaire (failover)        |
| `OPENAI_BASE_URL`                                                        | OpenRouter          | Base URL alternative             |
| `ELEVENLABS_API_KEY`                                                     | ElevenLabs          | TTS voix agent                   |
| `ELEVENLABS_API_KEY_2` / `API_ELEVENLABS_DEYI1` / `API_ELEVENLABS_DEYI2` | ElevenLabs          | Clés additionnelles              |
| `VOICE_1_ELEVENLABS_API`                                                 | ElevenLabs          | Voix identifiée                  |
| `GITHUB_TOKEN`                                                           | GitHub              | Intégration mémoire documentaire |
| `GITHUB_API_KEY`                                                         | GitHub              | Alternative                      |
| `API_KEY_SUPABASE`                                                       | Supabase            | Service key (admin)              |
| `PUBLISHABLE_KEY_SUPABASE`                                               | Supabase            | Clé publique                     |
| `SUPABASE_URL`                                                           | Supabase            | URL projet                       |
| `JWT_SIGNING_KEYS_SUPABASE`                                              | Supabase            | JWT                              |
| `MOT_DE_PASSE_SUPABASE_POSTGRESQL`                                       | Supabase PostgreSQL | DB directe                       |

⚠️ **Le projet Supabase dans `.env` local (`bnjspuaujvktmreloxsr`) est le projet Lovable Cloud.** Les clés Doppler `lvx` pointent vers un projet Supabase différent. **Voir Q-K-01 ci-dessous.**

---

## 5. Ce qui manque — inventaire complet par priorité

### 5.1 P0 — Bloquant (sans ça, rien ne fonctionne)

| ID   | Manque                                                                                                      | Impact                                        |
| ---- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| M-01 | **Thème bronze** : `styles.css` → palette `#6B4427 / #59371F / #FFF3DF / #CD7F32` en oklch                  | Toute l'interface est visuellement incorrecte |
| M-02 | **Tables Supabase** : 14 tables du modèle §19 + RLS par `owner_id`                                          | Impossible de stocker quoi que ce soit        |
| M-03 | **Route `/chat`** : interface principale                                                                    | L'application ne fait rien après connexion    |
| M-04 | **`ChatFeed`** : composant fil de conversation                                                              | —                                             |
| M-05 | **`ChatComposer`** : zone de saisie avec ModeKnob + SendKnob                                                | —                                             |
| M-06 | **`ModeKnob`** : bouton glissant 3 positions                                                                | Exigence CDC §6 — spécification très précise  |
| M-07 | **`SendKnob`** : bouton envoi glissant                                                                      | Exigence CDC §6                               |
| M-08 | **Mascotte chat-pingouin bronze** flottante déplaçable                                                      | Identité visuelle Klerio                      |
| M-09 | **Server Functions** (ou Edge Functions) : API `/sessions`, `/messages`, `/events`                          | Sans backend, pas d'agent                     |
| M-10 | **Intégration OpenAI** : streaming GPT-4o sur `/sessions/:id/messages`                                      | Aucune réponse IA                             |
| M-11 | **Variables d'env serveur** : `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `GITHUB_TOKEN` dans `.env` ou Doppler | Services inaccessibles                        |
| M-12 | **Journal durable / outbox** : événements persistants (table `events`)                                      | Pas de durabilité                             |
| M-13 | **Route `/dashboard` → `/chat`** : rediriger vers le chat au lieu du dashboard vide                         | UX cassée                                     |

### 5.2 P1 — Important (voix + documents)

| ID   | Manque                                                                               | Impact                |
| ---- | ------------------------------------------------------------------------------------ | --------------------- |
| M-14 | **Intégration ElevenLabs** : TTS streaming côté serveur avec token temporaire client | Voix agent            |
| M-15 | **Web Speech API / Whisper** : transcription voix → texte                            | Mode Vocal            |
| M-16 | **Import de fichiers** : upload PDF/JPG/PNG/TXT + validation type/taille             | Mode Documents        |
| M-17 | **Scan caméra** : flux vidéo + capture + recadrage multi-pages                       | Mode Documents avancé |
| M-18 | **OCR** : extraction texte depuis images (OpenAI Vision ou Tesseract)                | Analyse documents     |
| M-19 | **Questions interactives** : `choice` component (UI-10)                              | Flow agent            |

### 5.3 P2 — Architecture mémoire GitHub

| ID   | Manque                                                                       | Impact                  |
| ---- | ---------------------------------------------------------------------------- | ----------------------- |
| M-20 | **Service GitHub** : création dépôt mémoire privé par utilisateur            | Mémoire durable         |
| M-21 | **Synchroniseur outbox → GitHub** : commits atomiques avec retry             | Durabilité documentaire |
| M-22 | **Structure dépôt mémoire** : sessions/, events/, documents/, tasks/, graph/ | Organisation §12        |
| M-23 | **Index de recherche sémantique** : reconstruisible depuis sources GitHub    | Mémoire §15             |
| M-24 | **Carte mémoire** : vue graphe `memory_graph` component                      | UI-16                   |

### 5.4 P3 — Composants UI avancés (§17 — registre adaptatif)

| Composant             | Usage                                |
| --------------------- | ------------------------------------ |
| `rich_text`           | réponse riche avec sources           |
| `form`                | collecte structurée dans le fil      |
| `document`            | carte document scan/rapport          |
| `table`               | comparaison (tri/filtre/export)      |
| `chart`               | valeurs sourcées                     |
| `timeline`            | événements et tâches                 |
| `checklist`           | plan ou contrôle                     |
| `task_progress`       | tâche autonome (UI-11)               |
| `action_confirmation` | confirmation effet engageant (UI-13) |
| `artifact`            | livrable prévisualisable             |

### 5.5 P4 — Sécurité et robustesse

| ID   | Manque                                                       |
| ---- | ------------------------------------------------------------ |
| M-25 | RLS Supabase stricte par `owner_id` sur toutes les tables    |
| M-26 | Sanitisation texte riche (protection injection via PDF)      |
| M-27 | Idempotence par `client_message_id` sur toutes les mutations |
| M-28 | Budget par tâche (jetons, minutes voix, pages OCR) + alertes |
| M-29 | Export RGPD + effacement encadré                             |

---

## 6. Questions ouvertes — à trancher avant démarrage

| ID         | Question                                                                                                                                                                                                                | Impact si non tranchée         |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| **Q-K-01** | **Quel projet Supabase ?** Le `.env` pointe vers `bnjspuaujvktmreloxsr` (Lovable Cloud). Doppler `lvx` a une URL différente. Utiliser le projet Lovable (déjà configuré dans l'appli) ou créer un projet dédié Klerio ? | Tables, migrations, RLS, clés  |
| **Q-K-02** | **Backend : Supabase Edge Functions (Deno) ou TanStack Start Server Functions (Nitro) ?** Le CDC §18 dit "serveur d'orchestration à sélectionner". TanStack Start supporte les server functions nativement.             | Architecture API complète      |
| **Q-K-03** | **Mascotte chat-pingouin** : reproduire exactement la maquette HTML (V4 bronze bronze mascot) ou une version CSS pure ? La maquette utilise des formes SVG composées.                                                   | Design assets, SVG vs CSS      |
| **Q-K-04** | **Dépôt mémoire GitHub** : créer un dépôt mémoire privé séparé par utilisateur (recommandé CDC §12) ou utiliser `klerio-project-hub` en attendant ?                                                                     | Confidentialité, purge, volume |
| **Q-K-05** | **OCR** : OpenAI Vision (GPT-4o avec image, clé disponible) ou Tesseract.js (open source, zéro coût) ? Le CDC §26 dit "fournisseur non choisi ; option locale possible".                                                | Coût, qualité, dépendance      |
| **Q-K-06** | **Déploiement** : Lovable Cloud uniquement ou aussi un build autonome (Cloudflare Workers / Vercel) ? Le CDC §29 dit "Lovable retenu".                                                                                  | Variables d'env, build process |

---

## 7. Architecture recommandée pour P0

```
┌─────────────────────────────────────────────────────────┐
│  Client React/TanStack (existant)                        │
│  + route /chat (nouveau)                                 │
│  + ChatFeed + ChatComposer + ModeKnob + SendKnob        │
│  + mascotte bronze déplaçable                           │
│  + thème bronze oklch                                   │
└─────────────────┬───────────────────────────────────────┘
                  │ Server Functions (TanStack Start)
                  │ ou Supabase Edge Functions
┌─────────────────▼───────────────────────────────────────┐
│  API Klerio                                              │
│  POST /api/sessions                                      │
│  POST /api/sessions/:id/messages  ←→ OpenAI streaming   │
│  GET  /api/sessions/:id/events    (SSE / polling)        │
│  POST /api/documents/uploads                            │
│  POST /api/tasks/:id/control                            │
└──────────┬──────────────────────────────────────────────┘
           │
    ┌──────┴────────────────────────────────┐
    │         Supabase PostgreSQL            │
    │  (sessions, messages, events,          │
    │   documents, tasks, categories,        │
    │   relations, events journal, sync)     │
    └───────────────────────────────────────┘
           │ outbox async
    ┌──────▼────────────────────────────────┐
    │  GitHub API                           │
    │  (dépôt mémoire privé par owner)      │
    └───────────────────────────────────────┘
```

---

## 8. Plan de réalisation proposé (après validation)

### Phase 1 — Fondation visuelle (2–3 heures)

1. `styles.css` : thème bronze complet (oklch + variables Tailwind)
2. Mascotte chat-pingouin SVG bronze flottante et déplaçable
3. Route `/chat` squelette (page vide bronze)
4. Redirection `/dashboard` → `/chat`

### Phase 2 — Chat P0 sans IA (3–4 heures)

5. Tables Supabase : `workspaces`, `sessions`, `messages`, `events` + RLS
6. Composant `ChatFeed` : affichage messages (user/agent, bulles arrondies)
7. Composant `ChatComposer` : texte multiligne + Entrée/Maj+Entrée
8. `ModeKnob` (3 positions glissant — logique pointer existante V2/V3)
9. `SendKnob` (glissant à gauche)
10. Server Function `POST /api/sessions/:id/messages` (echo sans IA)

### Phase 3 — Intégration IA (2–3 heures)

11. Intégration OpenAI GPT-4o streaming sur les messages
12. Streaming SSE client → affichage progressif
13. Journalisation events dans Supabase
14. Gestion erreurs (quota, timeout, panne)

### Phase 4 — Imports documents P1 (2–3 heures)

15. Upload PDF/JPG/PNG/TXT (validation type + taille 20 Mio)
16. OCR via OpenAI Vision
17. Carte document dans le fil (UI-09)

### Phase 5 — Voix P1 (2–3 heures)

18. Token temporaire ElevenLabs côté serveur
19. TTS streaming (réponse agent → voix)
20. STT Web Speech API + transcription visible
21. État micro actif visible en permanence

### Phase 6 — Mémoire GitHub P2 (3–4 heures)

22. Création dépôt mémoire privé par owner
23. Synchroniseur outbox → commits GitHub atomiques
24. Structure sessions/, events/, documents/

---

## 9. Ce qui doit être confirmé — checklist avant démarrage

- [ ] **Q-K-01** : projet Supabase → Lovable Cloud `bnjspuaujvktmreloxsr` ou nouveau projet dédié ?
- [ ] **Q-K-02** : backend → TanStack Start Server Functions ou Supabase Edge Functions ?
- [ ] **Q-K-03** : mascotte → SVG composé exact (maquette V4) ou CSS formes simples ?
- [ ] **Q-K-04** : dépôt mémoire GitHub → séparé dès P0 ou plus tard ?
- [ ] **Q-K-05** : OCR → OpenAI Vision ou Tesseract.js ?
- [ ] **Q-K-06** : déploiement → Lovable Cloud uniquement pour l'instant ?
- [ ] **Ordre de priorité** : confirmer que P0 (texte + IA) avant P1 (voix + scan) ?

---

## 10. Contraintes techniques à ne pas oublier

| Contrainte                              | Source                                   | Détail                            |
| --------------------------------------- | ---------------------------------------- | --------------------------------- |
| Ne pas réécrire l'historique git publié | `AGENTS.md`                              | `git push --force` interdit       |
| Maintenir une branche fonctionnelle     | `AGENTS.md`                              | Tester avant chaque push          |
| `vite.config.ts` : ne pas modifier      | Lovable preset                           | Le preset Lovable gère tout       |
| Git LFS interdit                        | CDC §12 + §29                            | Aucun `.gitattributes` LFS        |
| Fichiers max 20 Mio                     | CDC §10                                  | Limites Git classique             |
| Aucun secret dans le code               | CDC §20                                  | Doppler / variables d'env serveur |
| Les URLs/texte riche sont assainis      | CDC §17                                  | Pas d'injection via PDF           |
| `Tables: never` dans `types.ts`         | Audit code                               | À régénérer après migration SQL   |
| Project ID Lovable                      | `.lovable/project.json` : `964b9828-...` | Ne pas modifier                   |

---

## 11. Avant/Après — état exact des fichiers à modifier en Phase 1

### `src/styles.css` — thème bronze

**AVANT (extrait ligne 21–25) :**

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);          /* blanc pur */
  --foreground: oklch(0.129 0.042 264.695);  /* gris foncé */
  --card: oklch(1 0 0);
```

**APRÈS (à implémenter) :**

```css
:root {
  --radius: 1.125rem;                   /* 18px bulles arrondies CDC */
  --background: oklch(0.32 0.07 52);   /* #6B4427 bronze profond */
  --foreground: oklch(0.97 0.03 80);   /* #FFF3DF crème */
  --card: oklch(0.28 0.06 52);         /* #59371F cartes */
  --primary: oklch(0.62 0.12 65);      /* #CD7F32 bronze métallique */
```

### `src/routes/_authenticated/dashboard.tsx` — redirection

**AVANT :**

```tsx
<h1 className="text-3xl font-semibold text-foreground">Bienvenue sur Klerio</h1>
<p className="text-muted-foreground">Connecté en tant que {user.email}</p>
<Button variant="outline" onClick={signOut}>Se déconnecter</Button>
```

**APRÈS :** Rediriger vers `/chat` (route à créer) ou transformer en hub de navigation Klerio.

---

## 12. Avancement global

| Phase             | Description                            | État  |
| ----------------- | -------------------------------------- | ----- |
| Auth + shell      | Connexion, routing, composants Radix   | ✅ 4% |
| Thème bronze      | Palette CDC §6                         | ❌ 0% |
| Chat P0           | Route, fil, saisie, ModeKnob, SendKnob | ❌ 0% |
| Mascotte          | Chat-pingouin flottant déplaçable      | ❌ 0% |
| Supabase tables   | 14 tables + RLS                        | ❌ 0% |
| IA (OpenAI)       | GPT-4o streaming                       | ❌ 0% |
| Voix (ElevenLabs) | TTS/STT                                | ❌ 0% |
| Documents         | Upload, OCR, scanner                   | ❌ 0% |
| Mémoire GitHub    | Outbox, sync, structure                | ❌ 0% |
| Tests AT-01→AT-30 | Recette fonctionnelle                  | ❌ 0% |

**Avancement global estimé : ~4 %**

---

_Rapport généré le 2026-10-28 — Mode DEBUG actif — Ne pas démarrer le développement avant validation explicite des questions Q-K-01 à Q-K-06._
