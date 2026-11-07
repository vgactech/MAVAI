# 005 — Rapport agent MAVAI : intégration Lovable + variables manquantes

**Date :** 2026-11-07  
**Timestamp :** 20261107T_HANDOFF  
**git HEAD MAVAI :** `29fded128de04175649acb5e521ddd1c56bf8820`  
**URL Lovable live :** https://doppler-secret-portal.lovable.app  
`CERTIFIED_100=false` | `unique_human_proven=false` | Mode DEBUG actif

---

## 1. Contexte — ce que Lovable a fait

L'agent Lovable a importé l'app MAVAI et l'a déployée sur Lovable Cloud.
Il a adapté deux points pour que ça tourne sur sa plateforme :

| Zone | Avant (Bob IDE) | Après (Lovable) |
|------|----------------|-----------------|
| Auth Google / OAuth | Gardé en local session uniquement | Branché sur Lovable Cloud Auth (`@lovable.dev/cloud-auth-js`) |
| Chat IA | Dual-path ARTcB → OpenAI | IA intégrée Lovable (pas de clé OpenAI nécessaire côté Lovable) |

**Ce qui a passé les 20 tests** = la couche UI/routing (pages home, connexion, "Mon espace" protégé).  
**Ce qui n'a PAS encore été testé** = connexion réelle avec compte + envoi de message.

---

## 2. Variables d'environnement requises — table complète

Le serveur Lovable lit les variables via `process.env["NOM"]`.
Elles doivent être saisies dans **Paramètres du projet → Secrets** sur Lovable.

### 2a. Variables OBLIGATOIRES pour le chat

| Nom | Rôle | Valeur à saisir |
|-----|------|-----------------|
| `ARTCB_API_URL` | URL du nœud ARTcB live (path A) | `https://artcb.me` |
| `ARTCB_API_KEY` | Bearer token pour `/api/v1/ai/think` | Clé ARTCB de l'opérateur (Doppler `ARTCB_API_KEY`) |

> **Sans `ARTCB_API_URL`** le chat bascule automatiquement sur le fallback OpenAI.  
> **Sans `ARTCB_API_KEY`** les requêtes partent sans authentification (certains endpoints ARTCB peuvent refuser).

### 2b. Variables OPTIONNELLES — fallback OpenAI (si ARTcB indisponible)

| Nom | Rôle | Valeur |
|-----|------|--------|
| `OPENAI_API_KEY` | Clé OpenAI gpt-4o-mini / vision | Clé OpenAI opérateur |

> Si ni `ARTCB_API_URL` ni `OPENAI_API_KEY` ne sont présents, le chat retourne une erreur 500.

### 2c. Variables OPTIONNELLES — voix ElevenLabs (mode « voice »)

