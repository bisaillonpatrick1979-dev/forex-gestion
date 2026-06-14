# Architecture Forex Gestion

## Vue d'ensemble

```
forex-gestion/
├── apps/
│   └── web/                    # Next.js 15 (Vercel)
│       ├── src/app/
│       │   ├── page.tsx            # Dashboard principal
│       │   └── api/
│       │       ├── health/         # GET /api/health
│       │       ├── agents/
│       │       │   ├── pipeline/   # POST /api/agents/pipeline
│       │       │   └── analyser/   # POST /api/agents/analyser
│       │       └── oanda/
│       │           ├── compte/     # GET /api/oanda/compte
│       │           └── bougies/    # GET /api/oanda/bougies/[paire]
│       └── next.config.ts
└── packages/
    ├── logger/                 # Logging structuré (Pino)
    ├── api-switcher/           # Routeur multi-fournisseurs IA
    ├── oanda-client/           # Client OANDA REST + Streaming
    ├── agents/                 # 3 agents IA spécialisés
    └── rag/                    # RAG avec embeddings
```

## Pipeline 3-Agents

```
      Données OANDA
           │
           ▼
  ┌─────────────────┐
  │  Agent 1         │
  │  Analyste        │──► Direction + Confiance + Niveaux clés
  └─────────────────┘
           │
           ▼  (si confiance ≥ 60%)
  ┌─────────────────┐
  │  Agent 2         │
  │  Gestionnaire    │──► Taille position + Stop Loss + TP + R/R
  └─────────────────┘
           │
           ▼  (si paramètres valides)
  ┌─────────────────┐
  │  Agent 3         │
  │  Exécuteur       │──► EXECUTER | ATTENDRE | REJETER
  └─────────────────┘
```

## Swap Points prévus

| Composant | Actuel (Cloud) | Futur (Local PC) |
|-----------|---------------|------------------|
| LLM | OpenAI/Anthropic/Gemini | Ollama (llama3.2) |
| Embeddings | OpenAI text-embedding-3-small | Ollama nomic-embed-text |
| Base vectorielle | Mémoire | Supabase pgvector |

## Flux de données

```
OANDA API → oanda-client → agents → api-switcher → IA (OpenAI/etc.)
                                ↑
                               rag (contexte historique)
```

## Conventions de code

- Commentaires et noms de variables: français québécois
- Noms de fichiers/packages: anglais (convention npm)
- TypeScript strict: `noImplicitAny`, `strictNullChecks`
- Logging: Pino uniquement (jamais `console.log`)
- Tests: Vitest, couverture >80% logique critique
- Secrets: `.env.local` gitignoré, Vercel UI pour prod
