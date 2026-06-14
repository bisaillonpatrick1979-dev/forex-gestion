import { creerLogger } from '@forex/logger';
import { analyserMarche } from './analyste/index.js';
import { calculerParametresRisque } from './gestionnaire-risques/index.js';
import { deciderExecution } from './executeur/index.js';
import type { ContexteMarche, AnalyseTechnique, ParametresRisque, DecisionExecution } from './types.js';

const log = creerLogger({ module: 'agents:pipeline' });

/** Résultat complet du pipeline 3-agents */
export interface ResultatPipeline {
  analyse: AnalyseTechnique;
  risque: ParametresRisque | null;
  decision: DecisionExecution | null;
  erreurs: string[];
  dureeTotaleMs: number;
}

/**
 * Exécute le pipeline complet: Analyste → Gestionnaire → Exécuteur.
 * Les étapes de risque et d'exécution sont optionnelles si l'analyse échoue.
 *
 * @param contexte - Données de marché (bougies, prix actuel, capital)
 * @param capitalDisponible - Capital en dollars pour le sizing
 * @param positionsOuvertes - Nombre de positions actuellement ouvertes
 */
export async function executerPipelineComplet(
  contexte: ContexteMarche,
  capitalDisponible: number = 10000,
  positionsOuvertes: number = 0
): Promise<ResultatPipeline> {
  const debut = Date.now();
  const erreurs: string[] = [];

  log.info(
    { paire: contexte.paire, capital: capitalDisponible },
    'Début du pipeline 3-agents'
  );

  // Étape 1: Analyse technique (obligatoire)
  const analyse = await analyserMarche(contexte);

  // Étape 2: Gestion des risques (seulement si signal suffisant)
  let risque: ParametresRisque | null = null;
  if (analyse.direction !== 'NEUTRE' && analyse.confiance >= 60) {
    try {
      risque = await calculerParametresRisque(analyse, capitalDisponible, positionsOuvertes);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ erreur: message }, 'Étape risque ignorée');
      erreurs.push(`Risque: ${message}`);
    }
  } else {
    log.info({ direction: analyse.direction, confiance: analyse.confiance }, 'Signal faible — étape risque ignorée');
  }

  // Étape 3: Décision d'exécution (seulement si risque calculé)
  let decision: DecisionExecution | null = null;
  if (risque) {
    try {
      decision = await deciderExecution(analyse, risque, {
        heureLocale: new Date().toLocaleTimeString('fr-CA', { timeZone: 'America/Toronto' }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log.warn({ erreur: message }, 'Étape exécution ignorée');
      erreurs.push(`Exécution: ${message}`);
    }
  }

  const dureeTotaleMs = Date.now() - debut;

  log.info(
    {
      paire: contexte.paire,
      decision: decision?.statut ?? 'N/A',
      dureeMs: dureeTotaleMs,
      erreurs: erreurs.length,
    },
    'Pipeline 3-agents terminé'
  );

  return { analyse, risque, decision, erreurs, dureeTotaleMs };
}
