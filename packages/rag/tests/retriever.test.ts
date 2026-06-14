import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetrieverRAG } from '../src/retriever.js';
import type { IFournisseurEmbeddings, Document } from '../src/types.js';

// Fournisseur d'embeddings factice pour les tests
// Génère des vecteurs déterministes basés sur le contenu du texte
const fournisseurFactice: IFournisseurEmbeddings = {
  nom: 'factice',
  dimension: 4,
  genererEmbedding: vi.fn(async (texte: string): Promise<number[]> => {
    // Vecteur simple basé sur la longueur du texte pour les tests
    const hash = texte.length % 4;
    return [hash === 0 ? 1 : 0, hash === 1 ? 1 : 0, hash === 2 ? 1 : 0, hash === 3 ? 1 : 0];
  }),
  genererEmbeddingsBatch: vi.fn(async (textes: string[]): Promise<number[][]> => {
    return textes.map((t) => {
      const hash = t.length % 4;
      return [hash === 0 ? 1 : 0, hash === 1 ? 1 : 0, hash === 2 ? 1 : 0, hash === 3 ? 1 : 0];
    });
  }),
};

const documentTest: Document = {
  id: 'doc-001',
  contenu: 'EUR/USD tendànce haussière identifiée sur H4 avec support à 1.0850.',
  metadata: {
    source: 'analyse-technique',
    categorie: 'analyse',
    paire: 'EUR_USD',
    date: '2024-01-15',
  },
};

describe('RetrieverRAG', () => {
  let retriever: RetrieverRAG;

  beforeEach(() => {
    retriever = new RetrieverRAG(fournisseurFactice, { seuilSimilarite: 0.5 });
    vi.clearAllMocks();
  });

  it('initialise avec une base vide', () => {
    expect(retriever.taille).toBe(0);
  });

  it('indexe un document et incrémente la taille', async () => {
    await retriever.indexerDocument(documentTest);
    expect(retriever.taille).toBe(1);
  });

  it('indexe plusieurs documents en batch', async () => {
    const docs: Document[] = [
      { ...documentTest, id: 'doc-001' },
      { ...documentTest, id: 'doc-002', contenu: 'GBP/USD résistance à 1.2700.' },
    ];
    await retriever.indexerDocuments(docs);
    expect(retriever.taille).toBe(2);
  });

  it('retourne une liste vide si la base est vide', async () => {
    const resultats = await retriever.rechercher('EUR/USD analyse');
    expect(resultats).toHaveLength(0);
  });

  it('retourne le contexte formaté après indexation', async () => {
    await retriever.indexerDocument(documentTest);
    const contexte = await retriever.obtenirContexte('EUR/USD tendànce');
    // Avec un fournisseur factice, le résultat dépend des vecteurs générés
    expect(typeof contexte).toBe('string');
  });
});

describe('similarité cosinus (via RetrieverRAG)', () => {
  it('recherche correctement avec un fournisseur qui retourne des vecteurs identiques', async () => {
    // Fournisseur qui retourne toujours le même vecteur (similarité = 1)
    const fournisseurIdentique: IFournisseurEmbeddings = {
      nom: 'identique',
      dimension: 3,
      genererEmbedding: vi.fn().mockResolvedValue([1, 0, 0]),
      genererEmbeddingsBatch: vi.fn().mockResolvedValue([[1, 0, 0]]),
    };

    const r = new RetrieverRAG(fournisseurIdentique, { seuilSimilarite: 0.9 });
    await r.indexerDocument(documentTest);
    const resultats = await r.rechercher('requête test');

    expect(resultats).toHaveLength(1);
    expect(resultats[0]?.score).toBeCloseTo(1.0, 5);
  });
});
