/**
 * @forex/scraper
 *
 * Scraper de données pour forex-gestion.
 * Sources: ForexFactory (calendrier), NewsAPI (actualités), FRED (macro).
 * Toutes gratuites avec clés API freemium.
 */

export { ScraperCalendrierEconomique } from './calendrier.js';
export { ScraperActualites } from './actualites.js';
export { ScraperIndicateursMacro } from './macro.js';
export type {
  EvenementEconomique,
  ArticleActualite,
  IndicateurMacro,
  OptionsCache,
} from './types.js';
