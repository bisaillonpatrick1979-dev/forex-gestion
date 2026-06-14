import { NextResponse } from 'next/server';
import { ScraperCalendrierEconomique } from '@forex/scraper';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:calendrier' });

/**
 * GET /api/calendrier?impact=fort
 * Retourne les événements économiques de la semaine.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const impact = searchParams.get('impact') as 'fort' | 'moyen' | 'faible' | null;

    const scraper = new ScraperCalendrierEconomique();
    const evenements = await scraper.obtenirEvenementsSemaine({ impact: impact ?? undefined });

    log.debug({ count: evenements.length, impact }, 'Calendrier retourné');

    return NextResponse.json({ succes: true, count: evenements.length, evenements });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur calendrier');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
