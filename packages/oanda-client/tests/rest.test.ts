import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ClientRestOanda } from '../src/rest.js';
import type { ConfigOanda } from '../src/types.js';

const configTest: ConfigOanda = {
  cleApi: 'cle-test-factice',
  idCompte: '001-001-12345678-001',
  environnement: 'practice',
};

// Mock global fetch pour les tests
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('ClientRestOanda', () => {
  it('initialise correctement le client practice', () => {
    const client = new ClientRestOanda(configTest);
    expect(client).toBeDefined();
  });

  describe('obtenirCompte', () => {
    it('retourne les informations du compte', async () => {
      const compteAttendu = {
        id: '001-001-12345678-001',
        alias: 'Mon compte test',
        currency: 'CAD',
        balance: '10000.00',
        unrealizedPL: '0.00',
        realizedPL: '250.00',
        nav: '10250.00',
        marginUsed: '0.00',
        marginAvailable: '10000.00',
        positionValue: '0.00',
        openTrades: 0,
        openPositions: 0,
        pendingOrders: 0,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ account: compteAttendu }),
      });

      const client = new ClientRestOanda(configTest);
      const compte = await client.obtenirCompte();

      expect(compte.id).toBe(configTest.idCompte);
      expect(compte.currency).toBe('CAD');
      expect(compte.balance).toBe('10000.00');
    });

    it('lève une erreur si l\'API retourne un status non-OK', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => '{"errorMessage": "Unauthorized"}',
      });

      const client = new ClientRestOanda(configTest);
      await expect(client.obtenirCompte()).rejects.toThrow('OANDA API 401');
    });
  });

  describe('obtenirBougies', () => {
    it('retourne les bougies pour EUR_USD H4', async () => {
      const bougiesAttendues = [
        {
          time: '2024-01-15T08:00:00.000000000Z',
          volume: 1234,
          complete: true,
          mid: { o: '1.08500', h: '1.08750', l: '1.08300', c: '1.08650' },
        },
      ];

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ candles: bougiesAttendues }),
      });

      const client = new ClientRestOanda(configTest);
      const bougies = await client.obtenirBougies('EUR_USD', { granularite: 'H4', count: 1 });

      expect(bougies).toHaveLength(1);
      expect(bougies[0]?.mid?.c).toBe('1.08650');
    });
  });

  describe('creerOrdreMarche', () => {
    it('crée un ordre d\'achat EUR_USD', async () => {
      const reponseAttendue = {
        orderCreateTransaction: {
          id: 'TX-001',
          type: 'MARKET_ORDER',
          time: '2024-01-15T10:00:00Z',
          instrument: 'EUR_USD',
          units: '1000',
        },
        relatedTransactionIDs: ['TX-001'],
        lastTransactionID: 'TX-001',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => reponseAttendue,
      });

      const client = new ClientRestOanda(configTest);
      const reponse = await client.creerOrdreMarche({
        instrument: 'EUR_USD',
        unites: 1000,
        stopLoss: '1.07500',
        takeProfit: '1.10000',
      });

      expect(reponse.orderCreateTransaction.id).toBe('TX-001');
      expect(fetchMock).toHaveBeenCalledOnce();
      // Vérifier que le corps de la requête contient les bons paramètres
      const appelFetch = fetchMock.mock.calls[0];
      const corps = JSON.parse(appelFetch?.[1]?.body as string);
      expect(corps.order.units).toBe('1000');
      expect(corps.order.stopLossOnFill.price).toBe('1.07500');
    });
  });
});
