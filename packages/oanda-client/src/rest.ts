import { creerLogger } from '@forex/logger';
import type {
  ConfigOanda,
  EnvironnementOanda,
  PaireDevises,
  Bougie,
  OptionsBougies,
  Compte,
  ParamsOrdreMarche,
  ReponseOrdre,
} from './types.js';

const log = creerLogger({ module: 'oanda-client:rest' });

/** URLs de base selon l'environnement */
const URLS_API: Record<EnvironnementOanda, string> = {
  practice: 'https://api-fxpractice.oanda.com/v3',
  live: 'https://api-fxtrade.oanda.com/v3',
};

/**
 * Client REST OANDA v20.
 * Encapsule tous les appels HTTP à l'API OANDA avec logging et gestion d'erreurs.
 */
export class ClientRestOanda {
  private readonly urlBase: string;
  private readonly idCompte: string;
  private readonly entetes: Record<string, string>;

  constructor(config: ConfigOanda) {
    this.urlBase = URLS_API[config.environnement];
    this.idCompte = config.idCompte;
    this.entetes = {
      Authorization: `Bearer ${config.cleApi}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    log.info({ environnement: config.environnement, compte: config.idCompte }, 'Client OANDA REST initialisé');
  }

  /** Exécute un appel HTTP générique avec gestion d'erreur OANDA */
  private async requete<T>(chemin: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.urlBase}${chemin}`;
    log.debug({ methode: options.method ?? 'GET', url }, 'Requête OANDA');

    const reponse = await fetch(url, {
      ...options,
      headers: { ...this.entetes, ...options.headers },
    });

    if (!reponse.ok) {
      const corps = await reponse.text();
      log.error({ status: reponse.status, url, corps }, 'Erreur OANDA API');
      throw new Error(`OANDA API ${reponse.status}: ${corps}`);
    }

    return reponse.json() as Promise<T>;
  }

  /** Récupère les informations du compte */
  async obtenirCompte(): Promise<Compte> {
    const donnees = await this.requete<{ account: Compte }>(
      `/accounts/${this.idCompte}`
    );
    log.info({ balance: donnees.account.balance }, 'Compte récupéré');
    return donnees.account;
  }

  /**
   * Récupère l'historique des bougies pour une paire et une granularité données.
   *
   * @exemple
   * const bougies = await client.obtenirBougies('EUR_USD', { granularite: 'H4', count: 100 });
   */
  async obtenirBougies(
    paire: PaireDevises,
    options: OptionsBougies = {}
  ): Promise<Bougie[]> {
    const params = new URLSearchParams();
    params.set('granularity', options.granularite ?? 'H1');
    params.set('count', String(options.count ?? 100));
    params.set('price', options.prix ?? 'M');

    if (options.depuis) params.set('from', options.depuis);
    if (options.jusqua) params.set('to', options.jusqua);

    const donnees = await this.requete<{ candles: Bougie[] }>(
      `/instruments/${paire}/candles?${params.toString()}`
    );

    log.debug({ paire, count: donnees.candles.length }, 'Bougies récupérées');
    return donnees.candles;
  }

  /**
   * Crée un ordre au marché (achat ou vente).
   * Les unités positives = achat, négatives = vente.
   */
  async creerOrdreMarche(params: ParamsOrdreMarche): Promise<ReponseOrdre> {
    const corps: Record<string, unknown> = {
      order: {
        type: 'MARKET',
        instrument: params.instrument,
        units: String(params.unites),
        timeInForce: 'FOK', // Fill Or Kill
      },
    };

    // Ajouter stop loss si spécifié
    if (params.stopLoss) {
      (corps['order'] as Record<string, unknown>)['stopLossOnFill'] = {
        price: params.stopLoss,
        timeInForce: 'GTC',
      };
    }

    // Ajouter take profit si spécifié
    if (params.takeProfit) {
      (corps['order'] as Record<string, unknown>)['takeProfitOnFill'] = {
        price: params.takeProfit,
        timeInForce: 'GTC',
      };
    }

    log.info(
      { instrument: params.instrument, unites: params.unites },
      'Création ordre marché'
    );

    const reponse = await this.requete<ReponseOrdre>(
      `/accounts/${this.idCompte}/orders`,
      { method: 'POST', body: JSON.stringify(corps) }
    );

    log.info(
      { ordreId: reponse.orderCreateTransaction.id },
      'Ordre créé avec succès'
    );

    return reponse;
  }

  /** Ferme toutes les positions ouvertes pour une paire */
  async fermerPosition(paire: PaireDevises, sens: 'long' | 'short' | 'all' = 'all'): Promise<void> {
    const corps = sens === 'all'
      ? { longUnits: 'ALL', shortUnits: 'ALL' }
      : sens === 'long'
      ? { longUnits: 'ALL' }
      : { shortUnits: 'ALL' };

    await this.requete(`/accounts/${this.idCompte}/positions/${paire}/close`, {
      method: 'PUT',
      body: JSON.stringify(corps),
    });

    log.info({ paire, sens }, 'Position fermée');
  }

  /** Récupère le spread actuel (bid/ask) pour une paire */
  async obtenirPrix(paires: PaireDevises[]): Promise<Record<string, { bid: string; ask: string }>> {
    const params = new URLSearchParams({ instruments: paires.join(',') });
    const donnees = await this.requete<{
      prices: Array<{ instrument: string; bids: Array<{ price: string }>; asks: Array<{ price: string }> }>;
    }>(`/accounts/${this.idCompte}/pricing?${params.toString()}`);

    const resultat: Record<string, { bid: string; ask: string }> = {};
    for (const prix of donnees.prices) {
      resultat[prix.instrument] = {
        bid: prix.bids[0]?.price ?? '0',
        ask: prix.asks[0]?.price ?? '0',
      };
    }

    return resultat;
  }
}
