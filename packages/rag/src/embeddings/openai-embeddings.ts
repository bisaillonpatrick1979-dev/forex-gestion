import OpenAI from 'openai';
import { creerLogger } from '@forex/logger';
import type { IFournisseurEmbeddings } from '../types.js';

const log = creerLogger({ module: 'rag:embeddings:openai' });

/**
 * Fournisseur d'embeddings OpenAI.
 * Modèle: text-embedding-3-small (dimensions: 1536, économique)
 *
 * SWAP POINT: Remplacer par OllamaEmbeddings après réception du PC.
 * L'interface IFournisseurEmbeddings garantit la compatibilité.
 */
export class OpenAIEmbeddings implements IFournisseurEmbeddings {
  readonly nom = 'openai-embeddings';
  readonly dimension = 1536;

  private readonly modele: string;
  private client: OpenAI | null = null;

  constructor(modele = 'text-embedding-3-small') {
    this.modele = modele;
  }

  private obtenirClient(): OpenAI {
    if (!this.client) {
      const cleApi = process.env['OPENAI_API_KEY'];
      if (!cleApi) throw new Error('OPENAI_API_KEY requis pour les embeddings');
      this.client = new OpenAI({ apiKey: cleApi });
    }
    return this.client;
  }

  async genererEmbedding(texte: string): Promise<number[]> {
    const client = this.obtenirClient();
    log.debug({ longueur: texte.length }, 'Génération embedding OpenAI');

    const reponse = await client.embeddings.create({
      model: this.modele,
      input: texte,
    });

    return reponse.data[0]?.embedding ?? [];
  }

  async genererEmbeddingsBatch(textes: string[]): Promise<number[][]> {
    const client = this.obtenirClient();
    log.debug({ count: textes.length }, 'Génération embeddings batch OpenAI');

    const reponse = await client.embeddings.create({
      model: this.modele,
      input: textes,
    });

    return reponse.data.map((item) => item.embedding);
  }
}
