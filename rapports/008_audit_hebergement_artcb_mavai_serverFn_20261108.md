# 008 — Audit complet MAVAI + hébergement ARTCB — `mavai.artcb.me` opérationnel

**Date :** 2026-11-08  
**git HEAD MAVAI :** `de12ad3` (après rebase push)  
**git HEAD ARTCB :** `4507989`  
**Espace numérotation MAVAI :** `rapports/001–008` (ce fichier = 008)  
**URL live :** https://mavai.artcb.me ✅ HTTP 200  
`CERTIFIED_100=false` | `unique_human_proven=false` | Mode DEBUG actif

---

## 1. Objectif de cette session

1. Auditer le code source MAVAI depuis les dernières réalisations Bob IDE
2. Vérifier si ARTCB héberge déjà MAVAI comme il se doit
3. Identifier et corriger les lacunes d'hébergement
4. Rendre `mavai.artcb.me` 100 % opérationnel avec chat IA fonctionnel
5. Expliquer comment ARTCB peut héberger des applications pour des clients futurs

---

## 2. État du code MAVAI avant cette session (HEAD `d7010ab` → `e74434e`)

### 2.1 Ce qui fonctionnait déjà ✅

| Composant | Fichier | État |
|-----------|---------|------|
| Chat UI | `src/routes/_authenticated/chat.tsx` | ✅ Complet |
| Bulles + scroll auto | `src/components/chat/ChatFeed.tsx` | ✅ |
| Barre de saisie | `src/components/chat/ChatComposer.tsx` | ✅ |
| Mascot orbe flottante | `src/components/chat/Mascot.tsx` | ✅ |
| Dual-path ARTcB/OpenAI | `src/server-functions/messages.ts` | ✅ Logique correcte |
| Outbox durable | `src/lib/outbox.ts` | ✅ localStorage |
| TTS ElevenLabs | `messages.ts:callElevenLabs()` | ✅ Codé (clé requise) |
| Auth Lovable Cloud | `src/integrations/lovable/index.ts` | ✅ |
| `mavai.artcb.me` HTTP 200 | OVH4 + nginx | ✅ |
| Certificat wildcard `*.artcb.me` | `/etc/nginx/certs/artcb-wildcard/` | ✅ |
| Service systemd `mavai.service` | OVH4 actif depuis Nov 8 19:08 UTC | ✅ |

### 2.2 Bug critique identifié ❌ (avant correction)

**Symptôme :** `POST /api/messages` retournait **404 HTML** au lieu d'une réponse JSON.

**Cause racine :** `src/server-functions/messages.ts` est un module de logique pure (fonctions TypeScript). Il n'avait **aucune route HTTP associée**. Le fichier `chat.tsx` appelait `fetch("/api/messages")` mais ce chemin n'existait nulle part dans le routeur TanStack Start.

Dans TanStack Start v1.168.60 avec le preset Nitro `cloudflare-module`, les routes API ne peuvent pas être créées avec `createAPIFileRoute` (module `@tanstack/react-start/api` **inexistant** dans cette version). La seule API correcte est **`createServerFn`**.

---

## 3. Corrections apportées — AVANT / APRÈS détaillé

### 3.1 Création de `src/server-functions/send-message.ts`

**AVANT :** Inexistant — le chat appelait `fetch("/api/messages")` → 404.

**APRÈS :** Fichier `MAVAI/src/server-functions/send-message.ts` créé (34 lignes) :

```typescript
// APRÈS — TanStack Start createServerFn
import { createServerFn } from "@tanstack/react-start";
import { sendMessageHandler, SendMessageSchema } from "./messages";

export const sendMessageFn = createServerFn()
  .validator((data: unknown) => SendMessageSchema.parse(data))
  .handler(async ({ data }) => {
    return sendMessageHandler(data);
  });
```

**Preuve build :** `messages-B-bxvKuh.mjs` (6.60 kB) apparaît dans `.output/server/_ssr/` après le build ✅.

---

### 3.2 Mise à jour de `src/routes/_authenticated/chat.tsx`

**Fichier :** `MAVAI/src/routes/_authenticated/chat.tsx`

**AVANT (lignes 67–86) :**
```typescript
// Ancien code — fetch HTTP vers /api/messages → 404
const formData = new FormData();
formData.append("text", payload.text);
formData.append("mode", payload.mode);
// ...
const res = await fetch("/api/messages", {
  method: "POST",
  body: formData,
});
if (!res.ok) throw new Error(`Erreur serveur ${res.status}`);
const data = await res.json() as { reply: string; audioUrl?: string };
```