| Nom | Rôle | Valeur par défaut si absent |
|-----|------|----------------------------|
| `ELEVENLABS_API_KEY` | Clé ElevenLabs TTS | TTS silencieusement désactivé (pas d'erreur) |
| `ELEVENLABS_VOICE_ID` | ID de voix ElevenLabs | `EXAVITQu4vr4xnSDxMaL` (Sarah — femme EN) |

> Le code est déjà câblé (`callElevenLabs`) : si la clé est absente → `audioUrl=undefined` → mode texte seul, pas de crash.  
> La clé est dans **Doppler projet `artcb-blockchain`** (ou projet dédié MAVAI si créé).  
> **Problème signalé** : la connexion Doppler dans l'espace de travail Lovable se perd au redémarrage.  
> **Solution recommandée** : coller la valeur directement dans Paramètres → Secrets de Lovable (pas via Doppler).

---

## 3. Connexion ARTcB — comment ça marche

```
MAVAI Frontend (Lovable)
    │
    │  POST /api/messages  (Server Function TanStack Start)
    ▼
src/server-functions/messages.ts
    │
    │  if ARTCB_API_URL set  ─────────────────────────────► POST https://artcb.me/api/v1/ai/think
    │                                                            Bearer: ARTCB_API_KEY
    │  else (fallback)  ──────────────────────────────────► OpenAI gpt-4o-mini
    │
    │  if mode=voice  ────────────────────────────────────► ElevenLabs TTS
    ▼
    reply + audioUrl → ChatFeed
```

**Paramètres envoyés à ARTcB :**
```json
{
  "text": "<message utilisateur>",
  "agent": "mavai-user-<8 premiers chars userId>",
  "session_id": "<sessionId React>",
  "inject_context": true,
  "visibility": "private"
}
```

**Champs lus dans la réponse ARTcB :**  
`reply` → `content` → `text` (par ordre de priorité).

---

## 4. Points NON fonctionnels — liste exhaustive

| Fonctionnalité | État | Ce qu'il faut |
|----------------|------|---------------|
| **ARTcB backend** | ❌ désactivé (pas de `ARTCB_API_URL`) | Saisir `ARTCB_API_URL=https://artcb.me` dans Secrets Lovable |
| **Réponses vocales** | ❌ désactivé (pas de `ELEVENLABS_API_KEY`) | Saisir la clé ElevenLabs dans Secrets Lovable |
| **Connexion par e-mail** | ⚠️ marquée « bientôt » dans l'UI | Non bloquant pour la démo |
| **ARTcB, LUMVORAX2 (serveurs)** | ❌ hors scope Lovable | Ces backends tournent sur OVH2 / OVH4 — pas déployables sur Lovable |
| **Connexion réelle testée** | ❌ non testé par l'agent Lovable | Tester manuellement avec un compte Google / Lovable |
| **Message envoyé dans le chat** | ❌ non testé | Tester après avoir saisi les secrets |
| **Domaine personnalisé** | ⚠️ pas configuré | Paramètres projet → Domaines sur Lovable |

---

## 5. Actions immédiates recommandées (ordre de priorité)

### P0 — Brancher ARTcB (5 minutes)

1. Ouvrir [Paramètres du projet Lovable → Secrets](https://lovable.app)
2. Ajouter :
   - `ARTCB_API_URL` = `https://artcb.me`
   - `ARTCB_API_KEY` = valeur depuis Doppler `artcb-blockchain/dev` → clé `ARTCB_API_KEY`
3. Redéployer (ou attendre le prochain déploiement automatique)
4. Tester en se connectant et en envoyant un message

### P1 — Activer les voix ElevenLabs

1. Récupérer la clé ElevenLabs depuis Doppler (projet `artcb-blockchain` ou `lvx`)
2. Ajouter dans Secrets Lovable : `ELEVENLABS_API_KEY`
3. Optionnel : `ELEVENLABS_VOICE_ID` (laisser vide = voix Sarah par défaut)

### P2 — Fallback OpenAI (si ARTcB indisponible)

- Ajouter `OPENAI_API_KEY` dans Secrets Lovable si on veut que le fallback fonctionne quand artcb.me est down

### P3 — Domaine personnalisé

- Paramètres projet Lovable → Domaines → lier `mavai.artcb.me` ou domaine dédié

---

## 6. Architecture MAVAI — rappel complet pour l'agent

```
vgactech/MAVAI  (dépôt GitHub)
├── Frontend React/TanStack  ← déployé sur Lovable Cloud
│   ├── Auth: Lovable Cloud Auth (Google + Lovable)
│   ├── Chat: /api/messages → ARTcB ou OpenAI
│   └── Voice: ElevenLabs TTS (mode "voice")
│
└── Backend Python  (src/mavai/ dans vgactech/artcb)
    ├── FastAPI coordinator
    ├── Agents IA MAVAI
    └── Connexion ARTcB blockchain (OVH2 151.80.107.29 + OVH4 91.134.45.8)

Nœuds ARTcB live :
  artcb.me → OVH2 (151.80.107.29) + OVH4 (91.134.45.8)
  CERTIFIED_100=false | unique_human_proven=false
```

---

## 7. Ce que Lovable NE peut PAS faire (hors scope)

- Exécuter le backend Python FastAPI (`src/mavai/`, `src/artcb/`)
- Accéder aux nœuds blockchain OVH2/OVH4 directement
- Remplacer Doppler pour la gestion des secrets à long terme (perte au redémarrage workspace)
- Fournir un module Node.js avec accès disque complet

**Solution pour Doppler + Lovable :** copier les valeurs des secrets depuis Doppler **une fois** dans les Secrets du projet Lovable. Ne pas coller les valeurs dans des commits, des logs ou des commentaires.

---

## 8. Tests passés (confirmés par l'agent Lovable)

| Test | Résultat |
|------|----------|
| Page d'accueil s'affiche | ✅ PASS |
| Page connexion s'affiche | ✅ PASS |
| "Mon espace" sans connexion → redirection login | ✅ PASS |
| 20 tests vitest de l'app | ✅ PASS |

---

## 9. Limites et invariants

- `CERTIFIED_100=false` — invariant absolu, ne jamais modifier
- `unique_human_proven=false` — invariant absolu, ne jamais modifier
- Mode DEBUG actif — journaux `[DEBUG][messages]` visibles dans les logs Lovable
- Les secrets ne doivent **jamais** apparaître dans les commits, les logs ou les rapports
- OVH1 (`152.228.144.34`) = ❌ BLOQUÉ — ne jamais utiliser comme `ARTCB_API_URL`

---

*Rapport produit par l'agent Bob IDE — projet ARTCB / MAVAI*  
*Espace de numérotation : MAVAI/rapports/ (001–NNN)*
