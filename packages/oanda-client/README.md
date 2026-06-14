# @forex/oanda-client

Client officiel OANDA v20 pour forex-gestion. Supporte les appels REST et le streaming temps réel.

## Usage

```typescript
import { creerClientsOanda } from '@forex/oanda-client';

// Configure depuis OANDA_API_KEY, OANDA_ACCOUNT_ID, OANDA_ENV
const { rest, stream } = creerClientsOanda();

// Récupérer les bougies 4H
const bougies = await rest.obtenirBougies('EUR_USD', {
  granularite: 'H4',
  count: 200,
});

// Streaming cotations
const arreter = stream.abonner(
  ['EUR_USD', 'GBP_USD'],
  (cotation) => console.log(cotation)
);

// Fermer le stream
arreter();

// Passer un ordre
const ordre = await rest.creerOrdreMarche({
  instrument: 'EUR_USD',
  unites: 1000,       // positif = achat
  stopLoss: '1.0800',
  takeProfit: '1.1000',
});
```

## Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `OANDA_API_KEY` | requis | Clé API OANDA |
| `OANDA_ACCOUNT_ID` | requis | ID du compte |
| `OANDA_ENV` | `practice` | `practice` ou `live` |
