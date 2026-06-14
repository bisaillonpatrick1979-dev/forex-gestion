import { NextRequest, NextResponse } from 'next/server';
import { creerClientsOanda } from '@forex/oanda-client';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:oanda:bougies' });

/**
 * GET /api/oanda/bougies/[paire]?granularite=H4&count=100
 * Retourne l'historique des bougies pour une paire.
 *
 * @exemple /api/oanda/bougies/EUR_USD?granularite=H4&count=50
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ paire: string }> }
): Promise<NextResponse> {
  try {
    const { paire } = await params;
    const { searchParams } = new URL(req.url);
    const granularite = searchParams.get('granularite') ?? 'H4';
    const count = Math.min(Number(searchParams.get('count') ?? '100'), 500);

    log.info({ paire, granularite, count }, 'Bougies demandées');

    const { rest } = creerClientsOanda();
    const bougies = await rest.obtenirBougies(paire, { granularite, count });

    return NextResponse.json({
      succes: true,
      paire,
      granularite,
      count: bougies.length,
      bougies,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur récupération bougies');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
