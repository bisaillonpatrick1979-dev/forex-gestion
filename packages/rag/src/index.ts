/**
 * @forex/rag
 *
 * Système RAG (Retrieval-Augmented Generation) pour enrichir
 * les agents IA avec du contexte historique et des règles de trading.
 *
 * Architecture:
 * - Embeddings: OpenAI stub → swap vers Ollama/Nomic après réception PC
 * - Stockage: mémoire → swap vers Supabase pgvector (semaine 2-3)
 * - Interface IFournisseurEmbeddings garantit le swap sans changer le code appelant
 */

export { RetrieverRAG } from './retriever.js';
export { OpenAIEmbeddings } from './embeddings/openai-embeddings.js';
export { OllamaEmbeddings } from './embeddings/ollama-embeddings.js';
export type {
  Document,
  DocumentVectorise,
  ResultatRecherche,
  IFournisseurEmbeddings,
  ConfigBaseVectorielle,
} from './types.js';

import { OpenAIEmbeddings } from './embeddings/openai-embeddings.js';
import { OllamaEmbeddings } from './embeddings/ollama-embeddings.js';
import { RetrieverRAG } from './retriever.js';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'rag' });

/**
 * Crée le RetrieverRAG avec le bon fournisseur d'embeddings
 * selon la variable d'environnement EMBEDDING_PROVIDER.
 *
 * EMBEDDING_PROVIDER=openai  → text-embedding-3-small (défaut, cloud)
 * EMBEDDING_PROVIDER=ollama  → nomic-embed-text (local, après réception PC)
 */
export function creerRetriever(): RetrieverRAG {
  const fournisseurNom = process.env['EMBEDDING_PROVIDER'] ?? 'openai';

  let fournisseur;
  if (fournisseurNom === 'ollama') {
    log.info('Fournisseur embeddings: Ollama/Nomic (local)');
    fournisseur = new OllamaEmbeddings();
  } else {
    log.info('Fournisseur embeddings: OpenAI text-embedding-3-small');
    fournisseur = new OpenAIEmbeddings();
  }

  return new RetrieverRAG(fournisseur);
}
