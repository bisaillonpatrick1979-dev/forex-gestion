import { NextRequest, NextResponse } from 'next/server';
import { executerPipelineComplet } from '@forex/agents';
import { creerClientsOanda } from '@forex/oanda-client';
import { creerLogger } from '@forex/logger';
import { DepotTrades } from '@forex/supabase';
import { ScraperCalendrierEconomique } from '@forex/scraper';

const log = creerLogger({ module: 'api:agents:pipeline' });

/**
 * POST /api/agents/pipeline
 *
 * Exécute le pipeline complet 3-agents, vérifie le calendrier macro,
 * persiste le signal dans Supabase et exécute le trade si demandé.
 *
 * Corps:
 * {
 *   paire: string,          // ex: "EUR_USD"
 *   granularite?: string,   // ex: "H4"
 *   capital?: number,
 *   executerTrade?: boolean // false par défaut (sécurité)
 * }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const corps = (await req.json()) as {
      paire?: string;
      granularite?: string;
      capital?: number;
      executerTrade?: boolean;
    };

    const paire = corps.paire ?? 'EUR_USD';
    const granularite = corps.granularite ?? 'H4';
    const capital = corps.capital ?? 10000;
    const executerTrade = corps.executerTrade ?? false;

    log.info({ paire, granularite, capital, executerTrade }, 'Pipeline 3-agents démarré');

    // Vérifier les annonces macro imminentes AVANT d'analyser
    const calendrier = new ScraperCalendrierEconomique();
    const devises = paire.split('_');
    const annoncesImminentes = await calendrier.annoncesImminentes(devises, 30);

    if (annoncesImminentes.length > 0) {
      const titres = annoncesImminentes.map((e) => e.titre).join(', ');
      log.warn({ annonces: titres }, 'Annonces macro imminentes — pipeline suspendu');
      return NextResponse.json({
        succes: false,
        raison: 'ANNONCE_IMMINENTE',
        message: `Annonce(s) à fort impact dans 30 min: ${titres}. Analyse suspendue par sécurité.`,
        annonces: annoncesImminentes,
      });
    }

    // Récupérer les données OANDA
    const { rest } = creerClientsOanda();
    const [bougies, prixActuels] = await Promise.all([
      rest.obtenirBougies(paire, { granularite, count: 100 }),
      rest.obtenirPrix([paire]),
    ]);

    // Exécuter le pipeline 3-agents
    const resultat = await executerPipelineComplet(
      { paire, bougies, granularite, prixActuel: prixActuels[paire] },
      capital,
      0
    );

    // Persister le signal dans Supabase (non-bloquant)
    try {
      const depot = new DepotTrades();
      await depot.sauvegarderSignal({
        ...resultat,
        paire,
        granularite,
        fournisseur: 'openai', // sera dynamic après
      });
    } catch (errPersist) {
      // Non critique: ne pas bloquer la réponse si Supabase est absent
      log.warn({ err: String(errPersist) }, 'Persistance signal ignorée (Supabase non configuré)');
    }

    // Exécuter le trade si demandé et si la décision est EXECUTER
    let idTrade: string | null = null;
    if (
      executerTrade &&
      resultat.decision?.statut === 'EXECUTER' &&
      resultat.decision.parametresOrdre
    ) {
      const { unites, stopLoss, takeProfit } = resultat.decision.parametresOrdre;
      const ordre = await rest.creerOrdreMarche({
        instrument: paire,
        unites,
        stopLoss,
        takeProfit,
      });

      // Enregistrer le trade dans Supabase
      try {
        const depot = new DepotTrades();
        idTrade = await depot.ouvrirTrade({
          paire,
          direction: resultat.decision.direction ?? 'ACHAT',
          taillePosition: unites,
          prixEntree: parseFloat(prixActuels[paire]?.ask ?? '0'),
          stopLoss: parseFloat(stopLoss),
          takeProfit: parseFloat(takeProfit),
          resultatPipeline: resultat,
        });
      } catch (errTrade) {
        log.warn({ err: String(errTrade) }, 'Erreur persistance trade');
      }

      log.info({ ordreId: ordre.orderCreateTransaction.id, idTrade }, 'Trade exécuté');
    }

    return NextResponse.json({
      succes: true,
      paire,
      granularite,
      idTrade,
      ...resultat,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ erreur: message }, 'Erreur pipeline agents');
    return NextResponse.json({ succes: false, erreur: message }, { status: 500 });
  }
}
