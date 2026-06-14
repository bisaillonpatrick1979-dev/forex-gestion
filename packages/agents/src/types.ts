import type { Bougie, PaireDevises } from '@forex/oanda-client';

/** Signal généré par l'analyste technique */
export type DirectionSignal = 'ACHAT' | 'VENTE' | 'NEUTRE';

/** Niveau de confiance du signal (0-100) */
export type NiveauConfiance = number;

/** Résultat de l'analyse technique */
export interface AnalyseTechnique {
  paire: PaireDevises;
  granularite: string;
  direction: DirectionSignal;
  confiance: NiveauConfiance;
  raisonnement: string;
  niveauxCles: {
    support: number[];
    resistance: number[];
    stoploss: number;
    takeProfit: number[];
  };
  indicateurs: {
    tendance: string;
    momentum: string;
    volatilite: string;
  };
  horodatage: string;
}

/** Paramètres de gestion du risque pour un trade */
export interface ParametresRisque {
  taillePosition: number;     // en unités OANDA
  stopLoss: number;           // prix
  takeProfits: number[];      // niveaux TP (partiel possible)
  ratioRisqueRecompense: number;
  risqueEnPourcentage: number; // % du capital risqué
  raisonnement: string;
}

/** Décision de trading finale de l'exécuteur */
export type StatutDecision = 'EXECUTER' | 'ATTENDRE' | 'REJETER';

export interface DecisionExecution {
  statut: StatutDecision;
  instrument?: PaireDevises;
  direction?: DirectionSignal;
  parametresOrdre?: {
    unites: number;
    stopLoss: string;
    takeProfit: string;
  };
  raisonnement: string;
  horodatage: string;
}

/** Contexte de marché passé aux agents */
export interface ContexteMarche {
  paire: PaireDevises;
  bougies: Bougie[];
  granularite: string;
  prixActuel?: { bid: string; ask: string };
  capitalDisponible?: number;
  positionsOuvertes?: number;
}
