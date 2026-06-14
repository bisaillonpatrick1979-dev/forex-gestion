import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ContexteMarche, AnalyseTechnique, ParametresRisque } from '../src/types.js';

// Mock du routeur IA pour éviter les appels réels aux APIs
vi.mock('@forex/api-switcher', () => ({
  routeurIA: {
    completer: vi.fn(),
    fournisseurActif: 'openai',
    modeleActif: 'gpt-4o-mini',
  },
}));

import { routeurIA } from '@forex/api-switcher';

const contexteTest: ContexteMarche = {
  paire: 'EUR_USD',
  granularite: 'H4',
  bougies: Array.from({ length: 10 }, (_, i) => ({
    time: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    volume: 1000 + i * 100,
    complete: true,
    mid: {
      o: '1.08500',
      h: '1.09000',
      l: '1.08000',
      c: '1.08750',
    },
  })),
  prixActuel: { bid: '1.08740', ask: '1.08760' },
  capitalDisponible: 10000,
};

const analyseValide: AnalyseTechnique = {
  paire: 'EUR_USD',
  granularite: 'H4',
  direction: 'ACHAT',
  confiance: 75,
  raisonnement: 'Tendance haussière forte sur H4 avec support à 1.085.',
  niveauxCles: {
    support: [1.085, 1.082],
    resistance: [1.095, 1.100],
    stoploss: 1.082,
    takeProfit: [1.095, 1.100],
  },
  indicateurs: {
    tendance: 'haussier',
    momentum: 'fort',
    volatilite: 'moyenne',
  },
  horodatage: new Date().toISOString(),
};

const parametresRisqueValides: ParametresRisque = {
  taillePosition: 5000,
  stopLoss: 1.082,
  takeProfits: [1.095, 1.100],
  ratioRisqueRecompense: 2.5,
  risqueEnPourcentage: 1.5,
  raisonnement: 'Position de 5000 unités avec 1.5% de risque.',
};

describe('Types ContexteMarche', () => {
  it('valide la structure du contexte de test', () => {
    expect(contexteTest.paire).toBe('EUR_USD');
    expect(contexteTest.bougies).toHaveLength(10);
    expect(contexteTest.prixActuel?.bid).toBe('1.08740');
  });
});

describe('Agent Analyste', () => {
  beforeEach(() => {
    vi.mocked(routeurIA.completer).mockResolvedValue({
      contenu: JSON.stringify({
        direction: 'ACHAT',
        confiance: 75,
        raisonnement: 'Tendance haussière sur H4.',
        niveauxCles: {
          support: [1.085],
          resistance: [1.095],
          stoploss: 1.082,
          takeProfit: [1.095],
        },
        indicateurs: {
          tendance: 'haussier',
          momentum: 'fort',
          volatilite: 'moyenne',
        },
      }),
      fournisseur: 'openai',
      modele: 'gpt-4o-mini',
    });
  });

  it('retourne une analyse avec direction et confiance', async () => {
    const { analyserMarche } = await import('../src/analyste/index.js');
    const analyse = await analyserMarche(contexteTest);

    expect(analyse.direction).toBe('ACHAT');
    expect(analyse.confiance).toBe(75);
    expect(analyse.paire).toBe('EUR_USD');
    expect(analyse.horodatage).toBeDefined();
  });
});

describe('Agent Gestionnaire des Risques', () => {
  beforeEach(() => {
    vi.mocked(routeurIA.completer).mockResolvedValue({
      contenu: JSON.stringify({
        taillePosition: 5000,
        stopLoss: 1.082,
        takeProfits: [1.095, 1.100],
        ratioRisqueRecompense: 2.5,
        risqueEnPourcentage: 1.5,
        raisonnement: 'Position calculée selon règle de 2%.',
      }),
      fournisseur: 'openai',
      modele: 'gpt-4o-mini',
    });
  });

  it('calcule les paramètres pour une analyse valide', async () => {
    const { calculerParametresRisque } = await import('../src/gestionnaire-risques/index.js');
    const params = await calculerParametresRisque(analyseValide, 10000);

    expect(params.taillePosition).toBe(5000);
    expect(params.risqueEnPourcentage).toBeLessThanOrEqual(2.0);
    expect(params.ratioRisqueRecompense).toBeGreaterThanOrEqual(1.5);
  });

  it('rejette les analyses avec confiance < 60', async () => {
    const { calculerParametresRisque } = await import('../src/gestionnaire-risques/index.js');
    const analysesFaible = { ...analyseValide, confiance: 55 };
    await expect(calculerParametresRisque(analysesFaible, 10000)).rejects.toThrow();
  });

  it('rejette les analyses neutres', async () => {
    const { calculerParametresRisque } = await import('../src/gestionnaire-risques/index.js');
    const analyseNeutre = { ...analyseValide, direction: 'NEUTRE' as const };
    await expect(calculerParametresRisque(analyseNeutre, 10000)).rejects.toThrow();
  });
});

describe('Agent Exécuteur', () => {
  beforeEach(() => {
    vi.mocked(routeurIA.completer).mockResolvedValue({
      contenu: JSON.stringify({
        statut: 'EXECUTER',
        direction: 'ACHAT',
        parametresOrdre: {
          unites: 5000,
          stopLoss: '1.08200',
          takeProfit: '1.09500',
        },
        raisonnement: 'Conditions favorables, exécution autorisée.',
      }),
      fournisseur: 'openai',
      modele: 'gpt-4o-mini',
    });
  });

  it('retourne une décision d\'exécution valide', async () => {
    const { deciderExecution } = await import('../src/executeur/index.js');
    const decision = await deciderExecution(analyseValide, parametresRisqueValides);

    expect(decision.statut).toBe('EXECUTER');
    expect(decision.instrument).toBe('EUR_USD');
    expect(decision.horodatage).toBeDefined();
  });
});
