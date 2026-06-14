import { creerLogger } from '@forex/logger';
import { obtenirClientSupabaseAdmin } from './client.js';
import type { IFournisseurEmbeddings, Document, ResultatRecherche } from '@forex/rag';

const log = creerLogger({ module: 'supabase:vecteurs' });

/**
 * Base vectorielle Supabase pgvector.
 * Remplace le RetrieverRAG en mémoire pour la production.
 *
 * Utilise la fonction SQL `rechercher_documents` définie dans la migration.
 */
export class BaseVectorielleSupabase {
  private readonly fournisseur: IFournisseurEmbeddings;
  private readonly seuilSimilarite: number;
  private readonly topK: number;

  constructor(
    fournisseur: IFournisseurEmbeddings,
    options: { seuilSimilarite?: number; topK?: number } = {}
  ) {
    this.fournisseur = fournisseur;
    this.seuilSimilarite = options.seuilSimilarite ?? 0.7;
    this.topK = options.topK ?? 5;

    log.info(
      { fournisseur: fournisseur.nom, dimension: fournisseur.dimension },
      'BaseVectorielleSupabase initialisée'
    );
  }

  /** Indexe un document dans Supabase (upsert par id) */
  async indexerDocument(document: Document): Promise<void> {
    const client = obtenirClientSupabaseAdmin();
    const vecteur = await this.fournisseur.genererEmbedding(document.contenu);

    const { error } = await client
      .from('documents_rag')
      .upsert({
        id: document.id,
        contenu: document.contenu,
        vecteur,
        metadata: document.metadata,
      });

    if (error) {
      log.error({ id: document.id, erreur: error.message }, 'Erreur indexation Supabase');
      throw new Error(`Erreur Supabase upsert: ${error.message}`);
    }

    log.debug({ id: document.id }, 'Document indexé dans Supabase');
  }

  /** Indexe plusieurs documents en batch */
  async indexerDocuments(documents: Document[]): Promise<void> {
    const textes = documents.map((d) => d.contenu);
    const vecteurs = await this.fournisseur.genererEmbeddingsBatch(textes);

    const lignes = documents.map((doc, i) => ({
      id: doc.id,
      contenu: doc.contenu,
      vecteur: vecteurs[i]!,
      metadata: doc.metadata,
    }));

    const client = obtenirClientSupabaseAdmin();
    const { error } = await client.from('documents_rag').upsert(lignes);

    if (error) {
      log.error({ count: documents.length, erreur: error.message }, 'Erreur indexation batch');
      throw new Error(`Erreur Supabase upsert batch: ${error.message}`);
    }

    log.info({ count: documents.length }, 'Batch indexé dans Supabase');
  }

  /** Recherche sémantique via la fonction SQL pgvector */
  async rechercher(
    requete: string,
    options: { topK?: number; categorie?: string; paire?: string } = {}
  ): Promise<ResultatRecherche[]> {
    const client = obtenirClientSupabaseAdmin();
    const vecteurRequete = await this.fournisseur.genererEmbedding(requete);

    const { data, error } = await client.rpc('rechercher_documents', {
      vecteur_requete: vecteurRequete,
      seuil_similarite: this.seuilSimilarite,
      top_k: options.topK ?? this.topK,
      filtre_categorie: options.categorie ?? null,
      filtre_paire: options.paire ?? null,
    });

    if (error) {
      log.error({ erreur: error.message }, 'Erreur recherche Supabase');
      throw new Error(`Erreur recherche pgvector: ${error.message}`);
    }

    const resultats: ResultatRecherche[] = (data ?? []).map((row) => ({
      document: {
        id: row.id,
        contenu: row.contenu,
        metadata: row.metadata as Document['metadata'],
      },
      score: row.score,
    }));

    log.debug({ requete: requete.slice(0, 50), nbResultats: resultats.length }, 'Recherche pgvector');
    return resultats;
  }

  /** Retourne le contexte formaté pour injection dans un prompt agent */
  async obtenirContexte(
    requete: string,
    options?: { categorie?: string; paire?: string }
  ): Promise<string> {
    const resultats = await this.rechercher(requete, options);

    if (resultats.length === 0) {
      return 'Aucun contexte historique pertinent dans la base de connaissances.';
    }

    return [
      'Contexte historique pertinent:',
      ...resultats.map(
        (r, i) => `[${i + 1}] (Pertinence: ${(r.score * 100).toFixed(0)}%)\n${r.document.contenu}`
      ),
    ].join('\n\n');
  }
}
