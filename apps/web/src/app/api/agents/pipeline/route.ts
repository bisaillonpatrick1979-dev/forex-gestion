import { NextRequest, NextResponse } from 'next/server';
import { executerPipelineComplet } from '@forex/agents';
import { creerClientsOanda } from '@forex/oanda-client';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:agents:pipeline' });

/**
 * POST /api/agents/pipeline
 *
 * Exécute le pipeline complet 3-agents pour une paire donnée.
 *
 * Corps de la requête:
 * {
 *   paire: string,          // ex: "EUR_USD"
 *   granularite?: string,   // ex: "H4" (défaut)
 *   capital?: number,       // capital disponible en $
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const corps = (await req.json()) as {
      paire?: string;
      granularite?: string;
      capital?: number;
    };

    const paire = corps.paire ?? 'EUR_USD';
    const granularite = corps.granularite ?? 'H4';
    const capital = corps.capital ?? 10000;

    log.info({ paire, granularite, capital }, 'Pipeline 3-agents démarré');

    // Récupérer les bougies OANDA
    const { rest } = creerClientsOanda();
    const bougies = await rest.obtenirBougies(paire, { granularite, count: 100 });
    const prixActuels = await rest.obtenirPrix([paire]);
    const prixActuel = prixActuels[paire];

    // Exécuter le pipeline
    const resultat = await executerPipelineComplet(
      { paire, bougies, granularite, prixActuel },
      capital,
      0
    );

    return NextResponse.json({
      succes: true,
      paire,
      granularite,
      ...resultat,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur pipeline agents');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
