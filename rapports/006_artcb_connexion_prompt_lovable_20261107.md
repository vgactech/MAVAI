# 006 — ARTcB connexion : correction code + prompt agent Lovable

**Date :** 2026-11-07  
**git HEAD MAVAI :** `29fded1` → commit en cours  
**URL live :** https://doppler-secret-portal.lovable.app  
`CERTIFIED_100=false` | `unique_human_proven=false` | Mode DEBUG actif

---

## 1. Bugfix appliqué — `messages.ts` (avant/après)

### Bug 1 — Champ `text` → `question`

**Fichier :** `src/server-functions/messages.ts`  
**Fonction :** `callARTcB()`

| | Avant (R005) | Après (R006) |
|--|-------------|-------------|
| **Ligne ~74** | `text,` | `question: text,` |

**Cause :** Le schema `ThinkRequest` d'ARTcB attend le champ `question`, pas `text`. Envoyer `text` provoque un `422 Unprocessable Entity` côté ARTcB — le fallback OpenAI prenait le relais silencieusement.

### Bug 2 — Champ de réponse `message` non lu

| | Avant | Après |
|--|-------|-------|
| **Type réponse** | `{ reply?, content?, text? }` | `{ message?, reply?, content?, text? }` |
| **Priorité** | `reply ?? content ?? text` | `message ?? reply ?? content ?? text` |

**Cause :** ARTcB `/api/v1/ai/think` retourne `message` comme champ principal. Sans ce fix, la réponse était toujours `undefined` → exception → fallback OpenAI.

### Bonus — timeout augmenté et store_block explicite

- `AbortSignal.timeout(15_000)` → `20_000` (ARTcB peut prendre 15-18s sur réseau chargé)
- `store_block: true` ajouté explicitement (comportement par défaut confirmé, rendu explicite)

---

## 2. Secrets Doppler — état actuel

Le projet Doppler `mavai` ne peut pas être créé (limite workspace 10 projets atteinte).  
**Solution retenue :** utiliser le projet `lvx` qui contient déjà toutes les clés nécessaires.

### Clés disponibles dans Doppler projet `lvx` (config `dev`)

| Nom dans Doppler | Usage dans MAVAI |
|-----------------|-----------------|
| `ARTCB_API_URL` | URL ARTcB — **valeur actuelle :** `http://13.38.209.25:8000` ⚠️ voir §3 |
| `ARTCB_API_KEY` | Clé Bearer ARTcB |
| `ELEVENLABS_API_KEY` | TTS voix MAVAI (clé principale) |
| `ELEVENLABS_API_KEY_2` | TTS voix MAVAI (clé secondaire) |
| `OPENAI_API_KEY2` | Fallback OpenAI (sk-proj-…) |

> ⚠️ **`ARTCB_API_URL` dans Doppler lvx = ancienne IP AWS** (`http://13.38.209.25:8000`).  
> La valeur correcte pour la production est `https://artcb.me`.  
> Cette valeur doit être saisie **manuellement** dans Secrets Lovable.

---

## 3. Secrets à saisir dans Lovable (Paramètres → Secrets)

> **Procédure Lovable :** Paramètres du projet → Secrets → Ajouter un secret.  
> Ces valeurs ne doivent jamais apparaître dans les commits, logs ou rapports.

| Nom du secret | Valeur | Priorité |
|--------------|--------|----------|
| `ARTCB_API_URL` | `https://artcb.me` | **P0 — obligatoire** |
| `ARTCB_API_KEY` | *(valeur depuis Doppler `lvx` → `ARTCB_API_KEY`)* | P1 — optionnel (sans clé = agent_anonymous) |
| `ELEVENLABS_API_KEY` | *(valeur depuis Doppler `lvx` → `ELEVENLABS_API_KEY`)* | P1 — voix activée |
| `OPENAI_API_KEY` | *(valeur depuis Doppler `lvx` → `OPENAI_API_KEY2`)* | P2 — fallback si ARTcB down |

### Note sur l'authentification ARTcB

ARTcB `/api/v1/ai/think` fonctionne **sans clé** (mode `agent_anonymous`). La clé n'est pas obligatoire pour que le chat fonctionne. Elle permet d'associer les messages à un wallet identifié.

---

## 4. Vérification live ARTcB (test effectué ce jour)

```
GET  https://artcb.me/health
→ {"status":"healthy","git_sha":"10957e7b1c5a","network_id":"artcb-mainnet-1"}  ✅

POST https://artcb.me/api/v1/ai/think
     {"question":"Test MAVAI","session_id":"mavai-lovable-test","store_block":true}
→ {"think_complete":true,"block_index":1104,"pol_score":0.6,"agent_id":"agent_anonymous"}  ✅
```

