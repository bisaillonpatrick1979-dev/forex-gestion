import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Document } from '@forex/rag';

// Mock du client Supabase pour éviter les appels réseau
vi.mock('../src/client.js', () => {
  const mockClient = {
    from: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ error: null }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    single: vi.fn().mockResolvedValue({ data: { id: 'uuid-test' }, error: null }),
    rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  return {
    obtenirClientSupabase: () => mockClient,
    obtenirClientSupabaseAdmin: () => mockClient,
  };
});

import { DepotTrades } from '../src/trades.js';

describe('DepotTrades', () => {
  let depot: DepotTrades;

  beforeEach(() => {
    depot = new DepotTrades();
    vi.clearAllMocks();
  });

  describe('ouvrirTrade', () => {
    it('retourne un ID après insertion', async () => {
      const id = await depot.ouvrirTrade({
        paire: 'EUR_USD',
        direction: 'ACHAT',
        taillePosition: 5000,
        prixEntree: 1.0875,
        stopLoss: 1.082,
        takeProfit: 1.095,
      });
      expect(id).toBe('uuid-test');
    });
  });

  describe('listerTrades', () => {
    it('retourne une liste vide par défaut (mock)', async () => {
      const trades = await depot.listerTrades();
      expect(Array.isArray(trades)).toBe(true);
    });

    it('accepte les filtres paire et statut', async () => {
      const trades = await depot.listerTrades({ paire: 'EUR_USD', statut: 'ouvert', limite: 10 });
      expect(Array.isArray(trades)).toBe(true);
    });
  });
});
