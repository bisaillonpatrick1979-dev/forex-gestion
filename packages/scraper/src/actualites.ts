import { creerLogger } from '@forex/logger';
import type { ArticleActualite } from '../types.js';

const log = creerLogger({ module: 'scraper:actualites' });

/**
 * Scraper d'actualités financières via NewsAPI (gratuit jusqu'à 1000 req/jour).
 * Alternative: CurrencyNewsAPI, FinnHub (tier gratuit).
 *
 * Variable requise: NEWS_API_KEY (gratuit sur newsapi.org)
 */
export class ScraperActualites {
  private readonly urlBase = 'https://newsapi.org/v2/everything';
  private readonly cleApi: string | undefined;

  constructor() {
    this.cleApi = process.env['NEWS_API_KEY'];
  }

  estDisponible(): boolean {
    return Boolean(this.cleApi);
  }

  /**
   * Récupère les dernières actualités pour une devise ou une paire.
   * @exemple await scraper.obtenirActualites('EUR/USD', 10)
   */
  async obtenirActualites(
    sujet: string,
    limite: number = 10
  ): Promise<ArticleActualite[]> {
    if (!this.cleApi) {
      log.warn('NEWS_API_KEY non configurée, actualités non disponibles');
      return [];
    }

    const params = new URLSearchParams({
      q: sujet,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: String(Math.min(limite, 100)),
      apiKey: this.cleApi,
    });

    try {
      log.debug({ sujet, limite }, 'Récupération actualités');

      const reponse = await fetch(`${this.urlBase}?${params.toString()}`, {
        signal: AbortSignal.timeout(8_000),
      });

      if (!reponse.ok) {
        throw new Error(`NewsAPI HTTP ${reponse.status}`);
      }

      const donnees = (await reponse.json()) as {
        articles: Array<{
          title: string;
          description: string | null;
          source: { name: string };
          url: string;
          publishedAt: string;
        }>;
      };

      return donnees.articles.map((art, i) => ({
        id: `news-${i}-${Date.now()}`,
        titre: art.title,
        resume: art.description ?? '',
        source: art.source.name,
        url: art.url,
        date: art.publishedAt,
        devises: this.extraireDevises(art.title + ' ' + (art.description ?? '')),
        sentimentEstime: undefined, // Sera traité par l'agent analyste
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ erreur: message }, 'Erreur récupération actualités');
      return [];
    }
  }

  /** Extrait les devises mentionnées dans un texte */
  private extraireDevises(texte: string): string[] {
    const devises = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'CHF', 'AUD', 'NZD'];
    return devises.filter((d) => texte.toUpperCase().includes(d));
  }
}
