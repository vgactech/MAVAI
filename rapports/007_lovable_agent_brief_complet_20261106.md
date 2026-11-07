# 007 — Brief complet pour l'agent Lovable — mise en ligne `doppler-secret-portal.lovable.app`

**Date :** 2026-11-06  
**git HEAD MAVAI :** `60ca1bf`  
**URL live :** https://doppler-secret-portal.lovable.app  
**Espace numérotation :** MAVAI `rapports/001–NNN` (dernier = 006, ce fichier = 007)  
`CERTIFIED_100=false` | `unique_human_proven=false` | Mode DEBUG actif

---

## 1. État de l'app au moment de ce rapport

L'agent Lovable a confirmé les éléments suivants lors de l'import :

| Fonctionnalité | État déclaré | À vérifier |
|----------------|-------------|-----------|
| Page d'accueil + page connexion | ✅ s'affichent sans erreur | OK |
| Redirection si non connecté | ✅ renvoi vers `/auth` | OK |
| 20 tests vitest | ✅ passent | OK |
| Connexion Google / Lovable Cloud | ✅ fonctionnel | — |
| Chat IA | ✅ via IA Lovable intégrée | Remplacé par Lovable native ⚠️ |
| ARTcB | ❌ désactivé | En attente URL serveur |
| Voix ElevenLabs | ❌ clé absente | Connexion Doppler perdue |
| Connexion e-mail | ⚠️ marquée « bientôt » | Non prioritaire |

> **Note importante :** l'agent Lovable a **remplacé le chat par son IA native** et a
> **remplacé la connexion par Lovable Cloud**. Ces modifications sont propres à
> l'environnement Lovable — le code source dans le dépôt `vgactech/MAVAI` (HEAD `60ca1bf`)
> reste le code référence avec le dual-path ARTcB/OpenAI.

---

## 2. Architecture du code source MAVAI (HEAD `60ca1bf`)

### 2.1 Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/server-functions/messages.ts` | Handler principal : dual-path ARTcB → OpenAI + ElevenLabs TTS |
| `src/routes/_authenticated/chat.tsx` | Route `/chat` — formulaire + appel `/api/messages` |
| `src/components/chat/ChatFeed.tsx` | Liste des messages, bulles, indicateur de frappe |
| `src/components/chat/ChatComposer.tsx` | Barre de saisie, ModeKnob, fichiers joints |
| `src/components/chat/Mascot.tsx` | Orbe MAVAI flottante et déplaçable |
| `src/types/mavai.ts` | Types `ChatMessage`, `MAVAIChatSession`, `OutboxEntry` |
| `src/lib/outbox.ts` | File durable (localStorage) — survit au rechargement |
| `src/server-functions/sessions.ts` | Gestion session côté serveur |

### 2.2 Dual-path routing (messages.ts)

```
POST /api/messages
     │
     ├── ARTCB_API_URL défini ET pas d'images joints ?
     │   └── callARTcB() → POST https://artcb.me/api/v1/ai/think
     │         body : { question, agent, session_id, inject_context, visibility, store_block }
     │         réponse : json.message ?? json.reply ?? json.content ?? json.text
     │         timeout : 20 000 ms
     │         ↓ si erreur
     └── callOpenAI() → POST https://api.openai.com/v1/chat/completions
           modèle : gpt-4o-mini (texte) ou gpt-4o (images)
           
Mode voice → callElevenLabs() → retourne base64 data URI audio/mpeg
```

### 2.3 Schéma ARTcB `/api/v1/ai/think` (confirmé HEAD artcb.me)

```json
// Requête
{
  "question": "votre message",
  "agent": "mavai-user-XXXXXXXX",
  "session_id": "session-id-unique",
  "inject_context": true,
  "visibility": "private",
  "store_block": true
}

// Réponse
{
  "think_complete": true,
  "message": "réponse de l'IA",
  "graph_id": "...",
  "pol_score": 0.6,
  "block_index": 1104,
  "agent_id": "agent_anonymous"
}
```

