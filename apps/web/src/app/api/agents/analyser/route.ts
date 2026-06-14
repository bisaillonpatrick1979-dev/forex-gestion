import { NextRequest, NextResponse } from 'next/server';
import { analyserMarche } from '@forex/agents';
import { creerClientsOanda } from '@forex/oanda-client';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:agents:analyser' });

/**
 * POST /api/agents/analyser
 * Effectue uniquement l'analyse technique (Agent 1).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const corps = (await req.json()) as {
      paire?: string;
      granularite?: string;
    };

    const paire = corps.paire ?? 'EUR_USD';
    const granularite = corps.granularite ?? 'H4';

    log.info({ paire, granularite }, 'Analyse technique demandée');

    const { rest } = creerClientsOanda();
    const bougies = await rest.obtenirBougies(paire, { granularite, count: 100 });
    const prixActuels = await rest.obtenirPrix([paire]);

    const analyse = await analyserMarche({
      paire,
      bougies,
      granularite,
      prixActuel: prixActuels[paire],
    });

    return NextResponse.json({ succes: true, analyse });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur analyse technique');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