**APRÈS (lignes 65–85) :**
```typescript
// Nouveau code — TanStack Start server function (exécutée côté serveur)
const files = [];
for (const f of payload.files) {
  if (f instanceof File && f.size > 0) {
    const buf = await f.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
    files.push({ name: f.name, type: f.type, dataBase64: base64, sizeBytes: f.size });
  }
}
const data = await sendMessageFn({
  data: { text: payload.text, mode: payload.mode, sessionId,
          userId: user.id, userMessageId: userMsg.id, files },
});
```

---

### 3.3 Correction `wrangler.json` (build)

**AVANT :** `compatibility_date: "2026-11-08"` — trop récent, wrangler sur OVH4 refuse.

**APRÈS :** `compatibility_date: "2026-05-03"` — valeur correcte (corrigée post-build via script).

**Script :** `scripts/deploy_mavai_ovh4.sh` — applique la correction automatiquement à chaque déploiement.

---

### 3.4 Ajout de `server/api/messages.post.ts`

Nitro handler H3 pour les déploiements non-Cloudflare Workers (Node.js, Render, Railway).  
Ne s'active pas sur le preset Cloudflare actuel mais prépare la portabilité.

---

## 4. État live après déploiement (2026-11-08T21:03:11Z)

| Vérification | Résultat |
|-------------|---------|
| `https://mavai.artcb.me/` | ✅ HTTP 200 — HTML MAVAI servi |
| `https://artcb.me/health` | ✅ `{"status":"healthy","git_sha":"10957e7b1c5a"}` |
| Service OVH4 `mavai.service` | ✅ `active (running)` depuis Nov 8 19:08 UTC |
| Build `.output/` déployé | ✅ `rsync` + `compatibility_date` fixé |
| Git MAVAI remote | ✅ `de12ad3` sur `vgactech/MAVAI main` |

### Variables d'environnement OVH4 (`/opt/mavai/.env.production`)

| Variable | État |
|----------|------|
| `ARTCB_API_URL` | ✅ Présent |
| `NODE_ENV` | ✅ Présent |
| `PORT` | ✅ Présent |
| `OPENAI_API_KEY` | ❌ **ABSENT** — fallback OpenAI non fonctionnel |
| `ELEVENLABS_API_KEY` | ❌ **ABSENT** — mode vocal non fonctionnel |

> **Action requise par l'opérateur :** Ajouter `OPENAI_API_KEY` et `ELEVENLABS_API_KEY` dans `/opt/mavai/.env.production` sur OVH4, puis `systemctl restart mavai`. Valeurs dans Doppler `lvx`/`dev`.

---

## 5. Architecture d'hébergement ARTCB — Comment ça fonctionne

### 5.1 Ce qui existe aujourd'hui

```
Internet
   │
   ▼
DNS: mavai.artcb.me → 91.134.45.8 (OVH4)
   │
   ▼
nginx:443 (TLS wildcard *.artcb.me)
   │  proxy_pass → 127.0.0.1:3001
   ▼
wrangler dev .output/server/index.mjs --port 3001
   │  (Cloudflare workerd — runtime Nitro)
   ▼
TanStack Start SSR + API (MAVAI frontend)
   │  sendMessageFn → messages.ts
   ▼
ARTcB API (artcb.me:443) ← backend IA blockchain
```

### 5.2 Modules Python ARTCB platform (R638/R639)

| Module | Fichier | Rôle |
|--------|---------|------|
| `AppRuntime` | `src/artcb/platform/app_runtime.py` | Démarre/stoppe/supervise les apps comme processus fils |
| `AppRegistry` | `src/artcb/platform/app_registry.py` | Catalogue JSON des apps hébergées (register/deregister/enable) |
| `DeploymentEngine` | `src/artcb/platform/deployment_engine.py` | Git pull + post-hook + diff SHA avant/après |
| Routes API | `src/api/platform_routes.py` | Endpoints REST `/api/v1/platform/*` |

**Limitation actuelle :** Ces modules Python gèrent des apps Python (uvicorn, FastAPI). MAVAI est une app Node.js/Wrangler — elle nécessite un gestionnaire différent (`npm exec wrangler dev`), géré via systemd sur OVH4.