ARTcB fonctionne **sans clé** (mode `agent_anonymous`). L'`ARTCB_API_KEY` est
optionnelle — elle associe les messages à un wallet identifié.

---

## 3. Variables d'environnement requises

### 3.1 Secrets à saisir dans Lovable (Paramètres → Secrets)

> Ces valeurs ne doivent **jamais** apparaître dans des commits, logs ou rapports.
> Les saisir uniquement via l'interface sécurisée Lovable → Paramètres → Secrets.

| Nom du secret | Priorité | Source | Notes |
|--------------|----------|--------|-------|
| `ARTCB_API_URL` | **P0 — obligatoire** | Fixe | Valeur : `https://artcb.me` |
| `ARTCB_API_KEY` | P1 — optionnel | Doppler `lvx` → `ARTCB_API_KEY` | Sans clé = agent_anonymous |
| `ELEVENLABS_API_KEY` | P1 — voix | Doppler `lvx` → `ELEVENLABS_API_KEY` | Pour mode vocal |
| `OPENAI_API_KEY` | P2 — fallback | Doppler `lvx` → `OPENAI_API_KEY2` | Si ARTcB indisponible |

> ⚠️ **Ne pas utiliser** `ARTCB_API_URL = http://13.38.209.25:8000` (ancienne IP AWS, présente
> dans Doppler `lvx` mais obsolète). La valeur correcte est `https://artcb.me`.

### 3.2 Variables optionnelles (déjà gérées dans le code)

| Nom | Défaut | Usage |
|-----|--------|-------|
| `ELEVENLABS_VOICE_ID` | `EXAVITQu4vr4xnSDxMaL` | ID de voix ElevenLabs |

---

## 4. Doppler — situation actuelle

- **Limite workspace :** 10 projets / 10 atteints → impossible de créer un projet `mavai`
- **Solution retenue :** utiliser le projet **`lvx`** (config `dev`) qui contient toutes les clés

### Connexion Lovable → Doppler (perdue selon l'agent Lovable)

L'agent Lovable signale que la connexion Doppler se perd au redémarrage de
l'espace de travail. Solution :

1. Aller sur https://dashboard.doppler.com → projet `lvx` → config `dev`
2. Copier les valeurs des secrets listés au §3.1
3. Les saisir manuellement dans Lovable → Paramètres → Secrets
4. **Ne pas re-connecter Doppler** — saisie manuelle plus stable sur Lovable

---

## 5. Modules MAVAI — état détaillé

### 5.1 Ce qui fonctionne dans le code source (HEAD `60ca1bf`)

| Module | Fichier | État |
|--------|---------|------|
| Chat dual-path | `src/server-functions/messages.ts` | ✅ Codé + testé |
| Schéma ARTcB corrigé (`question` / `message`) | `messages.ts` lignes 76-100 | ✅ R006 |
| Mode vocal TTS ElevenLabs | `messages.ts` lignes 169-203 | ✅ Codé (clé requise) |
| File durable outbox | `src/lib/outbox.ts` | ✅ localStorage |
| Types MAVAI | `src/types/mavai.ts` | ✅ Complets |
| ChatFeed (bulles + scroll auto) | `src/components/chat/ChatFeed.tsx` | ✅ |
| ChatComposer (textarea + fichiers) | `src/components/chat/ChatComposer.tsx` | ✅ |
| Mascot orbe flottante | `src/components/chat/Mascot.tsx` | ✅ |
| Route `/chat` | `src/routes/_authenticated/chat.tsx` | ✅ |
| Route `/dashboard` | `src/routes/_authenticated/dashboard.tsx` | ✅ |
| Route `/` accueil | `src/routes/index.tsx` | ✅ |
| Auth Lovable Cloud | `src/integrations/lovable/index.ts` | ✅ |
| Sprites2D (packages/) | `packages/` | ✅ 16 tests PASS (R004) |

### 5.2 Ce qui reste à implémenter (backlog)

