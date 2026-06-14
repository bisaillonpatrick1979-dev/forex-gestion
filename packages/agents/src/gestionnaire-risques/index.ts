import { routeurIA } from '@forex/api-switcher';
import { creerLogger } from '@forex/logger';
import type { AnalyseTechnique, ParametresRisque } from '../types.js';

const log = creerLogger({ module: 'agents:gestionnaire-risques' });

/** Prompt système du Gestionnaire des Risques */
const PROMPT_SYSTEME_GESTIONNAIRE = `Tu es un gestionnaire des risques expert en trading forex institutionnel.
Ton rôle est de calculer la taille de position optimale et les niveaux de risque pour chaque trade.

Principes fondamentaux:
- Ne jamais risquer plus de 2% du capital par trade (règle d'or)
- Ratio risque/récompense minimum: 1:2 (préférer 1:3)
- Position sizing basé sur la distance au stop loss
- Ajustement selon la volatilité (ATR)
- Diversification: max 3 positions corrélées simultanées

Formule de taille de position:
  taillePosition = (capital * risqueMax%) / (distanceStop * valeurPip)

Pour OANDA:
- 1 lot standard = 100,000 unités
- 1 mini lot = 10,000 unités
- 1 micro lot = 1,000 unités
- Valeur pip EUR/USD = 10 CAD par lot standard

Règles ABSOLUES:
1. Tu réponds UNIQUEMENT en JSON valide
2. taillePosition doit être un multiple de 1000 unités minimum
3. risqueEnPourcentage ne dépasse JAMAIS 2.0
4. Le raisonnement explique le calcul

Format de réponse:
{
  "taillePosition": entier (unités OANDA),
  "stopLoss": nombre (prix),
  "takeProfits": [tp1, tp2],
  "ratioRisqueRecompense": nombre,
  "risqueEnPourcentage": nombre (max 2.0),
  "raisonnement": "string"
}`;

/**
 * Agent Gestionnaire des Risques.
 * Calcule la taille de position optimale et les paramètres de risque
 * basés sur l'analyse technique et le capital disponible.
 */
export async function calculerParametresRisque(
  analyse: AnalyseTechnique,
  capitalDisponible: number,
  positionsOuvertes: number = 0
): Promise<ParametresRisque> {
  log.info(
    {
      paire: analyse.paire,
      direction: analyse.direction,
      confiance: analyse.confiance,
      capital: capitalDisponible,
      positionsOuvertes,
    },
    'Calcul des paramètres de risque'
  );

  // Refuser les analyses neutres ou de faible confiance
  if (analyse.direction === 'NEUTRE' || analyse.confiance < 60) {
    log.warn(
      { direction: analyse.direction, confiance: analyse.confiance },
      'Analyse insuffisante pour le calcul du risque'
    );
    throw new Error(
      `Signal trop faible (direction: ${analyse.direction}, confiance: ${analyse.confiance}%). Minimum requis: direction définie + confiance ≥ 60%`
    );
  }

  const promptUtilisateur = `Calcule les paramètres de risque pour ce trade:

Paire: ${analyse.paire}
Direction: ${analyse.direction}
Confiance de l'analyste: ${analyse.confiance}%
Capital disponible: $${capitalDisponible.toLocaleString('fr-CA')}
Positions déjà ouvertes: ${positionsOuvertes}

Niveaux de l'analyste technique:
- Support(s): ${analyse.niveauxCles.support.join(', ')}
- Résistance(s): ${analyse.niveauxCles.resistance.join(', ')}
- Stop Loss suggéré: ${analyse.niveauxCles.stoploss}
- Take Profit(s) suggéré(s): ${analyse.niveauxCles.takeProfit.join(', ')}

Contexte: ${analyse.raisonnement}

Calcule la taille de position optimale selon nos règles de risque. Réponds en JSON.`;

  const resultat = await routeurIA.completer({
    messages: [
      { role: 'system', content: PROMPT_SYSTEME_GESTIONNAIRE },
      { role: 'user', content: promptUtilisateur },
    ],
    temperature: 0.1, // très déterministe pour les calculs financiers
    maxTokens: 512,
  });

  let parametresJSON: Omit<ParametresRisque, 'raisonnement'> & { raisonnement: string };
  try {
    const contenuNettoye = resultat.contenu
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parametresJSON = JSON.parse(contenuNettoye) as typeof parametresJSON;
  } catch (err) {
    log.error({ contenu: resultat.contenu, err }, 'Impossible de parser la réponse du gestionnaire');
    throw new Error(`Réponse JSON invalide du gestionnaire: ${String(err)}`);
  }

  // Validation de sécurité: jamais plus de 2% de risque
  if (parametresJSON.risqueEnPourcentage > 2.0) {
    log.error(
      { risque: parametresJSON.risqueEnPourcentage },
      'ALERTE: Risque dépasse 2% — rejeté'
    );
    throw new Error(`Risque calculé (${parametresJSON.risqueEnPourcentage}%) dépasse le maximum autorisé de 2%`);
  }

  const parametres: ParametresRisque = parametresJSON;

  log.info(
    {
      taillePosition: parametres.taillePosition,
      risque: `${parametres.risqueEnPourcentage}%`,
      rr: `1:${parametres.ratioRisqueRecompense}`,
    },
    'Paramètres de risque calculés'
  );

  return parametres;
}
