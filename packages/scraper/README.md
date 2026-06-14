# @forex/scraper

Scraper de données macro-économiques et actualités forex. Sources gratuites.

## Sources de données

| Source | Contenu | Clé API | Limite gratuite |
|--------|---------|---------|----------------|
| ForexFactory | Calendrier économique | Aucune | Pas de limite |
| NewsAPI | Actualités financières | Oui | 1 000 req/jour |
| FRED | Indicateurs macro US | Oui | Illimité |

## Variables d'environnement

```bash
# NewsAPI: clé gratuite sur https://newsapi.org
NEWS_API_KEY=

# FRED: clé gratuite sur https://fred.stlouisfed.org
FRED_API_KEY=
```

## Usage

```typescript
import {
  ScraperCalendrierEconomique,
  ScraperActualites,
  ScraperIndicateursMacro
} from '@forex/scraper';

// Calendrier économique
const calendrier = new ScraperCalendrierEconomique();
const annoncesFortes = await calendrier.obtenirEvenementsSemaine({ impact: 'fort' });

// Vérifier annonces imminentes avant un trade
const imminentes = await calendrier.annoncesImminentes(['EUR', 'USD'], 30);
if (imminentes.length > 0) {
  console.log('Attention: annonce majeure dans 30 min!');
}

// Actualités
const actualites = new ScraperActualites();
const articles = await actualites.obtenirActualites('EUR/USD', 10);

// Indicateurs macro
const macro = new ScraperIndicateursMacro();
const indicateursUSD = await macro.obtenirIndicateursUSD();
```
