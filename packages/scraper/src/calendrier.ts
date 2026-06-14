import { creerLogger } from '@forex/logger';
import type { EvenementEconomique } from './types.js';

const log = creerLogger({ module: 'scraper:calendrier' });

export class ScraperCalendrierEconomique {
  private readonly urlApi: string;
  private cache: { donnees: EvenementEconomique[]; expiresAt: number } | null = null;

  constructor() {
    this.urlApi = 'https://nfs.faireconomy.media/ff_calendar_thisweek.json';
  }

  async obtenirEvenementsSemaine(
    options: { impact?: 'fort' | 'moyen' | 'faible' | null } = {}
  ): Promise<EvenementEconomique[]> {
    const maintenant = Date.now();

    if (this.cache && this.cache.expiresAt > maintenant) {
      log.debug('Calendrier depuis cache');
      return this.filtrerParImpact(this.cache.donnees, options.impact);
    }

    try {
      log.info('Récupération calendrier économique ForexFactory');
      const reponse = await fetch(this.urlApi, {
        headers: { 'User-Agent': 'forex-gestion/0.1.0 (analyse personnelle)' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!reponse.ok) throw new Error(`Calendrier HTTP ${reponse.status}`);

      const donneesBrutes = (await reponse.json()) as Array<{
        title: string;
        country: string;
        date: string;
        time: string;
        impact: string;
        forecast: string;
        previous: string;
        actual: string;
      }>;

      const evenements: EvenementEconomique[] = donneesBrutes.map((evt, i) => ({
        id: `ff-${i}-${evt.date}`,
        date: evt.date,
        heure: evt.time,
        devises: [evt.country],
        titre: evt.title,
        impact: this.normaliserImpact(evt.impact),
        valeurPrecedente: evt.previous || undefined,
        valeurPrevue: evt.forecast || undefined,
        valeurActuelle: evt.actual || null,
      }));

      this.cache = { donnees: evenements, expiresAt: maintenant + 30 * 60 * 1000 };
      log.info({ count: evenements.length }, 'Calendrier récupéré');
      return this.filtrerParImpact(evenements, options.impact);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ erreur: message }, 'Impossible de récupérer le calendrier, retour liste vide');
      return [];
    }
  }

  async annoncesImminentes(
    devisesAEviter: string[],
    fenetreMinutes: number = 30
  ): Promise<EvenementEconomique[]> {
    const evenements = await this.obtenirEvenementsSemaine({ impact: 'fort' });
    const maintenant = new Date();
    const limite = new Date(maintenant.getTime() + fenetreMinutes * 60 * 1000);

    return evenements.filter((evt) => {
      const dateEvt = new Date(`${evt.date}T${evt.heure}:00Z`);
      const devisesConcernees = evt.devises.some((d: string) =>
        devisesAEviter.some((da) => da.includes(d))
      );
      return devisesConcernees && dateEvt >= maintenant && dateEvt <= limite;
    });
  }

  private normaliserImpact(impact: string): EvenementEconomique['impact'] {
    const i = impact.toLowerCase();
    if (i.includes('high') || i.includes('red')) return 'fort';
    if (i.includes('medium') || i.includes('orange')) return 'moyen';
    return 'faible';
  }

  private filtrerParImpact(
    evenements: EvenementEconomique[],
    impact?: string | null
  ): EvenementEconomique[] {
    if (!impact) return evenements;
    return evenements.filter((e) => e.impact === impact);
  }
}
