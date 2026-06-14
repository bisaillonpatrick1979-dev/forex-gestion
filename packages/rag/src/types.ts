/** Un document indexé dans la base vectorielle */
export interface Document {
  id: string;
  contenu: string;
  metadata: {
    source: string;
    categorie: 'analyse' | 'actualite' | 'historique' | 'regle';
    date?: string;
    paire?: string;
  };
}

/** Un document avec son vecteur d'embedding */
export interface DocumentVectorise extends Document {
  vecteur: number[];
}

/** Résultat de recherche sémantique */
export interface ResultatRecherche {
  document: Document;
  score: number; // similarité cosinus (0-1)
}

/** Interface que tout fournisseur d'embeddings doit implémenter */
export interface IFournisseurEmbeddings {
  readonly nom: string;
  readonly dimension: number;
  genererEmbedding(texte: string): Promise<number[]>;
  genererEmbeddingsBatch(textes: string[]): Promise<number[][]>;
}

/** Configuration de la base vectorielle */
export interface ConfigBaseVectorielle {
  /** Nombre de résultats à retourner par défaut */
  topK?: number;
  /** Score minimum de similarité (0-1) */
  seuilSimilarite?: number;
}
