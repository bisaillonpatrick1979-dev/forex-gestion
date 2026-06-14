import { creerLogger } from '@forex/logger';
import { obtenirClientSupabaseAdmin } from './client.js';
import type { ResultatPipeline } from '@forex/agents';

const log = creerLogger({ module: 'supabase:trades' });

export interface NouveauTrade {
  paire: string;
  direction: 'ACHAT' | 'VENTE';
  taillePosition: number;
  prixEntree: number;
  stopLoss: number;
  takeProfit: number;
  resultatPipeline?: ResultatPipeline;
}

export interface FermetureTrade {
  prixSortie: number;
  profitPerte: number;
}

/**
 * Persistance de l'historique des trades dans Supabase.
 * Utilisé pour le paper trading et la boucle de rétroaction.
 */
export class DepotTrades {
  /**
   * Enregistre un nouveau trade ouvert.
   * Retourne l'ID Supabase du trade créé.
   */
  async ouvrirTrade(trade: NouveauTrade): Promise<string> {
    const client = obtenirClientSupabaseAdmin();

    const { data, error } = await client
      .from('historique_trades')
      .insert({
        paire: trade.paire,
        direction: trade.direction,
        taille_position: trade.taillePosition,
        prix_entree: trade.prixEntree,
        stop_loss: trade.stopLoss,
        take_profit: trade.takeProfit,
        decision_agent: trade.resultatPipeline as unknown as Record<string, unknown> | undefined,
      })
      .select('id')
      .single();

    if (error || !data) {
      log.error({ erreur: error?.message }, 'Erreur ouverture trade');
      throw new Error(`Impossible d'enregistrer le trade: ${error?.message}`);
    }

    log.info({ id: data.id, paire: trade.paire, direction: trade.direction }, 'Trade ouvert');
    return data.id;
  }

  /** Ferme un trade et enregistre le profit/perte */
  async fermerTrade(idTrade: string, fermeture: FermetureTrade): Promise<void> {
    const client = obtenirClientSupabaseAdmin();

    const { error } = await client
      .from('historique_trades')
      .update({
        prix_sortie: fermeture.prixSortie,
        profit_perte: fermeture.profitPerte,
        statut: 'ferme',
        ferme_le: new Date().toISOString(),
      })
      .eq('id', idTrade);

    if (error) {
      log.error({ idTrade, erreur: error.message }, 'Erreur fermeture trade');
      throw new Error(`Impossible de fermer le trade: ${error.message}`);
    }

    const signe = fermeture.profitPerte >= 0 ? '+' : '';
    log.info(
      { idTrade, prixSortie: fermeture.prixSortie, pnl: `${signe}${fermeture.profitPerte}` },
      'Trade fermé'
    );
  }

  /** Récupère l'historique des trades (les 50 derniers par défaut) */
  async listerTrades(
    options: { paire?: string; statut?: string; limite?: number } = {}
  ) {
    const client = obtenirClientSupabaseAdmin();
    let requete = client
      .from('historique_trades')
      .select('*')
      .order('cree_le', { ascending: false })
      .limit(options.limite ?? 50);

    if (options.paire) requete = requete.eq('paire', options.paire);
    if (options.statut) requete = requete.eq('statut', options.statut);

    const { data, error } = await requete;

    if (error) {
      log.error({ erreur: error.message }, 'Erreur lecture historique');
      throw new Error(`Erreur lecture trades: ${error.message}`);
    }

    return data ?? [];
  }

  /** Sauvegarde un signal d'agent pour analyse rétrospective */
  async sauvegarderSignal(
    resultat: ResultatPipeline & { paire: string; granularite: string; fournisseur: string }
  ): Promise<void> {
    const client = obtenirClientSupabaseAdmin();

    const { error } = await client.from('signaux_agents').insert({
      paire: resultat.paire,
      granularite: resultat.granularite,
      direction: resultat.analyse.direction,
      confiance: resultat.analyse.confiance,
      analyse: resultat.analyse as unknown as Record<string, unknown>,
      risque: resultat.risque as unknown as Record<string, unknown> | null,
      decision: resultat.decision as unknown as Record<string, unknown> | null,
      fournisseur: resultat.fournisseur,
      duree_ms: resultat.dureeTotaleMs,
    });

    if (error) {
      log.warn({ erreur: error.message }, 'Erreur sauvegarde signal (non critique)');
    }
  }
}
