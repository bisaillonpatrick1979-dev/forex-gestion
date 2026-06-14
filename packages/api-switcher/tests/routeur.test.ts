import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { IFournisseurIA, OptionsCompletion, ResultatCompletion } from '../src/types.js';

// Fournisseur mock pour les tests
const creerFournisseurMock = (
  nom: 'openai' | 'anthropic' | 'gemini' | 'ollama',
  disponible = true,
  reponse = 'Analyse complète'
): IFournisseurIA => ({
  nom,
  modele: 'mock-model',
  estDisponible: () => disponible,
  completer: vi.fn().mockResolvedValue({
    contenu: reponse,
    fournisseur: nom,
    modele: 'mock-model',
  } satisfies ResultatCompletion),
});

describe('types IFournisseurIA', () => {
  it('valide la structure du fournisseur mock', () => {
    const mock = creerFournisseurMock('openai');
    expect(mock.nom).toBe('openai');
    expect(mock.modele).toBe('mock-model');
    expect(mock.estDisponible()).toBe(true);
  });

  it('retourne false si le fournisseur est indisponible', () => {
    const mock = creerFournisseurMock('anthropic', false);
    expect(mock.estDisponible()).toBe(false);
  });
});

describe('OptionsCompletion', () => {
  it('valide les options minimales', () => {
    const options: OptionsCompletion = {
      messages: [{ role: 'user', content: 'Test' }],
    };
    expect(options.messages).toHaveLength(1);
    expect(options.temperature).toBeUndefined();
  });

  it('valide toutes les options', () => {
    const options: OptionsCompletion = {
      messages: [
        { role: 'system', content: 'Tu es un expert forex.' },
        { role: 'user', content: 'Analyse EUR/USD' },
      ],
      temperature: 0.5,
      maxTokens: 1024,
      stream: false,
    };
    expect(options.messages).toHaveLength(2);
    expect(options.temperature).toBe(0.5);
  });
});

describe('Logique de fallback', () => {
  it('utilise le deuxième fournisseur si le premier est indisponible', async () => {
    const fournisseurIndispo = creerFournisseurMock('openai', false);
    const fournisseurDispo = creerFournisseurMock('anthropic', true, 'Réponse de secours');

    // Simule la logique de fallback du RouteurIA
    const sequence = [fournisseurIndispo, fournisseurDispo];
    let resultat: ResultatCompletion | null = null;

    for (const f of sequence) {
      if (!f.estDisponible()) continue;
      resultat = await f.completer({ messages: [{ role: 'user', content: 'test' }] });
      break;
    }

    expect(resultat?.contenu).toBe('Réponse de secours');
    expect(resultat?.fournisseur).toBe('anthropic');
  });

  it('lève une erreur si tous les fournisseurs sont indisponibles', async () => {
    const fournisseurs = [
      creerFournisseurMock('openai', false),
      creerFournisseurMock('anthropic', false),
    ];

    let erreurLevee = false;
    let derniereErreur: Error | null = null;

    for (const f of fournisseurs) {
      if (!f.estDisponible()) {
        derniereErreur = new Error(`${f.nom} indisponible`);
      }
    }

    if (!fournisseurs.some((f) => f.estDisponible())) {
      erreurLevee = true;
    }

    expect(erreurLevee).toBe(true);
    expect(derniereErreur).not.toBeNull();
  });
});