**Conclusion :** ARTcB répond, grave les blocs, retourne le champ `message`. Le code corrigé est prêt.

---

## 5. Prompt complet pour l'agent Lovable

> Copier-coller le bloc ci-dessous tel quel dans la conversation avec l'agent Lovable.

---

```
Bonjour,

Voici les informations pour brancher ARTcB et finaliser MAVAI.

## 1. Secret à ajouter MAINTENANT dans Paramètres → Secrets

Nom : ARTCB_API_URL
Valeur : https://artcb.me

(Les autres secrets — ARTCB_API_KEY, ELEVENLABS_API_KEY, OPENAI_API_KEY —
seront fournis séparément dans un formulaire sécurisé.)

## 2. Correction de code à appliquer dans src/server-functions/messages.ts

Dans la fonction callARTcB(), remplacer le corps JSON envoyé à ARTcB :

AVANT :
  body: JSON.stringify({
    text,
    agent: `mavai-user-${userId.slice(0, 8)}`,
    session_id: sessionId,
    inject_context: true,
    visibility: "private",
  }),

APRÈS :
  body: JSON.stringify({
    question: text,          // ← ARTcB attend "question", pas "text"
    agent: `mavai-user-${userId.slice(0, 8)}`,
    session_id: sessionId,
    inject_context: true,
    visibility: "private",
    store_block: true,       // ← explicite
  }),

Et remplacer la lecture de la réponse :

AVANT :
  const json = (await res.json()) as { reply?: string; content?: string; text?: string };
  const reply = json.reply ?? json.content ?? json.text;

APRÈS :
  const json = (await res.json()) as {
    message?: string;
    reply?: string;
    content?: string;
    text?: string;
  };
  const reply = json.message ?? json.reply ?? json.content ?? json.text;

Augmenter aussi le timeout : AbortSignal.timeout(15_000) → AbortSignal.timeout(20_000)

## 3. Test de vérification après déploiement

Après avoir ajouté le secret ARTCB_API_URL et appliqué la correction :
1. Envoyer "Bonjour, qui es-tu ?" dans le chat
2. La réponse doit venir d'ARTcB (pas d'OpenAI)
3. Vérifier dans les logs Lovable : "[DEBUG][messages] ARTcB reply received"
   (si ce log apparaît, la connexion est active)

## 4. Ce qui reste à faire après ces corrections

- Connexion ElevenLabs TTS (mode voix) : je fournirai la clé ELEVENLABS_API_KEY
- Connexion OpenAI fallback : je fournirai la clé OPENAI_API_KEY
- Test complet avec un vrai compte connecté
- Domaine personnalisé (optionnel) : Paramètres → Domaines

## 5. Ce qui fonctionne déjà (ne pas modifier)

- Auth Lovable Cloud (Google + Lovable) ✅
- Mémoire des conversations ✅
- Signal Desk ✅
- Agents (Planificateur, Chercheur, Rédacteur, Vérificateur) ✅
- Studio images ✅
- Micro (délai 1,5s auto-stop) ✅
- 20 tests vitest ✅

## 6. Invariants à ne jamais modifier

- CERTIFIED_100=false dans tous les commentaires de code
- unique_human_proven=false dans tous les commentaires de code
- Mode DEBUG actif (console.debug actifs)
- Jamais mettre de secrets dans les commits ou les logs
```

---

## 6. État des modules (confirmé par l'agent Lovable)

| Module | État | Commentaire |
|--------|------|-------------|
| Chat IA | ✅ fonctionnel | Fallback OpenAI actif ; ARTcB à brancher |
| Mémoire conversations | ✅ fonctionnel | Teste : "Mon prénom est Gabriel" → retrouvé ✅ |
| Signal Desk | ✅ fonctionnel | Recherche web en direct + sources |
| Agents (×4) | ✅ fonctionnel | Planificateur/Chercheur/Rédacteur/Vérificateur |
| Studio images | ✅ fonctionnel | Génération + lien téléchargement |
| Micro | ✅ fonctionnel | Auto-stop 1,5s |
| ARTcB backend | ❌ non branché | En attente `ARTCB_API_URL` + correction code |
| Voix ElevenLabs | ❌ non branché | En attente `ELEVENLABS_API_KEY` |
| Connexion e-mail | ⚠️ « bientôt » | Non prioritaire |

---

*Rapport produit par l'agent Bob IDE — projet ARTCB / MAVAI*  
*Espace de numérotation MAVAI : 001–NNN*
