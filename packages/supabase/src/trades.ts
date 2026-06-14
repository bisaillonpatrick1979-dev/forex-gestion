import { creerLogger } from '@forex/logger';
import { obtenirClientSupabaseAdmin } from './client.js';

const log = creerLogger({ module: 'supabase:trades' });

export interface NouveauTrade {
  paire: string;
  direction: 'ACHAT' | 'VENTE';
  taillePosition: number;
  prixEntree: number;
  stopLoss: number;
  takeProfit: number;
  // Résultat pipeline sérialisé en JSON — on évite d'importer @forex/agents ici
  resultatPipeline?: Record<string, unknown>;
}

export interface FermetureTrade {
  prixSortie: number;
  profitPerte: number;
}

export class DepotTrades {
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
        decision_agent: trade.resultatPipeline ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      log.error({ erreur: error?.message }, 'Erreur ouverture trade');
      throw new Error(`Impossible d'enregistrer le trade: ${error?.message}`);
    }

    const id = (data as { id: string }).id;
    log.info({ id, paire: trade.paire, direction: trade.direction }, 'Trade ouvert');
    return id;
  }

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

    if (error) throw new Error(`Impossible de fermer le trade: ${error.message}`);

    const signe = fermeture.profitPerte >= 0 ? '+' : '';
    log.info({ idTrade, pnl: `${signe}${fermeture.profitPerte}` }, 'Trade fermé');
  }

  async listerTrades(
    options: { paire?: string; statut?: string; limite?: number } = {}
  ): Promise<Record<string, unknown>[]> {
    const client = obtenirClientSupabaseAdmin();
    let requete = client
      .from('historique_trades')
      .select('*')
      .order('cree_le', { ascending: false })
      .limit(options.limite ?? 50);

    if (options.paire) requete = requete.eq('paire', options.paire);
    if (options.statut) requete = requete.eq('statut', options.statut);

    const { data, error } = await requete;
    if (error) throw new Error(`Erreur lecture trades: ${error.message}`);
    return (data ?? []) as Record<string, unknown>[];
  }

  async sauvegarderSignal(signal: Record<string, unknown>): Promise<void> {
    const client = obtenirClientSupabaseAdmin();
    const { error } = await client.from('signaux_agents').insert(signal);
    if (error) log.warn({ erreur: error.message }, 'Erreur sauvegarde signal (non critique)');
  }
}
