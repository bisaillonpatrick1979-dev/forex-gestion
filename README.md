# Forex Gestion — Système Multi-Agents IA

Système de gestion forex automatisé avec agents IA, intégration OANDA et RAG.

## Architecture

```
forex-gestion/
├── apps/
│   └── web/              # Interface Next.js (déployée sur Vercel)
└── packages/
    ├── api-switcher/     # Routeur multi-fournisseurs IA (OpenAI/Anthropic/Gemini/Ollama)
    ├── agents/           # Agents IA spécialisés (Analyste/Gestionnaire/Exécuteur)
    ├── oanda-client/     # Client OANDA REST + Streaming
    ├── rag/              # RAG avec embeddings (stub → Ollama local)
    └── logger/           # Logging structuré (Pino)
```

## Démarrage rapide

```bash
# Prérequis: Node 20+, pnpm 9+
npm install -g pnpm

# Installation
pnpm install

# Configuration
cp .env.local.example .env.local
# Remplir les clés API dans .env.local

# Développement
pnpm dev

# Tests
pnpm test

# Build production
pnpm build
```

## Fournisseurs IA supportés

| Fournisseur | Modèle par défaut | Tier gratuit |
|-------------|-------------------|-------------|
| OpenAI | gpt-4o-mini | Oui (limité) |
| Anthropic | claude-haiku-4-5 | Oui (dev) |
| Google Gemini | gemini-1.5-flash | Oui |
| Ollama | nomic-embed-text | Local |

## Déploiement Vercel

Chaque push sur `main` déclenche un déploiement automatique.
Configurer les variables d'environnement dans le dashboard Vercel.

## Phases de développement

- **Semaine 1-2**: Monorepo + multi-API switcher + OANDA de base
- **Semaine 2-3**: Agents IA + RAG Supabase (embeddings mock)
- **Semaine 3+**: Scrapers, fine-tuning, déploiement Vercel
- **Après PC**: Ollama local, paper trading live, boucle de rétroaction
