# @forex/rag

Système RAG (Retrieval-Augmented Generation) pour enrichir les agents IA avec du contexte historique.

## Usage

```typescript
import { creerRetriever } from '@forex/rag';

const retriever = creerRetriever(); // Utilise EMBEDDING_PROVIDER depuis .env

// Indexer des documents
await retriever.indexerDocument({
  id: 'analyse-001',
  contenu: 'EUR/USD: tendance haussière confirmée par le franchissement de la MA200.',
  metadata: { source: 'analyste', categorie: 'analyse', paire: 'EUR_USD' },
});

// Obtenir du contexte pour un prompt
const contexte = await retriever.obtenirContexte('Quelle est la tendance EUR/USD?');
console.log(contexte);
// → Contexte historique pertinent:
// [1] (Score: 95%) EUR/USD: tendance haussière...
```

## Swap Ollama

```bash
# Changer dans .env.local
EMBEDDING_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text

# Aucun changement de code requis!
```

## Fournisseurs d'embeddings

| Fournisseur | Modèle | Dimensions | Usage |
|-------------|--------|-----------|-------|
| OpenAI | text-embedding-3-small | 1536 | Cloud (défaut) |
| Ollama/Nomic | nomic-embed-text | 768 | Local (après PC) |
