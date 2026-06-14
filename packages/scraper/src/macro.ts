import { creerLogger } from '@forex/logger';
import type { IndicateurMacro } from '../types.js';

const log = creerLogger({ module: 'scraper:macro' });

/**
 * Indicateurs macro-économiques depuis FRED (Federal Reserve Bank of St. Louis).
 * API 100% gratuite, clé gratuite sur fred.stlouisfed.org.
 */
export class ScraperIndicateursMacro {
  private readonly urlBase = 'https://api.stlouisfed.org/fred/series/observations';
  private readonly cleApi: string | undefined;

  constructor() {
    this.cleApi = process.env['FRED_API_KEY'];
  }

  estDisponible(): boolean {
    return Boolean(this.cleApi);
  }

  /**
   * Récupère un indicateur FRED (ex: CPIAUCSL = inflation US, GDP = PIB).
   * Voir: https://fred.stlouisfed.org/categories
   */
  async obtenirIndicateur(
    seriesId: string,
    meta: { nom: string; pays: string; devise: string; unite: string }
  ): Promise<IndicateurMacro | null> {
    if (!this.cleApi) {
      log.warn('FRED_API_KEY non configurée');
      return null;
    }

    const params = new URLSearchParams({
      series_id: seriesId,
      api_key: this.cleApi,
      file_type: 'json',
      limit: '1',
      sort_order: 'desc',
    });

    try {
      const reponse = await fetch(`${this.urlBase}?${params.toString()}`, {
        signal: AbortSignal.timeout(8_000),
      });

      if (!reponse.ok) throw new Error(`FRED HTTP ${reponse.status}`);

      const donnees = (await reponse.json()) as {
        observations: Array<{ date: string; value: string }>;
      };

      const obs = donnees.observations[0];
      if (!obs || obs.value === '.') return null;

      return {
        code: `${meta.devise}_${seriesId}`,
        nom: meta.nom,
        pays: meta.pays,
        devise: meta.devise,
        valeur: parseFloat(obs.value),
        unite: meta.unite,
        date: obs.date,
        source: 'FRED',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ seriesId, erreur: message }, 'Erreur récupération FRED');
      return null;
    }
  }

  /**
   * Récupère un paquet d'indicateurs clés pour les devises majeures.
   * Utilisé pour enrichir le contexte RAG avec des données fondamentales.
   */
  async obtenirIndicateursUSD(): Promise<IndicateurMacro[]> {
    const series: Array<[string, Omit<IndicateurMacro, 'code' | 'valeur' | 'date' | 'source'>]> = [
      ['CPIAUCSL', { nom: 'Inflation US (CPI)', pays: 'États-Unis', devise: 'USD', unite: '%' }],
      ['UNRATE', { nom: 'Taux de chômage US', pays: 'États-Unis', devise: 'USD', unite: '%' }],
      ['FEDFUNDS', { nom: 'Taux directeur Fed', pays: 'États-Unis', devise: 'USD', unite: '%' }],
      ['GDP', { nom: 'PIB US', pays: 'États-Unis', devise: 'USD', unite: 'Mds$' }],
    ];

    const resultats = await Promise.allSettled(
      series.map(([id, meta]) => this.obtenirIndicateur(id, meta))
    );

    return resultats
      .filter((r): r is PromiseFulfilledResult<IndicateurMacro | null> => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter((v): v is IndicateurMacro => v !== null);
  }
}