| Fonctionnalité | Priorité | Description |
|----------------|----------|-------------|
| Diodes d'état (3 points colorés) | P1 | Vert/orange/rouge : ARTcB connecté, modèle prêt, exécution |
| Bandeau métadonnées | P1 | Modèle actif, tokens, heure — comme Klerio |
| Pourcentage de progression | P1 | `25 % MAVAI réfléchit…` lié aux étapes |
| Historique de sessions persistant | P2 | Rechargement des conversations par session_id |
| Streaming SSE | P2 | Réponse progressive par fragments |
| Fournisseur Mistral | P2 | `ministral-3b-latest` (clé `MISTRAL_API_KEY` absente de Doppler) |
| Dashboard enrichi | P3 | Modules Studio, Continuité, Audio, Frame Control |

---

## 6. Connexions externe — état live

### 6.1 ARTcB (artcb.me)

```
GET  https://artcb.me/health
→ {"status":"healthy","git_sha":"10957e7b1c5a","network_id":"artcb-mainnet-1"}  ✅

POST https://artcb.me/api/v1/ai/think
Body: {"question":"Test MAVAI","session_id":"mavai-lovable-test","store_block":true}
→ {"think_complete":true,"block_index":1104,"pol_score":0.6,"agent_id":"agent_anonymous"}  ✅
```

**Conclusion :** ARTcB est opérationnel. La liaison sera active dès que
`ARTCB_API_URL=https://artcb.me` sera saisi dans Lovable Secrets.

### 6.2 OVH1 (`152.228.144.34`) = ❌ BLOQUÉ

Ne jamais utiliser cette IP. Elle est désactivée par décision utilisateur.

### 6.3 Nœuds ARTCB live

| Nœud | IP | État |
|------|----|------|
| artcb.me (apex) | 151.80.107.29 + 91.134.45.8 | ✅ UP |
| AWS3 (ancienne) | 13.38.209.25 | ⚠️ Ne pas utiliser dans ARTCB_API_URL |
| OVH1 | 152.228.144.34 | ❌ BLOQUÉ |

---

## 7. Prompt complet pour l'agent Lovable

> Copier-coller ce bloc **tel quel** dans la conversation avec l'agent Lovable.

---

```
Bonjour,

Je suis l'opérateur du projet MAVAI (vgactech/MAVAI). Voici toutes les 
informations pour finaliser la mise en ligne sur doppler-secret-portal.lovable.app.

## 1. SECRETS À SAISIR MAINTENANT (Paramètres → Secrets)

ARTCB_API_URL = https://artcb.me

(Les autres secrets seront fournis séparément dans un formulaire sécurisé.)

## 2. CE QUI FONCTIONNE DÉJÀ DANS LE CODE — NE PAS MODIFIER

Le fichier src/server-functions/messages.ts a été corrigé (R006) :
- Le champ "question" est utilisé (pas "text") pour ARTcB
- La réponse lit json.message en premier
- Timeout 20 000 ms
- store_block: true explicite

Autres éléments OK :
- ChatFeed (bulles, scroll auto, indicateur frappe)
- ChatComposer (textarea, fichiers joints, modes)
- Mascot (orbe flottante draggable)
- DurableOutbox (localStorage — survit au rechargement)
- Types MAVAI complets (ChatMessage, MAVAIChatSession, OutboxEntry)
- 20 tests vitest PASS

## 3. INVARIANTS À CONSERVER DANS TOUT NOUVEAU CODE

- Commentaire CERTIFIED_100=false | unique_human_proven=false dans chaque nouveau fichier
- Mode DEBUG actif : console.debug() actifs sur toutes les fonctions serveur
- Jamais mettre de secrets dans les commits, logs ou commentaires

## 4. CE QU'IL RESTE À FAIRE (priorité décroissante)

P1 — Brancher ElevenLabs TTS (mode voix)
  - Secret : ELEVENLABS_API_KEY (sera fourni séparément)
  - Le code est déjà prêt dans messages.ts : callElevenLabs()

P1 — Ajouter 3 diodes d'état dans ChatFeed.tsx
  - Diode verte : ARTcB connecté (ARTCB_API_URL défini côté serveur)
  - Diode orange : modèle prêt (réponse reçue sans erreur)
  - Diode rouge : erreur (erreur capturée dans catch)
  - Bandeau texte : "MAVAI · HH:MM · artcb.me · tokens N"

P2 — Connexion OpenAI fallback
  - Secret : OPENAI_API_KEY (sera fourni séparément)

P3 — Tester avec un vrai compte connecté
  - Envoyer "Bonjour, qui es-tu ?"
  - Vérifier dans les logs : "[DEBUG][messages] ARTcB reply received"

## 5. VÉRIFICATION LIVE ARTCB

curl https://artcb.me/health
→ {"status":"healthy"} ✅

curl -X POST https://artcb.me/api/v1/ai/think \
  -H "Content-Type: application/json" \
  -d '{"question":"Test","session_id":"test","store_block":false}'
→ {"think_complete":true,"message":"..."} ✅

## 6. MODULES EXISTANTS — NE PAS TOUCHER

Les modules suivants ont été validés par les 20 tests vitest — ne pas les modifier :
- src/lib/outbox.ts (DurableOutbox)
- src/types/mavai.ts (ChatMessage, MAVAIChatSession)
- src/components/chat/ChatFeed.tsx
- src/components/chat/ChatComposer.tsx
- src/components/chat/Mascot.tsx
- packages/ (Sprites2D — 16 tests unitaires indépendants)

## 7. CONNEXION DOPPLER

La connexion Doppler se perd au redémarrage. Solution retenue :
Ne pas re-connecter Doppler — saisir les secrets manuellement dans Lovable Secrets.
Les valeurs sont dans Doppler projet "lvx" config "dev".
```

