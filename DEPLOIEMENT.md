# Guide de déploiement — Forex Gestion

## Étape 1: Comptes et clés API

### OANDA (obligatoire)
1. Créer un compte **practice** sur [oanda.com](https://www.oanda.com)
2. Tableau de bord > Gestion de compte > Accès à l'API
3. Générer un token API
4. Copier l’ID du compte (format: `001-001-XXXXXXXX-001`)

### OpenAI (fournisseur IA par défaut)
1. [platform.openai.com](https://platform.openai.com) > API keys
2. Créer une clé → copier dans `OPENAI_API_KEY`
3. Modèle: `gpt-4o-mini` (moins cher, assez puissant)

### Google Gemini (alternative gratuite généreuse)
1. [aistudio.google.com](https://aistudio.google.com) > Get API Key
2. Modèle: `gemini-1.5-flash` (tier gratuit très généreux)
3. Changer `AI_PROVIDER=gemini` pour utiliser Gemini au lieu d'OpenAI

### Supabase (base vectorielle + persistance)
1. [supabase.com](https://supabase.com) > New Project
2. Choisir la région la plus proche (ex: `ca-central-1` pour Montréal)
3. Copier `SUPABASE_URL` et les clés dans `.env.local`
4. Dans SQL Editor, exécuter:
   ```sql
   -- Copier le contenu de:
   -- packages/supabase/migrations/001_init_pgvector.sql
   ```

### NewsAPI (actualités, optionnel)
1. [newsapi.org](https://newsapi.org) > Get API Key (gratuit)
2. Copier dans `NEWS_API_KEY`

### FRED (indicateurs macro, optionnel)
1. [fred.stlouisfed.org](https://fred.stlouisfed.org) > My Account > API Keys
2. Copier dans `FRED_API_KEY`

---

## Étape 2: Configuration locale

```bash
cp .env.local.example .env.local
```

Éditer `.env.local` avec toutes les clés obtenues ci-dessus.

```bash
pnpm install
pnpm dev
# Ouvrir http://localhost:3000
```

Tester l’API:
```bash
# Santé du système
curl http://localhost:3000/api/health

# Analyse EUR/USD
curl -X POST http://localhost:3000/api/agents/analyser \
  -H 'Content-Type: application/json' \
  -d '{"paire": "EUR_USD", "granularite": "H4"}'

# Pipeline complet (paper trading, sans exécution réelle)
curl -X POST http://localhost:3000/api/agents/pipeline \
  -H 'Content-Type: application/json' \
  -d '{"paire": "EUR_USD", "capital": 10000, "executerTrade": false}'
```

---

## Étape 3: Déploiement Vercel

### Option A — Via interface Vercel (recommandé)

1. [vercel.com](https://vercel.com) > New Project > Import Git Repository
2. Sélectionner `forex-gestion`
3. **Root Directory**: `apps/web`
4. **Build Command**: `cd ../.. && pnpm build --filter=@forex/web`
5. **Install Command**: `cd ../.. && pnpm install --no-frozen-lockfile`
6. Ajouter toutes les variables d'env dans **Settings > Environment Variables**

### Variables Vercel obligatoires

```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OANDA_API_KEY=...
OANDA_ACCOUNT_ID=...
OANDA_ENV=practice
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=production
LOG_LEVEL=info
```

### Option B — Via Vercel CLI

```bash
npm install -g vercel
cd apps/web
vercel --prod
```

---

## Étape 4: Swap Ollama (après réception du PC)

```bash
# 1. Installer Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Télécharger les modèles
ollama pull llama3.2           # LLM principal
ollama pull nomic-embed-text   # Embeddings

# 3. Changer .env.local
AI_PROVIDER=ollama
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# 4. Aucun changement de code requis!
pnpm dev
```

Pour Supabase pgvector avec Ollama (768 dimensions au lieu de 1536):
```sql
-- Dans Supabase SQL Editor
ALTER TABLE documents_rag ALTER COLUMN vecteur TYPE vector(768)
USING vecteur::vector(768);

-- Recréer l'index
DROP INDEX idx_documents_rag_vecteur;
CREATE INDEX idx_documents_rag_vecteur
  ON documents_rag USING hnsw (vecteur vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```
