/**
 * @forex/agents
 *
 * Les 3 agents IA du système de gestion forex:
 * 1. Analyste Technique — analyse les graphiques et génère des signaux
 * 2. Gestionnaire des Risques — calcule la taille de position et les niveaux de risque
 * 3. Exécuteur — prend la décision finale d'exécuter ou non
 *
 * Pipeline complet:
 * analyserMarche() → calculerParametresRisque() → deciderExecution()
 */

export { analyserMarche } from './analyste/index.js';
export { calculerParametresRisque } from './gestionnaire-risques/index.js';
export { deciderExecution } from './executeur/index.js';
export type {
  AnalyseTechnique,
  ParametresRisque,
  DecisionExecution,
  ContexteMarche,
  DirectionSignal,
  StatutDecision,
  NiveauConfiance,
} from './types.js';

/**
 * Exécute le pipeline complet des 3 agents pour une paire donnée.
 * Pratique pour les appels depuis l'API Next.js.
 */
export { executerPipelineComplet } from './pipeline.js';