---

## 8. Vérification avant/après — corrections déjà appliquées (R006)

### Avant (R005) — bug ARTcB non fonctionnel

**Fichier :** `src/server-functions/messages.ts` — fonction `callARTcB()`

```typescript
// AVANT — body incorrect
body: JSON.stringify({
  text,                        // ← FAUX : ARTcB attend "question"
  agent: `mavai-user-${...}`,
  session_id: sessionId,
  inject_context: true,
  visibility: "private",
}),

// AVANT — réponse incomplète
const json = ... as { reply?: string; content?: string; text?: string };
const reply = json.reply ?? json.content ?? json.text;  // ← "message" manquant
```

### Après (R006 — HEAD `60ca1bf`) — corrigé

```typescript
// APRÈS — body correct
body: JSON.stringify({
  question: text,              // ✅ champ correct
  agent: `mavai-user-${...}`,
  session_id: sessionId,
  inject_context: true,
  visibility: "private",
  store_block: true,           // ✅ explicite
}),

// APRÈS — réponse complète
const json = ... as { message?: string; reply?: string; content?: string; text?: string };
const reply = json.message ?? json.reply ?? json.content ?? json.text;  // ✅
```

---

## 9. Checklist de validation post-déploiement

| Test | Commande / Action | Résultat attendu |
|------|-------------------|-----------------|
| ARTcB health | `curl https://artcb.me/health` | `{"status":"healthy"}` |
| Chat via ARTcB | Envoyer "Bonjour" dans le chat | Log `[DEBUG][messages] ARTcB reply received` |
| Fallback OpenAI | Déconnecter ARTCB_API_URL temporairement | Chat répond via OpenAI |
| Mode vocal | Cliquer sur ModeKnob → vocal, envoyer message | Audio retourné (si ELEVENLABS_API_KEY présente) |
| Auth | Se connecter avec Google ou Lovable | Redirection vers `/dashboard` |
| Outbox | Envoyer message, recharger la page | Message visible dans localStorage `mavai:outbox` |
| 20 tests | `npm test` ou `pnpm test` | 20/20 PASS |

---

*Rapport produit par l'agent Bob IDE — projet ARTCB / MAVAI*  
*Espace numérotation MAVAI : 001–NNN*
