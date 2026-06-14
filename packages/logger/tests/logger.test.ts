import { describe, it, expect, vi } from 'vitest';
import { creerLogger, logger } from '../src/index.js';

describe('creerLogger', () => {
  it('retourne un logger avec la méthode info', () => {
    const log = creerLogger({ module: 'test' });
    expect(typeof log.info).toBe('function');
    expect(typeof log.error).toBe('function');
    expect(typeof log.debug).toBe('function');
    expect(typeof log.warn).toBe('function');
  });

  it('crée des loggers indépendants par module', () => {
    const logA = creerLogger({ module: 'module-a' });
    const logB = creerLogger({ module: 'module-b' });
    // Vérifie que ce sont des instances distinctes
    expect(logA).not.toBe(logB);
  });

  it('accepte un contexte additionnel', () => {
    const log = creerLogger({
      module: 'test',
      contexte: { version: '1.0.0', env: 'test' },
    });
    // Le logger ne doit pas échouer lors de l'utilisation
    expect(() => log.info('message de test')).not.toThrow();
  });
});

describe('logger racine', () => {
  it('est disponible directement', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('ne lance pas d’exception lors du logging', () => {
    expect(() => logger.info({ données: 42 }, 'test')).not.toThrow();
    expect(() => logger.error(new Error('test'), 'erreur test')).not.toThrow();
  });
});
