import { describe, it, expect, vi, afterEach } from 'vitest';
import { ScraperCalendrierEconomique } from '../src/calendrier.js';
import { ScraperActualites } from '../src/actualites.js';

const fetchMock = vi.fn();

vi.stubGlobal('fetch', fetchMock);

afterEach(() => {
  vi.clearAllMocks();
});

describe('ScraperCalendrierEconomique', () => {
  it('retourne une liste vide si fetch échoue', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Réseau indisponible'));
    const scraper = new ScraperCalendrierEconomique();
    const evenements = await scraper.obtenirEvenementsSemaine();
    expect(evenements).toEqual([]);
  });

  it('parse correctement la réponse ForexFactory', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          title: 'Non-Farm Payrolls',
          country: 'USD',
          date: '2024-01-05',
          time: '13:30',
          impact: 'High Impact Expected',
          forecast: '200K',
          previous: '185K',
          actual: '',
        },
        {
          title: 'PMI Manufacturing',
          country: 'EUR',
          date: '2024-01-05',
          time: '09:00',
          impact: 'Medium Impact Expected',
          forecast: '44.5',
          previous: '44.2',
          actual: '44.8',
        },
      ],
    });

    const scraper = new ScraperCalendrierEconomique();
    const evenements = await scraper.obtenirEvenementsSemaine();

    expect(evenements).toHaveLength(2);
    expect(evenements[0]?.titre).toBe('Non-Farm Payrolls');
    expect(evenements[0]?.impact).toBe('fort');
    expect(evenements[1]?.impact).toBe('moyen');
    expect(evenements[1]?.valeurActuelle).toBe('44.8');
  });

  it('filtre par impact', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { title: 'NFP', country: 'USD', date: '2024-01-05', time: '13:30', impact: 'High Impact Expected', forecast: '', previous: '', actual: '' },
        { title: 'PMI', country: 'EUR', date: '2024-01-05', time: '09:00', impact: 'Low Impact Expected', forecast: '', previous: '', actual: '' },
      ],
    });

    const scraper = new ScraperCalendrierEconomique();
    const fortsOnly = await scraper.obtenirEvenementsSemaine({ impact: 'fort' });
    expect(fortsOnly).toHaveLength(1);
    expect(fortsOnly[0]?.titre).toBe('NFP');
  });
});

describe('ScraperActualites', () => {
  it('retourne liste vide si clé API manquante', async () => {
    delete process.env['NEWS_API_KEY'];
    const scraper = new ScraperActualites();
    const articles = await scraper.obtenirActualites('EUR/USD');
    expect(articles).toEqual([]);
  });

  it('détecte les devises dans le texte', async () => {
    process.env['NEWS_API_KEY'] = 'test-cle';
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        articles: [
          {
            title: 'EUR/USD rises as USD weakens',
            description: 'The EUR gained against the USD on Fed comments.',
            source: { name: 'Reuters' },
            url: 'https://example.com/article',
            publishedAt: '2024-01-15T10:00:00Z',
          },
        ],
      }),
    });

    const scraper = new ScraperActualites();
    const articles = await scraper.obtenirActualites('EUR/USD', 1);
    expect(articles).toHaveLength(1);
    expect(articles[0]?.devises).toContain('EUR');
    expect(articles[0]?.devises).toContain('USD');

    delete process.env['NEWS_API_KEY'];
  });
});
