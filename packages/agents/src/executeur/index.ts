import { routeurIA } from '@forex/api-switcher';
import { creerLogger } from '@forex/logger';
import type { AnalyseTechnique, ParametresRisque, DecisionExecution } from '../types.js';

const log = creerLogger({ module: 'agents:executeur' });

/** Prompt système de l'Exécuteur */
const PROMPT_SYSTEME_EXECUTEUR = `Tu es un exécuteur de trades expérimenté pour un fonds de gestion forex.
Ton rôle est de prendre la décision FINALE d'exécuter, d'attendre ou de rejeter un trade.

Tu reçois:
1. L'analyse technique de l'Analyste
2. Les paramètres de risque du Gestionnaire
3. Le contexte macro du marché

Critères d'exécution:
- Confiance analyste ≥ 70% = exécution possible
- Confiance analyste 60-69% = attendre confirmation
- Confiance analyste < 60% = rejeter
- Ratio R/R < 1.5 = rejeter
- Plus de 5 positions ouvertes = attendre

Critères de rejet immédiat:
- Annonces économiques majeures dans les 30 prochaines minutes (NFP, CPI, BCE, Fed)
- Spread anormalement élevé (> 3 pips EUR/USD)
- Liquidité faible (weekend, fêtes)

Règles ABSOLUES:
1. Réponds UNIQUEMENT en JSON valide
2. statut est soit "EXECUTER", "ATTENDRE", ou "REJETER"
3. Le raisonnement DOIT expliquer la décision clairement
4. Si statut = "EXECUTER", les paramètres d'ordre sont obligatoires

Format:
{
  "statut": "EXECUTER" | "ATTENDRE" | "REJETER",
  "direction": "ACHAT" | "VENTE" | null,
  "parametresOrdre": {
    "unites": entier,
    "stopLoss": "string prix",
    "takeProfit": "string prix"
  } | null,
  "raisonnement": "string"
}`;

/**
 * Agent Exécuteur de Trades.
 * Prend la décision finale d'exécuter, attendre ou rejeter un trade
 * en synthétisant l'analyse et les paramètres de risque.
 */
export async function deciderExecution(
  analyse: AnalyseTechnique,
  parametresRisque: ParametresRisque,
  contexteAdditionnel: {
    heureLocale?: string;
    annoncesPrevues?: string[];
    spreadActuel?: number;
  } = {}
): Promise<DecisionExecution> {
  log.info(
    {
      paire: analyse.paire,
      direction: analyse.direction,
      confiance: analyse.confiance,
      taillePosition: parametresRisque.taillePosition,
    },
    'Décision d\'exécution en cours'
  );

  const annonces = contexteAdditionnel.annoncesPrevues?.length
    ? `Annonces économiques à venir: ${contexteAdditionnel.annoncesPrevues.join(', ')}`
    : 'Aucune annonce majeure prévue';

  const spread = contexteAdditionnel.spreadActuel
    ? `Spread actuel: ${contexteAdditionnel.spreadActuel} pips`
    : 'Spread non disponible';

  const promptUtilisateur = `Décide si ce trade doit être exécuté, attendu ou rejeté:

=== ANALYSE TECHNIQUE ===
Paire: ${analyse.paire}
Direction: ${analyse.direction}
Confiance: ${analyse.confiance}%
Tendance: ${analyse.indicateurs.tendance}
Momentum: ${analyse.indicateurs.momentum}
Volatilité: ${analyse.indicateurs.volatilite}
Raisonnement analyste: ${analyse.raisonnement}

=== PARAMÈTRES DE RISQUE ===
Taille position: ${parametresRisque.taillePosition} unités
Stop Loss: ${parametresRisque.stopLoss}
Take Profits: ${parametresRisque.takeProfits.join(', ')}
Ratio R/R: 1:${parametresRisque.ratioRisqueRecompense}
Risque: ${parametresRisque.risqueEnPourcentage}% du capital
Raisonnement gestionnaire: ${parametresRisque.raisonnement}

=== CONTEXTE MARCHÉ ===
${annonces}
${spread}
${contexteAdditionnel.heureLocale ? `Heure locale: ${contexteAdditionnel.heureLocale}` : ''}

Prends ta décision finale et explique-la clairement. Réponds en JSON.`;

  const resultat = await routeurIA.completer({
    messages: [
      { role: 'system', content: PROMPT_SYSTEME_EXECUTEUR },
      { role: 'user', content: promptUtilisateur },
    ],
    temperature: 0.2,
    maxTokens: 512,
  });

  let decisionJSON: Omit<DecisionExecution, 'instrument' | 'horodatage'>;
  try {
    const contenuNettoye = resultat.contenu
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    decisionJSON = JSON.parse(contenuNettoye) as typeof decisionJSON;
  } catch (err) {
    log.error({ contenu: resultat.contenu, err }, 'Impossible de parser la réponse de l\'exécuteur');
    throw new Error(`Réponse JSON invalide de l'exécuteur: ${String(err)}`);
  }

  const decision: DecisionExecution = {
    ...decisionJSON,
    instrument: analyse.paire,
    horodatage: new Date().toISOString(),
  };

  log.info(
    { statut: decision.statut, raisonnement: decision.raisonnement },
    'Décision finale prise'
  );

  return decision;
}
