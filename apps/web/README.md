# @forex/web

Interface Next.js 15 du système forex-gestion, déployée automatiquement sur Vercel.

## Développement local

```bash
# Depuis la racine du monorepo
pnpm dev

# Ou directement
cd apps/web && pnpm dev
```

## Routes API

### Santé
- `GET /api/health` — Statut système et configuration

### Agents IA
- `POST /api/agents/pipeline` — Pipeline complet 3-agents
- `POST /api/agents/analyser` — Analyse technique seule

### OANDA
- `GET /api/oanda/compte` — Informations du compte
- `GET /api/oanda/bougies/[paire]` — Historique bougies

## Variables d'environnement Vercel

Configurer dans le dashboard Vercel (Settings > Environment Variables):

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OANDA_API_KEY=...
OANDA_ACCOUNT_ID=...
OANDA_ENV=practice
```

## Déploiement

Chaque push sur `main` déclenche un déploiement Vercel automatique.
Le fichier `vercel.json` à la racine configure le build.
