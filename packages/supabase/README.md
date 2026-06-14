# @forex/supabase

Client Supabase pour forex-gestion: persistance, base vectorielle pgvector et historique des trades.

## Setup

### 1. Créer un projet Supabase

Aller sur [supabase.com](https://supabase.com) > New Project.

### 2. Exécuter la migration SQL

Dans Supabase Dashboard > SQL Editor, coller et exécuter:
```
packages/supabase/migrations/001_init_pgvector.sql
```

### 3. Configurer les variables d'environnement

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...  # Uniquement server-side
```

## Usage

```typescript
import { BaseVectorielleSupabase, DepotTrades } from '@forex/supabase';
import { OpenAIEmbeddings } from '@forex/rag';

// RAG avec Supabase pgvector
const base = new BaseVectorielleSupabase(new OpenAIEmbeddings());
await base.indexerDocument({ id: '1', contenu: 'EUR/USD analyse...', metadata: { source: 'analyste', categorie: 'analyse' } });
const contexte = await base.obtenirContexte('tendance EUR/USD');

// Trades
const depot = new DepotTrades();
const idTrade = await depot.ouvrirTrade({ paire: 'EUR_USD', direction: 'ACHAT', ... });
await depot.fermerTrade(idTrade, { prixSortie: 1.095, profitPerte: 100 });
```

## Swap Ollama Embeddings (après PC)

Changer le dimension du vecteur dans la migration:
```sql
-- Pour Ollama nomic-embed-text (768 dimensions):
ALTER TABLE documents_rag ALTER COLUMN vecteur TYPE vector(768);
```

Et dans le code:
```typescript
import { OllamaEmbeddings } from '@forex/rag';
const base = new BaseVectorielleSupabase(new OllamaEmbeddings()); // swap 0 code!
```