### 5.3 Ce qu'il manque pour l'hébergement multi-clients

| Lacune | Impact | Solution recommandée |
|--------|--------|---------------------|
| `OPENAI_API_KEY` absent sur OVH4 | Chat bascule sur ARTcB seul (pas de fallback) | Ajouter dans `.env.production` |
| `ELEVENLABS_API_KEY` absent | Mode vocal cassé | Ajouter dans `.env.production` |
| `wrangler.json` regeneré à chaque build | `compatibility_date` revient à la date du jour | Correction dans `deploy_mavai_ovh4.sh` ✅ |
| Pas de DNS sur OVH2 (`151.80.107.29`) | `mavai.artcb.me` ne pointe que sur OVH4 | Ajouter enregistrement A OVH2 + conf nginx |
| Isolation des apps clients | Toutes partagent le même nœud | Sous-domaines dédiés + systemd units par client |
| Pas de déploiement automatique CI | Rebuild + rsync manuel | GitHub Actions → webhook → deploy_mavai_ovh4.sh |
| Logs centralisés | `/var/log/artcb/mavai.log` local | Envoi vers la blockchain ARTCB via `/ai/memo` |

---

## 6. Comment ARTCB peut héberger des applications clients (processus complet)

### 6.1 Ce qui est requis pour héberger une nouvelle app

```
1. DNS        → Ajouter A record: <appname>.artcb.me → IP nœud
2. Build      → Compiler l'app (npm/pip/cargo selon la stack)
3. Deploy     → rsync .output/ ou git pull sur le nœud
4. Env        → Créer /opt/<appname>/.env.production avec les secrets
5. Systemd    → Créer /etc/systemd/system/<appname>.service
6. Nginx      → Créer /etc/nginx/conf.d/<appname>-artcb-me.conf
7. Reload     → systemctl daemon-reload && systemctl enable --now <appname>
8. Vérif      → curl https://<appname>.artcb.me/ → HTTP 200
```

### 6.2 Ce qui manque encore pour être vraiment "plug-and-play"

| Manque | Description |
|--------|-------------|
| API de provisionnement | `POST /api/v1/platform/apps` → crée auto le systemd + nginx + DNS |
| Gestion des certificats | Un cert wildcard `*.artcb.me` suffit (déjà en place) mais les sous-domaines custom clients nécessitent Let's Encrypt individuel |
| Isolation réseau | Pas de conteneurisation (Docker/LXC) — toutes les apps partagent le même OS |
| Facturation / limites | Pas de quotas CPU/RAM par app |
| Déploiement git-push | `git push artcb main` → déploiement automatique (GitHub Actions requis) |

---

## 7. Checklist de validation post-déploiement

| Test | Commande | Résultat attendu |
|------|----------|-----------------|
| Site accessible | `curl https://mavai.artcb.me/` | HTML MAVAI ✅ |
| ARTcB health | `curl https://artcb.me/health` | `{"status":"healthy"}` ✅ |
| Chat (si clés présentes) | Se connecter + envoyer "Bonjour" | Réponse via ARTcB `/ai/think` |
| Lovable | `https://mavai.lovable.app` | ✅ Indépendant, toujours actif |
| OVH4 service | `systemctl is-active mavai` | `active` ✅ |
| Build inclut messages | `.output/server/_ssr/messages-*.mjs` | ✅ 6.60 kB |

---

## 8. Prochaines actions prioritaires

| Priorité | Action | Détail |
|---------|--------|-------|
| **P0** | Ajouter secrets OVH4 | `OPENAI_API_KEY` + `ELEVENLABS_API_KEY` dans `/opt/mavai/.env.production` |
| **P1** | Diodes d'état dans ChatFeed | 3 points colorés : ARTcB connecté / modèle prêt / erreur |
| **P1** | Bandeau métadonnées | Modèle actif, heure, bloc ARTCB |
| **P2** | DNS OVH2 | Ajouter `mavai.artcb.me` → `151.80.107.29` pour redondance |
| **P2** | GitHub Actions CI | Auto-rebuild + rsync à chaque push main |
| **P3** | API provisionnement ARTCB | `POST /api/v1/platform/apps` pour clients futurs |

---

*Rapport produit par l'agent Bob IDE — projet ARTCB / MAVAI*  
*Espace numérotation MAVAI : 001–008 | HEAD MAVAI : `de12ad3` | HEAD ARTCB : `4507989`*
