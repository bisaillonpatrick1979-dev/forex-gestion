/**
 * Types OANDA v20 — correspond à l'API REST officielle
 * Docs: https://developer.oanda.com/rest-live-v20/introduction/
 */

/** Environnements OANDA disponibles */
export type EnvironnementOanda = 'practice' | 'live';

/** Configuration du client OANDA */
export interface ConfigOanda {
  cleApi: string;
  idCompte: string;
  environnement: EnvironnementOanda;
}

/** Paire de devises (ex: EUR_USD, GBP_JPY) */
export type PaireDevises = string;

/** Granularité des bougies */
export type Granularite =
  | 'S5' | 'S10' | 'S15' | 'S30'
  | 'M1' | 'M2' | 'M4' | 'M5' | 'M10' | 'M15' | 'M30'
  | 'H1' | 'H2' | 'H3' | 'H4' | 'H6' | 'H8' | 'H12'
  | 'D' | 'W' | 'M';

/** Une bougie OHLC */
export interface Bougie {
  time: string;
  volume: number;
  complete: boolean;
  mid?: {
    o: string; // ouverture
    h: string; // haut
    l: string; // bas
    c: string; // clôture
  };
  bid?: { o: string; h: string; l: string; c: string };
  ask?: { o: string; h: string; l: string; c: string };
}

/** Cotation en temps réel */
export interface Cotation {
  type: 'PRICE';
  time: string;
  instrument: PaireDevises;
  tradeable: boolean;
  bids: Array<{ price: string; liquidity: number }>;
  asks: Array<{ price: string; liquidity: number }>;
  closeoutBid: string;
  closeoutAsk: string;
  status: 'tradeable' | 'non-tradeable';
}

/** Heartbeat du streaming */
export interface HeartbeatStream {
  type: 'HEARTBEAT';
  time: string;
}

/** Evénement de streaming (cotation ou heartbeat) */
export type EvenementStream = Cotation | HeartbeatStream;

/** Compte OANDA */
export interface Compte {
  id: string;
  alias: string;
  currency: string;
  balance: string;
  unrealizedPL: string;
  realizedPL: string;
  nav: string;
  marginUsed: string;
  marginAvailable: string;
  positionValue: string;
  openTrades: number;
  openPositions: number;
  pendingOrders: number;
}

/** Sens d'un trade */
export type SensTrade = 'BUY' | 'SELL';

/** Paramètres de création d'un ordre au marché */
export interface ParamsOrdreMarche {
  instrument: PaireDevises;
  unites: number; // positif = achat, négatif = vente
  stopLoss?: string; // prix stop loss
  takeProfit?: string; // prix take profit
  trailingStop?: number; // pips de trailing stop
}

/** Réponse d'une transaction d'ordre */
export interface ReponseOrdre {
  orderCreateTransaction: {
    id: string;
    type: string;
    time: string;
    instrument: PaireDevises;
    units: string;
  };
  relatedTransactionIDs: string[];
  lastTransactionID: string;
}

/** Options pour la requête de bougies */
export interface OptionsBougies {
  granularite?: Granularite;
  count?: number;
  depuis?: string; // ISO 8601
  jusqua?: string; // ISO 8601
  prix?: 'M' | 'B' | 'A' | 'BA'; // Mid, Bid, Ask, Both
}
