import { creerLogger } from '@forex/logger';
import type {
  Document,
  DocumentVectorise,
  ResultatRecherche,
  IFournisseurEmbeddings,
  ConfigBaseVectorielle,
} from './types.js';

const log = creerLogger({ module: 'rag:retriever' });

/**
 * Calcule la similarité cosinus entre deux vecteurs.
 * Retourne une valeur entre -1 et 1 (1 = identiques).
 */
function similariteCosinus(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimensions incompatibles: ${a.length} vs ${b.length}`);
  }

  let produitScalaire = 0;
  let normeA = 0;
  let normeB = 0;

  for (let i = 0; i < a.length; i++) {
    produitScalaire += (a[i] ?? 0) * (b[i] ?? 0);
    normeA += (a[i] ?? 0) ** 2;
    normeB += (b[i] ?? 0) ** 2;
  }

  if (normeA === 0 || normeB === 0) return 0;
  return produitScalaire / (Math.sqrt(normeA) * Math.sqrt(normeB));
}

/**
 * Base vectorielle en mémoire.
 * Pour la production, remplacer par Supabase pgvector ou Pinecone.
 *
 * SWAP POINT: Implémenter IBaseVectorielle avec Supabase après la semaine 2.
 */
export class RetrieverRAG {
  private documents: DocumentVectorise[] = [];
  private readonly fournisseur: IFournisseurEmbeddings;
  private readonly topK: number;
  private readonly seuilSimilarite: number;

  constructor(fournisseur: IFournisseurEmbeddings, config: ConfigBaseVectorielle = {}) {
    this.fournisseur = fournisseur;
    this.topK = config.topK ?? 5;
    this.seuilSimilarite = config.seuilSimilarite ?? 0.7;

    log.info(
      { fournisseur: fournisseur.nom, dimension: fournisseur.dimension, topK: this.topK },
      'RetrieverRAG initialisé'
    );
  }

  /** Indexe un document dans la base vectorielle */
  async indexerDocument(document: Document): Promise<void> {
    const vecteur = await this.fournisseur.genererEmbedding(document.contenu);
    this.documents.push({ ...document, vecteur });
    log.debug({ id: document.id, categorie: document.metadata.categorie }, 'Document indexé');
  }

  /** Indexe plusieurs documents en batch */
  async indexerDocuments(documents: Document[]): Promise<void> {
    const textes = documents.map((d) => d.contenu);
    const vecteurs = await this.fournisseur.genererEmbeddingsBatch(textes);

    for (let i = 0; i < documents.length; i++) {
      this.documents.push({ ...documents[i]!, vecteur: vecteurs[i]! });
    }

    log.info({ count: documents.length }, 'Documents indexés en batch');
  }

  /**
   * Recherche sémantique: retourne les documents les plus similaires à la requête.
   */
  async rechercher(requete: string, topK?: number): Promise<ResultatRecherche[]> {
    if (this.documents.length === 0) {
      log.warn('Recherche sur base vide');
      return [];
    }

    const vecteurRequete = await this.fournisseur.genererEmbedding(requete);
    const k = topK ?? this.topK;

    // Calculer la similarité avec tous les documents
    const scores = this.documents.map((doc) => ({
      document: doc as Document,
      score: similariteCosinus(vecteurRequete, doc.vecteur),
    }));

    // Trier par score décroissant et filtrer par seuil
    const resultats = scores
      .filter((r) => r.score >= this.seuilSimilarite)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    log.debug(
      { requete: requete.slice(0, 50), nbResultats: resultats.length, topK: k },
      'Recherche RAG terminée'
    );

    return resultats;
  }

  /** Retourne le contexte RAG formaté pour injection dans un prompt */
  async obtenirContexte(requete: string): Promise<string> {
    const resultats = await this.rechercher(requete);

    if (resultats.length === 0) {
      return 'Aucun contexte historique pertinent trouvé.';
    }

    const contexte = resultats
      .map((r, i) => `[${i + 1}] (Score: ${(r.score * 100).toFixed(0)}%) ${r.document.contenu}`)
      .join('\n\n');

    return `Contexte historique pertinent:\n${contexte}`;
  }

  /** Nombre de documents indexés */
  get taille(): number {
    return this.documents.length;
  }
}
