import { routeurIA } from '@forex/api-switcher';
import { creerLogger } from '@forex/logger';
import type { ContexteMarche, AnalyseTechnique } from '../types.js';

const log = creerLogger({ module: 'agents:analyste' });

/** Prompt système de l'Analyste Technique */
const PROMPT_SYSTEME_ANALYSTE = `Tu es un analyste technique expert en marchés forex avec 20 ans d'expérience.
Tu analyses les graphiques de prix, les indicateurs techniques et les patterns de bougies.

Tes compétences incluent:
- Identification des tendances (EMA, SMA, MACD)
- Niveaux de support et résistance (Fibonacci, swing highs/lows)
- Patterns de bougies japonaises (englobante, étoile du soir, marteau, etc.)
- Oscillateurs (RSI, Stochastique, CCI)
- Analyse multi-timeframe
- Sétup de risque/récompense

Règles ABSOLUES:
1. Tu réponds UNIQUEMENT en JSON valide (aucun texte hors du JSON)
2. La direction est soit "ACHAT", "VENTE", ou "NEUTRE"
3. La confiance est un entier entre 0 et 100
4. Le raisonnement est concis (3-5 phrases maximum)
5. Si les données sont insuffisantes, direction = "NEUTRE" et confiance < 30

Format de réponse obligatoire:
{
  "direction": "ACHAT" | "VENTE" | "NEUTRE",
  "confiance": 0-100,
  "raisonnement": "string",
  "niveauxCles": {
    "support": [prix1, prix2],
    "resistance": [prix1, prix2],
    "stoploss": prix,
    "takeProfit": [tp1, tp2]
  },
  "indicateurs": {
    "tendance": "haussier|baissier|lateral",
    "momentum": "fort|moyen|faible",
    "volatilite": "haute|moyenne|basse"
  }
}`;

/**
 * Formate les données de bougies pour le contexte de l'agent.
 * Envoie les 50 dernières bougies pour garder le contexte concis.
 */
function formaterBougies(contexte: ContexteMarche): string {
  const dernieresBougies = contexte.bougies.slice(-50);
  const lignes = dernieresBougies.map((b) => {
    const mid = b.mid;
    if (!mid) return null;
    return `${b.time.slice(0, 16)} O:${mid.o} H:${mid.h} L:${mid.l} C:${mid.c} V:${b.volume}`;
  }).filter(Boolean);

  return lignes.join('\n');
}

/**
 * Agent Analyste Technique.
 * Analyse les données de marché et génère un signal directionnel avec niveaux clés.
 */
export async function analyserMarche(contexte: ContexteMarche): Promise<AnalyseTechnique> {
  log.info(
    { paire: contexte.paire, granularite: contexte.granularite, nbBougies: contexte.bougies.length },
    'Début analyse technique'
  );

  const donnesBougies = formaterBougies(contexte);
  const prixActuel = contexte.prixActuel
    ? `\nPrix actuel — Bid: ${contexte.prixActuel.bid} | Ask: ${contexte.prixActuel.ask}`
    : '';

  const promptUtilisateur = `Analyse la paire ${contexte.paire} en ${contexte.granularite}.\n${prixActuel}\n\nDonnées OHLCV (50 dernières bougies):\n${donnesBougies}\n\nFournis ton analyse technique complète au format JSON.`;

  const resultat = await routeurIA.completer({
    messages: [
      { role: 'system', content: PROMPT_SYSTEME_ANALYSTE },
      { role: 'user', content: promptUtilisateur },
    ],
    temperature: 0.3, // faible température pour analyses cohérentes
    maxTokens: 1024,
  });

  // Parser la réponse JSON de l'agent
  let analyseJSON: Omit<AnalyseTechnique, 'paire' | 'granularite' | 'horodatage'>;
  try {
    // Extraire le JSON si encapsulé dans des backticks
    const contenuNettoye = resultat.contenu
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    analyseJSON = JSON.parse(contenuNettoye) as typeof analyseJSON;
  } catch (err) {
    log.error({ contenu: resultat.contenu, err }, 'Impossible de parser la réponse JSON de l\'analyste');
    throw new Error(`Réponse JSON invalide de l'analyste: ${String(err)}`);
  }

  const analyse: AnalyseTechnique = {
    paire: contexte.paire,
    granularite: contexte.granularite,
    horodatage: new Date().toISOString(),
    ...analyseJSON,
  };

  log.info(
    { direction: analyse.direction, confiance: analyse.confiance, fournisseur: resultat.fournisseur },
    'Analyse technique complète'
  );

  return analyse;
}
