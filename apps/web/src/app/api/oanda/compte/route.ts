import { NextResponse } from 'next/server';
import { creerClientsOanda } from '@forex/oanda-client';
import { creerLogger } from '@forex/logger';

const log = creerLogger({ module: 'api:oanda:compte' });

/**
 * GET /api/oanda/compte
 * Retourne les informations du compte OANDA configuré.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { rest } = creerClientsOanda();
    const compte = await rest.obtenirCompte();

    log.info({ balance: compte.balance }, 'Compte OANDA récupéré');

    return NextResponse.json({ succes: true, compte });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur récupération compte OANDA');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
