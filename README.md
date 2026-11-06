# MAVAI — Frontend

**Mémoire Artificielle Visuelle & IA** — Frontend React/TypeScript

> Fork de [klerio-project-hub](https://github.com/vgactech/klerio-project-hub) — réutilisation du chat IA, Sprites2D et fonctionnalités UI.

---

## Architecture

```
vgactech/MAVAI  (ce dépôt)         ← FRONTEND
  React + TanStack Start
  Chat IA multi-modal
  Sprites2D (animation / QA frame)
  Connexion backend MAVAI via /api/*

vgactech/MAVAI  (branche backend)  ← BACKEND (même dépôt, dossier backend/)
  Python FastAPI
  src/mavai/ (coordinator, agents, continuity, memory)
  Connecté à ARTcB blockchain (nœuds OVH2 + OVH4)
```

## Dépôts liés

| Dépôt | Rôle |
|-------|------|
| `vgactech/MAVAI` | Frontend MAVAI (ce dépôt) |
| `vgactech/artcb` | Blockchain ARTcB — infrastructure hôte |
| `vgactech/klerio-project-hub` | Source originale (fork) |

## Stack technique

- **React** + **TanStack Router** + **Vite** (Rolldown)
- **Sprites2D** — packages animation/QA/schema/SDK
- **Lovable Auth** — authentification
- **ARTcB Backend** — hébergement, mémoire blockchain, PoL

## Installation

```bash
npm install
npm run dev       # dev server
npm run build     # production build
npm run test      # tests vitest
```

## Variables d'environnement

```bash
VITE_MAVAI_BACKEND_URL=http://localhost:8000   # URL du backend MAVAI
VITE_ARTCB_NODE_URL=https://artcb.me           # Nœud ARTcB live
```

## Structure

```
src/
  routes/           # Pages TanStack Router
    index.tsx       # Page d'accueil MAVAI
    _authenticated/
      chat.tsx      # Interface chat MAVAI (fork klerio)
      dashboard.tsx
      play.tsx      # Sprites2D / jeu
  components/
    chat/           # ChatFeed, ChatComposer, Mascot
    ui/             # Composants shadcn/ui
  types/
    mavai.ts        # Types domaine MAVAI (fork klerio.ts)
packages/
  sprites2d-core/   # Moteur animation 2D
  sprites2d-character/
  sprites2d-quality/ # QA frame par frame
  sprites2d-schema/
  sprites2d-sdk/
```

## CERTIFIED_100=false | unique_human_proven=false | Mode DEBUG actif

*ARTcB blockchain — infrastructure décentralisée MAVAI*
