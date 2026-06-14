import { creerLogger } from '@forex/logger';
import type { IFournisseurEmbeddings } from '../types.js';

const log = creerLogger({ module: 'rag:embeddings:ollama' });

/**
 * Fournisseur d'embeddings Ollama (Nomic Embed Text).
 * Actif après réception du PC local.
 *
 * Pour activer:
 * 1. Installer Ollama: curl https://ollama.ai/install.sh | sh
 * 2. Télécharger le modèle: ollama pull nomic-embed-text
 * 3. Changer EMBEDDING_PROVIDER=ollama dans .env.local
 */
export class OllamaEmbeddings implements IFournisseurEmbeddings {
  readonly nom = 'ollama-nomic';
  readonly dimension = 768; // Nomic Embed Text: 768 dimensions

  private readonly urlBase: string;
  private readonly modele: string;

  constructor(urlBase?: string, modele?: string) {
    this.urlBase = urlBase ?? process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:11434';
    this.modele = modele ?? process.env['OLLAMA_EMBED_MODEL'] ?? 'nomic-embed-text';
  }

  estDisponible(): boolean {
    return process.env['OLLAMA_BASE_URL'] !== undefined && process.env['NODE_ENV'] !== 'production';
  }

  async genererEmbedding(texte: string): Promise<number[]> {
    log.debug({ longueur: texte.length, modele: this.modele }, 'Génération embedding Ollama');

    const reponse = await fetch(`${this.urlBase}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.modele, input: texte }),
    });

    if (!reponse.ok) {
      throw new Error(`Erreur Ollama embeddings: HTTP ${reponse.status}`);
    }

    const donnees = (await reponse.json()) as { embeddings: number[][] };
    return donnees.embeddings[0] ?? [];
  }

  async genererEmbeddingsBatch(textes: string[]): Promise<number[][]> {
    // Ollama traite en batch natif
    const resultats = await Promise.all(textes.map((t) => this.genererEmbedding(t)));
    return resultats;
  }
}
