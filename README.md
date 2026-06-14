# Forex Gestion — Système Multi-Agents IA

Plateforme de trading forex automatisée avec 3 agents IA spécialisés, intégration OANDA v20,
base vectorielle pgvector et scraping de données macro.

## Architecture

```
forex-gestion/
├── apps/
│   └── web/              # Next.js 15 — déployé sur Vercel
└── packages/
    ├── logger/           # Logging structuré (Pino)
    ├── api-switcher/     # Routeur IA pluggable (OpenAI/Anthropic/Gemini/Ollama)
    ├── oanda-client/     # Client OANDA v20 REST + Streaming
    ├── agents/           # 3 agents IA (Analyste/Gestionnaire/Exécuteur)
    ├── rag/              # Embeddings OpenAI → swap Ollama/Nomic
    ├── supabase/         # pgvector + persistance trades
    └── scraper/          # Calendrier macro + actualités + indicateurs FRED
```

## Pipeline des agents

```
OANDA (bougies) + Calendrier macro
         │
         ▼
  [Agent 1: Analyste Technique]
  Direction + Confiance + Niveaux clés
         │ (si confiance ≥ 60%)
         ▼
  [Agent 2: Gestionnaire des Risques]
  Taille position + Stop Loss + Take Profit
         │
         ▼
  [Agent 3: Exécuteur]
  EXECUTER | ATTENDRE | REJETER
         │
         ▼
  Supabase (persistance signal + trade)
```

## Démarrage rapide

```bash
# Prérequis: Node 20+, pnpm 9+
npm install -g pnpm

# 1. Cloner et installer
git clone https://github.com/bisaillonpatrick1979-dev/forex-gestion
cd forex-gestion
pnpm install

# 2. Configurer les variables d'environnement
cp .env.local.example .env.local
# Éditer .env.local avec tes clés API

# 3. Lancer la migration Supabase
# Copier-coller packages/supabase/migrations/001_init_pgvector.sql
# dans Supabase Dashboard > SQL Editor

# 4. Développement
pnpm dev

# 5. Tests
pnpm test
```

## Déploiement Vercel

1. Connecter le repo sur [vercel.com](https://vercel.com)
2. Framework: **Next.js**
3. Root directory: `apps/web`
4. Build command: `cd ../.. && pnpm build`
5. Ajouter les variables d'environnement dans Vercel Dashboard

## Clés API nécessaires (toutes gratuites)

| Service | Tier gratuit | Lien |
|---------|-------------|------|
| OpenAI | Oui (limité) | [platform.openai.com](https://platform.openai.com) |
| Anthropic | Oui (dev) | [console.anthropic.com](https://console.anthropic.com) |
| Google Gemini | Oui (généreux) | [aistudio.google.com](https://aistudio.google.com) |
| OANDA | Compte practice gratuit | [oanda.com](https://www.oanda.com) |
| Supabase | 500 MB gratuit | [supabase.com](https://supabase.com) |
| NewsAPI | 1000 req/jour gratuit | [newsapi.org](https://newsapi.org) |
| FRED | Illimité gratuit | [fred.stlouisfed.org](https://fred.stlouisfed.org) |

## Feuille de route

- [x] **Semaine 1-2**: Monorepo + API switcher + OANDA + 3 agents
- [x] **Semaine 2-3**: Supabase pgvector + RAG + scraper macro
- [ ] **Semaine 3+**: Dashboard UI temps réel + paper trading boucle
- [ ] **Après PC**: Ollama local (swap zero-code), fine-tuning, feedback loop

## Routes API disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Statut système |
| POST | `/api/agents/pipeline` | Pipeline complet 3-agents |
| POST | `/api/agents/analyser` | Analyse technique seule |
| GET | `/api/oanda/compte` | Informations compte OANDA |
| GET | `/api/oanda/bougies/[paire]` | Historique bougies |
| GET | `/api/trades` | Historique trades (Supabase) |
| GET | `/api/calendrier` | Événements économiques semaine |
