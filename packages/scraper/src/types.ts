/** Un événement économique du calendrier */
export interface EvenementEconomique {
  id: string;
  date: string;          // ISO 8601
  heure: string;         // HH:MM UTC
  devises: string[];     // ex: ['USD', 'EUR']
  titre: string;         // ex: "Non-Farm Payrolls"
  impact: 'faible' | 'moyen' | 'fort';
  valeurPrecedente?: string;
  valeurPrevue?: string;
  valeurActuelle?: string | null;
}

/** Un article d'actualité financier */
export interface ArticleActualite {
  id: string;
  titre: string;
  resume: string;
  source: string;
  url: string;
  date: string;
  devises: string[];     // Devises mentionnées
  sentimentEstime?: 'positif' | 'negatif' | 'neutre';
}

/** Indicateur macroeconomique (donnée fondamentale) */
export interface IndicateurMacro {
  code: string;          // ex: 'USD_CPI', 'EUR_GDP'
  nom: string;
  pays: string;
  devise: string;
  valeur: number;
  unite: string;         // ex: '%', 'Mds$'
  date: string;
  source: string;
}

/** Options de cache pour les scrapes */
export interface OptionsCache {
  /** Durée de validité du cache en minutes */
  ttlMinutes?: number;
}
