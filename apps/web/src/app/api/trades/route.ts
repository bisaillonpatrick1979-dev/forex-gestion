import { NextResponse } from 'next/server';
import { DepotTrades } from '@forex/supabase';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:trades' });

/**
 * GET /api/trades?paire=EUR_USD&statut=ouvert&limite=20
 * Liste l'historique des trades depuis Supabase.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const paire = searchParams.get('paire') ?? undefined;
    const statut = searchParams.get('statut') ?? undefined;
    const limite = Math.min(Number(searchParams.get('limite') ?? '50'), 200);

    const depot = new DepotTrades();
    const trades = await depot.listerTrades({ paire, statut, limite });

    // Calculer les stats sommaires
    const totalTrades = trades.length;
    const tradesGagnants = trades.filter((t) => (t.profit_perte ?? 0) > 0).length;
    const pnlTotal = trades.reduce((acc, t) => acc + (t.profit_perte ?? 0), 0);

    log.debug({ totalTrades, pnlTotal }, 'Historique trades récupéré');

    return NextResponse.json({
      succes: true,
      stats: {
        total: totalTrades,
        gagnants: tradesGagnants,
        perdants: totalTrades - tradesGagnants,
        tauxReussite: totalTrades > 0 ? ((tradesGagnants / totalTrades) * 100).toFixed(1) : '0',
        pnlTotal: pnlTotal.toFixed(2),
      },
      trades,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur lecture trades');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
